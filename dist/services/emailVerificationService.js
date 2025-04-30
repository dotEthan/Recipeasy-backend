"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailVerificationService = void 0;
const errors_1 = require("../errors");
const admin_schema_1 = require("../schemas/admin.schema");
const enums_1 = require("../types/enums");
/**
 * Handles all new user Email Verification related services
 * @todo - post - Ensure all errors are handled
 * @todo - post - Add logging
 */
// 
class EmailVerificationService {
    constructor(authVerificationCodesRepository, emailService) {
        this.authVerificationCodesRepository = authVerificationCodesRepository;
        this.emailService = emailService;
    }
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
    setAndSendVerificationCode(email, displayName, userId) {
        return __awaiter(this, void 0, void 0, function* () {
            const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
            const createVerifyCodeData = {
                userId,
                code: verificationCode,
                createdAt: new Date(),
                updatedAt: new Date()
            };
            admin_schema_1.createVerificationCodeSchema.parse(createVerifyCodeData);
            yield this.authVerificationCodesRepository.createVerificationCode(createVerifyCodeData);
            const info = yield this.emailService.sendEmailToUser('emailVerificationCode', displayName, email, verificationCode);
            if (!info)
                throw new errors_1.ServerError('email sending failed', { location: 'emailVerificationService.setAndSendVerificationCode' }, enums_1.ErrorCode.EMAIL_SENDING_FAILED);
            if (info.rejected.length > 0) {
                // (SMTP error codes)
                // const match = info.response.match(/^\d{3}| \d{3}/); // Match first 3 digits or 3 digits after a space
                // const code = match ? parseInt(match[0].trim()) : null;
                throw new errors_1.ServerError('email rejected, retry or new email, 3 retries, new email', { location: 'emailVerificationService.setAndSendVerificationCode' }, enums_1.ErrorCode.SENT_EMAIL_REJECTED);
            }
            console.log(`Verification Email sent: ${info.messageId}, code: ${verificationCode}, message response: ${info.response}`);
            return { success: (info.rejected.length === 0) };
        });
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
    getVerificationCode(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.authVerificationCodesRepository.getVerificationCode(userId);
        });
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
    checkVerificationCode(userId, code) {
        return __awaiter(this, void 0, void 0, function* () {
            let isVerified = false;
            const vCode = yield this.authVerificationCodesRepository.getVerificationCode(userId);
            if ((vCode === null || vCode === void 0 ? void 0 : vCode.code) && code === vCode.code)
                isVerified = true;
            if (!isVerified) {
                throw new errors_1.ForbiddenError('Code Verification Failed', { code, userId, location: 'emailVerificationService.setAndSendVerificationCode' }, enums_1.ErrorCode.TOKEN_VERIFICATION_FAILED);
            }
            return isVerified;
        });
    }
    /**
     * delete User verification Code
     * @group Registration Flow - Email Verification
     * @param {ObjectId} userId - User's _id
     * @example
     * const authService = useAuthService();
     * await authService.deleteVerificationCode('1234abcd', 'xyz987');
     */
    deleteVerificationCode(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.authVerificationCodesRepository.deleteVerificationCode(userId);
        });
    }
}
exports.EmailVerificationService = EmailVerificationService;
