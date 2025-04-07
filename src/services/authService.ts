import { Request } from "express";
import jwt, { JwtPayload } from 'jsonwebtoken';

import { LoginAttempt } from "../types/auth";
import {
    AuthVerificationCodesRepository,
    AuthLoginAttemptRepository,
} from "../repositories/auth/authRepository";
import { EmailService } from "./emailService";
import { ObjectId } from "mongodb";
import { UserRepository } from "../repositories/user/userRepository";
import { StandardResponse } from "../types/responses";

export class AuthService {
    private authLoginAttemptRepository: AuthLoginAttemptRepository;
    private authVerificationCodesRepository: AuthVerificationCodesRepository;
    private emailService: EmailService;
    private userRepository: UserRepository;

    constructor(
        AuthLoginAttemptRepository: AuthLoginAttemptRepository,
        AuthVerificationCodesRepository: AuthVerificationCodesRepository,
        EmailService: EmailService,
        UserRepository: UserRepository,
    ) {
        this.authVerificationCodesRepository = AuthVerificationCodesRepository;
        this.authLoginAttemptRepository = AuthLoginAttemptRepository;
        this.emailService = EmailService;
        this.userRepository = UserRepository;
    }


    async logLoginAttempt(req: Request, success: boolean, errorMessage?: string)  {
        // TODO test req.ip is working in production
        console.log('errormsg:', errorMessage)
        const loginData: LoginAttempt = {
            userId: new ObjectId(req.user?._id),
            ipAddress: req.ip,
            userAgent: req.headers['user-agent'],
            timestamp: new Date(),
            success,
            errorMessage: success ? undefined : errorMessage,
        };
        await this.authLoginAttemptRepository.create(loginData);
        return;
    }

    async setAndSendVerificationCode(email: string, displayName: string, userId: ObjectId): Promise<boolean> {
        const verificationCode = Math.floor(100000 + Math.random() * 900000);
        console.log(`sending email: ${email} for ${displayName}`)

        const info = await this.emailService.sendEmailToUser('emailVerificationCode', displayName, email, 'test');
        if (!info) throw Error('email sending failed');
        console.log("Message sent: %s", info.messageId);
        console.log('verificationCode: ', verificationCode.toString())
        const response = await this.authVerificationCodesRepository.createVerificationCode({ 
            userId,
            code: verificationCode.toString(),
            createdAt: new Date(),
        });
        // TODO Look at this, and what to send back, or all
        console.log('set and send verificationCode response: ', response);
        return true;
    }

    async checkVerificationCode(userId: ObjectId, code: string): Promise<boolean> {
        let isVerified = false;
        const vCode = await this.authVerificationCodesRepository.findVerificationCode(userId);
        if (vCode?.verificationCode && parseInt(code) === vCode.verificationCode) isVerified = true;
        console.log('isVerfied: ', isVerified);

        return isVerified;
    }
    async deleteVerificationCode(userId: ObjectId) {
        await this.authVerificationCodesRepository.deleteVerificationCode(userId);
        console.log('deleted email verifciation code')
    }

    async validatePasswordToken(token: string): Promise<StandardResponse> {
        const secret = (process.env.NODE_ENV !== 'prod') ? process.env.JWT_SECRET_PROD : process.env.JWT_SECRET_DEV;
        if (!secret) throw new Error('Env JWT_SECRET_PROD/DEV not set');

        const decoded = await jwt.verify(token, secret) as JwtPayload;
        const userId = decoded.userId;

        const user = await this.userRepository.findById(new ObjectId(userId));
        if(!user) throw new Error('No user found validating password token');

        return {success: true}
    }
}