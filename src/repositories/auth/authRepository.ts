import { ObjectId } from "mongodb";
import { BaseRepository } from "../base/baseRepository";
import { IsObjectIdSchema } from "../../schemas/shared.schema";
import { EmailAuthCode, EmailAuthCodeDocument, LoginAttempt } from "../../types/auth";
import { LoginAttemptDocument } from "../../types/auth";

/**
 * Auth Collection specific Mongodb Related calls
 * @todo create and implement Interface
 * @todo Are those TTL right?
 * 
 * - auth_verification_codes: email based verification codes, 1hr TTL
 * - auth_password_reset: email based verification token, 1 day TTL
 * - auth_login_attempts: logging all login attempts for security, 30day TTL
 */
// 

export class AuthLoginAttemptRepository extends BaseRepository<LoginAttemptDocument> {
    constructor() {
        super('auth_login_attempts');
    }
    async saveLoginAttemptData(loginData: LoginAttempt) {
        return await this.create(loginData);
    }
}

export class AuthVerificationCodesRepository extends BaseRepository<EmailAuthCodeDocument> {
    constructor() {
        super('auth_verification_codes');
    }
    async createVerificationCode(verificationCodeData: EmailAuthCode) {
        return await this.create(verificationCodeData);
    }
    async getVerificationCode(_id: ObjectId) {
        IsObjectIdSchema.parse({ _id })
        return await this.findOne({userId: _id});
    }
    async deleteVerificationCode(_id: ObjectId) {
        IsObjectIdSchema.parse({ _id })
        return await this.delete({'userId':_id});
    }
}
