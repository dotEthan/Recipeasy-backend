import { ObjectId, WithId } from "mongodb";

import { AuthVerificationCodesRepository } from "../repositories/auth/authRepository";
import { EmailService } from "./emailService";
import { EmailAuthCodeDocument } from "../types/auth";
import { ForbiddenError, ServerError } from "../errors";
import { createVerificationCodeSchema } from "../schemas/admin.schema";
import { CheckEmailVerificationResponse, StandardResponse } from "../types/responses";
import { ErrorCode } from "../types/enums";
import { zodValidationWrapper } from "../util/zodParseWrapper";

/**
 * Handles all new user Email Verification related services
 * @todo - post - Ensure all errors are handled
 * @todo - post - Add logging
 */
// 

export class EmailVerificationService {

    constructor(
        private authVerificationCodesRepository: AuthVerificationCodesRepository,
        private emailService: EmailService,
    ) {}

    /**
     * Create Verifaction Code and email to user email
     * @todo - post - Once email working, get failure error codes and map to our errors
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
    public async setAndSendVerificationCode(userEmail: string, displayName: string, userId: ObjectId): Promise<StandardResponse> {
        const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
        const createVerifyCodeData = { 
            userId,
            userEmail,
            code: verificationCode,
            createdAt: new Date(),
            updatedAt: new Date()
        };
        zodValidationWrapper(createVerificationCodeSchema, createVerifyCodeData, 'emailVerificationService.setAndSendVerificationCode');
        await this.authVerificationCodesRepository.createVerificationCode(createVerifyCodeData);

        const info = await this.emailService.sendEmailToUser('emailVerificationCode', displayName, userEmail, verificationCode);
        if (!info) throw new ServerError(
            'email sending failed',
            { location: 'emailVerificationService.setAndSendVerificationCode' },
            ErrorCode.EMAIL_SENDING_FAILED
        );
        if (info.rejected.length > 0) {
            // (SMTP error codes)
            // const match = info.response.match(/^\d{3}| \d{3}/); // Match first 3 digits or 3 digits after a space
            // const code = match ? parseInt(match[0].trim()) : null;
            throw new ServerError(
                'email rejected, retry or new email, 3 retries, new email', 
                { location: 'emailVerificationService.setAndSendVerificationCode' },
                ErrorCode.SENT_EMAIL_REJECTED
            );
        }

        // console.log(`Verification Email sent: ${info.messageId}, code: ${verificationCode}, message response: ${info.response}`);
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
    public async getVerificationCode(email: string): Promise<WithId<EmailAuthCodeDocument> | null> {
        return this.authVerificationCodesRepository.getVerificationCode(email);
    }

    /**
     * Check User verification Code
     * @group Registration Flow - Email Verification
     * @param {ObjectId} userId - User's _id
     * @param {string} code - client entered verification code
     * @return {boolean} true - verification success
     * @throws  {ForbiddenError} 403 - Code verification failed
     * @example
     * const authService = useAuthService();
     * await authService.getVerificationCode('1234abcd', 'xyz987);
     */
    public async checkVerificationCode(userEmail: string, code: string): Promise<CheckEmailVerificationResponse> {
        let isVerified = false;
        
        const vCode = await this.authVerificationCodesRepository.getVerificationCode(userEmail);

        if (vCode === null) throw new ServerError(
            'Verification Code missing, resend new code', 
            { code, userEmail, location: 'emailVerificationService.setAndSendVerificationCode' },
            ErrorCode.VERIFICATION_TOKEN_MISSING
        )
        if (!vCode.userId) throw new ServerError(
            'Verification Code UserId missing, resend new code', 
            { code, userEmail, location: 'emailVerificationService.setAndSendVerificationCode' },
            ErrorCode.VERIFICATION_TOKEN_MALFORMED
        )

        if (vCode?.code && code === vCode.code) isVerified = true;

        if (!isVerified) {
            throw new ForbiddenError(
                'Code Verification Failed', 
                { code, userEmail, location: 'emailVerificationService.setAndSendVerificationCode' },
                ErrorCode.EMAIL_VERIFICATION_FAILED
            );
        }

        return { isVerified, userId: vCode.userId };
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
    }

}