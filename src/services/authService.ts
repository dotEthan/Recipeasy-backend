import { Request } from "express";
import jwt, { JwtPayload } from 'jsonwebtoken';

import { EmailAuthCodeDocument, LoginAttempt } from "../types/auth";
import {
    AuthVerificationCodesRepository,
    AuthLoginAttemptRepository,
} from "../repositories/auth/authRepository";
import { EmailService } from "./emailService";
import { ObjectId, WithId } from "mongodb";
import { UserRepository } from "../repositories/user/userRepository";
import { StandardResponse } from "../types/responses";
import { AppError } from "../util/appError";

/**
 * Handles all Authorization related services
 * @todo Ensure all errors are handled
 * @todo Add logging
 * @todo BOW TO ZOD PARSING!
 */
// 

export class AuthService {

    constructor(
        private authLoginAttemptRepository: AuthLoginAttemptRepository,
        private authVerificationCodesRepository: AuthVerificationCodesRepository,
        private emailService: EmailService,
        private userRepository: UserRepository,
    ) {}

  /**
   * Logs all login attempts
   * @group Logging - Auth logs
   * @todo test req.ip is working in production
   * @param {Request} - Request object
   * @param {boolean} - Was successul
   * @param {string} - Error message
   * @example
   * const authService = useAuthService();
   * await authService.logLoginAttempt(req, false, errorMessage);
   */  
    public async logLoginAttempt(req: Request, success: boolean, errorMessage?: string)  {
        console.log('errormsg:', errorMessage)
        const loginData: LoginAttempt = {
            userId: req.user?._id,
            ipAddress: req.ip,
            userAgent: req.headers['user-agent'],
            timestamp: new Date(),
            success,
            errorMessage: success ? undefined : errorMessage,
        };
        const loginAttemptDoc = await this.authLoginAttemptRepository.create(loginData);
        if (!loginAttemptDoc) throw new AppError('Logging login attempts failed, log and move on', 500);
    }

    /**
     * Create Verifaction Code and email to user email
     * @todo update with proper code instead of 'test' when in prod
     * @group Security - Bot trap
     * @param {string} email - User's email
     * @param {string} displayName - User's display Name
     * @param {ObjectId} userId - User's _id
     * @return {boolean} - A boolean representing whether the code was emailed successfully
     * @example
     * const authService = useAuthService();
     * await authService.setAndSendVerificationCode('test@test.com', 'James', '1234abcd');
     */
    public async setAndSendVerificationCode(email: string, displayName: string, userId: ObjectId): Promise<boolean> {
        const verificationCode = Math.floor(100000 + Math.random() * 900000);
        console.log('verificationCode: ', verificationCode.toString())
        const response = await this.authVerificationCodesRepository.createVerificationCode({ 
            userId,
            code: verificationCode.toString(),
            createdAt: new Date(),
            updatedAt: new Date()
        });
        
        console.log(`sending email: ${email} for ${displayName}`)
        const info = await this.emailService.sendEmailToUser('emailVerificationCode', displayName, email, 'test');
        if (!info) throw Error('email sending failed');
        console.log(`Message sent: ${info.messageId} message response: ${info.response}`);
        if (info.rejected.length > 0) throw new AppError('email rejected, what now?', 500);
        // TODO Look at this, and what to send back, or all
        console.log('create verificationCode response: ', response);
        return true;
    }

    /**
     * Get User verification Code
     * @group Security - Bot trap
     * @param {ObjectId} userId - User's _id
     * @return {EmailAuthCodeDocument} - User._id, code, and created/updatedAt
     * @example
     * const authService = useAuthService();
     * await authService.getVerificationCode('1234abcd');
     */
    public async getVerificationCode(userId: ObjectId): Promise<WithId<EmailAuthCodeDocument> | null> {
        return this.authVerificationCodesRepository.getVerificationCode(userId);
    }

    /**
     * Check User verification Code
     * @group Security - Bot trap
     * @param {ObjectId} userId - User's _id
     * @param {string} code - client entered verification code
     * @return {boolean} true - verification success
     * @example
     * const authService = useAuthService();
     * await authService.getVerificationCode('1234abcd', 'xyz987);
     */
    public async checkVerificationCode(userId: ObjectId, code: string): Promise<boolean> {
        let isVerified = false;
        
        console.log('userId: ', userId)
        const vCode = await this.authVerificationCodesRepository.getVerificationCode(userId);
        console.log('storedcode: ', vCode?.code)
        console.log('storedcode: ', typeof vCode?.code)
        console.log('sentcode: ', code)
        console.log('sentcode: ', typeof code)
        if (vCode?.code && code === vCode.code) isVerified = true;
        console.log('isVerfied: ', isVerified);

        return isVerified;
    }
    
    /**
     * delete User verification Code
     * @group Security - Bot trap
     * @param {ObjectId} userId - User's _id
     * @example
     * const authService = useAuthService();
     * await authService.deleteVerificationCode('1234abcd', 'xyz987');
     */
    public async deleteVerificationCode(userId: ObjectId) {
        await this.authVerificationCodesRepository.deleteVerificationCode(userId);
        console.log('deleted email verifciation code')
    }

    /**
     * Validate Password Token
     * @group Security - Bot trap
     * @param {string} token - password reset token
     * @return {boolean} true - validation success
     * @example
     * const authService = useAuthService();
     * await authService.validatePasswordToken('xyz987');
     */
    public async validatePasswordToken(token: string, type: string): Promise<StandardResponse> {
        const secret = (process.env.NODE_ENV !== 'prod') ? process.env.JWT_SECRET_PROD : process.env.JWT_SECRET_DEV;
        if (!secret) throw new AppError('validatePasswordToken - Env JWT_SECRET_PROD/DEV not set', 500);

        const decoded = jwt.verify(token, secret) as JwtPayload;
        if (decoded.type !== type) {
            throw new AppError('validatePasswordToken - Invalid token type', 400);
        }

        const userId = decoded.userId;
        
        if (!userId) throw new AppError('validatePasswordToken - Token UserId not found', 401);
        return {success: true, data: userId};
    }
}