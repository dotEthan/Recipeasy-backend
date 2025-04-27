import { ObjectId, WithId } from "mongodb";

import { AuthVerificationCodesRepository } from "../repositories/auth/authRepository";
import { EmailService } from "./emailService";
import { EmailAuthCodeDocument } from "../types/auth";
import { ServerError } from "../errors";
import { createVerificationCodeSchema } from "../schemas/admin.schema";
import { StandardResponse } from "../types/responses";

/**
 * Handles all new user Email Verification related services
 * @todo Ensure all errors are handled
 * @todo Add logging
 * @todo BOW TO ZOD PARSING!
 */
// 

export class EmailVerificationService {

    constructor(
        private authVerificationCodesRepository: AuthVerificationCodesRepository,
        private emailService: EmailService,
    ) {}

    /**
     * Create Verifaction Code and email to user email
     * @todo Once email working, get error codes and map to proper statuscodes
     * @group Registration Flow - Email Verification
     * @param {string} email - User's email
     * @param {string} displayName - User's display Name
     * @param {ObjectId} userId - User's _id
     * @return {boolean} - A boolean representing whether the code was emailed successfully
     * @throws {ObjectId} userId - User's _id
     * @example
     * const authService = useAuthService();
     * await authService.setAndSendVerificationCode('test@test.com', 'James', '1234abcd');
     */
    public async setAndSendVerificationCode(email: string, displayName: string, userId: ObjectId): Promise<StandardResponse> {
        const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
        const createVerifyCodeData = { 
            userId,
            code: verificationCode,
            createdAt: new Date(),
            updatedAt: new Date()
        };

        createVerificationCodeSchema.parse(createVerifyCodeData)
        await this.authVerificationCodesRepository.createVerificationCode(createVerifyCodeData);

        const info = await this.emailService.sendEmailToUser('emailVerificationCode', displayName, email, verificationCode);
        if (!info) throw new ServerError('email sending failed');
        if (info.rejected.length > 0) {
            console.log('setAndSendVerificationCode info.response: ', info.response)
            // (SMTP error codes)
            // const match = info.response.match(/^\d{3}| \d{3}/); // Match first 3 digits or 3 digits after a space
            // const code = match ? parseInt(match[0].trim()) : null;
            throw new ServerError('email rejected, retry or new email, 3 retries, new email');
        }

        console.log(`Verification Email sent: ${info.messageId}, code: ${verificationCode}, message response: ${info.response}`);
        return { success: (info.rejected.length === 0)};
    }

    /**
     * Get User verification Code
     * @group Registration Flow - Email Verification
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
     * @group Registration Flow - Email Verification
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
     * @group Registration Flow - Email Verification
     * @param {ObjectId} userId - User's _id
     * @example
     * const authService = useAuthService();
     * await authService.deleteVerificationCode('1234abcd', 'xyz987');
     */
    public async deleteVerificationCode(userId: ObjectId) {
        await this.authVerificationCodesRepository.deleteVerificationCode(userId);
        console.log('deleted email verifciation code')
    }

}