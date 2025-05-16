import { 
    DeleteResult, 
    InsertOneResult, 
    ObjectId, 
    WithId 
} from "mongodb";
import { BaseRepository } from "../base/baseRepository";
import { IsEmailSchema, IsObjectIdSchema } from "../../schemas/shared.schema";
import { 
    EmailAuthCode, 
    EmailAuthCodeDocument, 
    LoginAttempt, 
    RefreshToken, 
    RefreshTokenDocument
} from "../../types/auth";
import { LoginAttemptDocument } from "../../types/auth";
import { 
    IAuthLoginAttemptRepository, 
    IAuthTokenRepository, 
    IAuthVerficationCodeRepository
} from "./authRepository.interface";
import { zodValidationWrapper } from "../../util/zodParseWrapper";

/**
 * Auth Collection specific Mongodb Related calls
 * @todo - post - Are those TTL right?
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
    async getVerificationCode(email: string): Promise<WithId<EmailAuthCodeDocument> | null> {
        zodValidationWrapper(IsEmailSchema, { email }, 'authRepository.getVerificationCode');
        return await this.findOne({userEmail: email});
    }
    async deleteVerificationCode(_id: ObjectId): Promise<DeleteResult> {
        zodValidationWrapper(IsObjectIdSchema, { _id }, 'authRepository.deleteVerificationCode');
        return await this.delete({'userId':_id});
    }
}

export class AuthTokenRepository extends BaseRepository<RefreshTokenDocument> implements IAuthTokenRepository<RefreshTokenDocument> {
    constructor() {
        super('refresh_tokens');
    }
    async createRefreshToken(token: RefreshToken): Promise<InsertOneResult<RefreshTokenDocument>> {
        return await this.create(token);
    }

    async findAndDeleteToken(tokenId: string): Promise<WithId<RefreshTokenDocument> | null> {
        return await this.findOneAndDelete({ tokenId });
    }
}