import { ObjectId } from "mongodb";
import { createVerificationCodeSchema, DeleteVerificationCode, GetVerificationCode, SaveLoginAttemptDataSchema } from "../../schemas/admin.schema";
import { EmailAuthCode, EmailAuthCodeDocument, LoginAttempt } from "../../types/auth";
import { LoginAttemptDocument } from "../../types/auth";
import { BaseRepository } from "../base/baseRepository";

/**
 * Auth Collection specific Mongodb Related calls
 * @todo BOW TO ZOD PARSING!
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
        SaveLoginAttemptDataSchema.parse(loginData);
        return await this.create(loginData);
    }
}

export class AuthVerificationCodesRepository extends BaseRepository<EmailAuthCodeDocument> {
    constructor() {
        super('auth_verification_codes');
    }
    async createVerificationCode(verificationCodeData: EmailAuthCode) {
        createVerificationCodeSchema.parse(verificationCodeData);
        return await this.create(verificationCodeData);
    }
    async getVerificationCode(_id: ObjectId) {
        console.log('user Id in autRepo:', _id)
        console.log('typeof user Id in autRepo:', typeof _id)
        GetVerificationCode.parse({_id});
        return await this.findOne({userId: _id});
    }
    async deleteVerificationCode(_id: ObjectId) {
        DeleteVerificationCode.parse({_id});
        return await this.delete({'userId':_id});
    }
}
