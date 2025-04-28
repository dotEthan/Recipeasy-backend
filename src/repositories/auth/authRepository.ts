import { DeleteResult, InsertOneResult, ObjectId, WithId } from "mongodb";
import { BaseRepository } from "../base/baseRepository";
import { IsObjectIdSchema } from "../../schemas/shared.schema";
import { EmailAuthCode, EmailAuthCodeDocument, LoginAttempt } from "../../types/auth";
import { LoginAttemptDocument } from "../../types/auth";
import { IAuthLoginAttemptRepository, IAuthVerficationCodeRepository } from "./authRepository.interface";

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

export class AuthLoginAttemptRepository extends BaseRepository<LoginAttemptDocument> implements IAuthLoginAttemptRepository<LoginAttemptDocument> {
    constructor() {
        super('auth_login_attempts');
    }
    async saveLoginAttemptData(loginData: LoginAttempt): Promise<InsertOneResult<LoginAttemptDocument>> {
        return await this.create(loginData);
    }
}

export class AuthVerificationCodesRepository extends BaseRepository<EmailAuthCodeDocument> implements IAuthVerficationCodeRepository<EmailAuthCodeDocument> {
    constructor() {
        super('auth_verification_codes');
    }
    async createVerificationCode(verificationCodeData: EmailAuthCode): Promise<InsertOneResult<EmailAuthCodeDocument>> {
        return await this.create(verificationCodeData);
    }
    async getVerificationCode(_id: ObjectId): Promise<WithId<EmailAuthCodeDocument> | null> {
        IsObjectIdSchema.parse({ _id })
        return await this.findOne({userId: _id});
    }
    async deleteVerificationCode(_id: ObjectId): Promise<DeleteResult> {
        IsObjectIdSchema.parse({ _id })
        return await this.delete({'userId':_id});
    }
}
