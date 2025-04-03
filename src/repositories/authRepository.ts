import { ObjectId } from "mongodb";
import { createVerificationCodeSchema, DeleteVerificationCode, FindVerificationCode, SaveLoginAttemptDataSchema } from "../schemas/admin.schema";
import { EmailAuthCode, EmailAuthCodeDocument, LoginAttempt } from "../types/auth";
import { LoginAttemptDocument } from "../types/auth";
import { BaseRepository } from "./baseRepository";
/**
 * Temporary auth-related collections:
 * - auth_verification_codes: email based verification codes, 1hr TTL
 * - auth_login_attempts: logging all login attempts for security, 30day TTL
 */
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
    async createVerificationCOde(verificationCodeData: EmailAuthCode) {
        createVerificationCodeSchema.parse(verificationCodeData);
        return await this.create(verificationCodeData);
    }
    async findVerificationCode(_id: ObjectId) {
        FindVerificationCode.parse({_id});
        return await this.findOne(_id);
    }
    async deleteVerificationCode(_id: ObjectId) {
        DeleteVerificationCode.parse({_id});
        return await this.delete(_id);
    }
}
