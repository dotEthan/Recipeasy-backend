import { DeleteResult, InsertOneResult, ObjectId, WithId } from 'mongodb';
import { EmailAuthCode, LoginAttempt, RefreshToken } from '../../types/auth';

export interface IAuthLoginAttemptRepository<LoginAttemptDocument> {
    saveLoginAttemptData(loginData: LoginAttempt): Promise<InsertOneResult<LoginAttemptDocument>>;
}

export interface IAuthVerficationCodeRepository<EmailAuthCodeDocument> {
    createVerificationCode(verificationCodeData: EmailAuthCode): Promise<InsertOneResult<EmailAuthCodeDocument>>;
    getVerificationCode(email: string): Promise<WithId<EmailAuthCodeDocument> | null>;
    deleteVerificationCode(_id: ObjectId): Promise<DeleteResult>;
}

export interface IAuthTokenRepository<RefreshTokenDocument> {
    createRefreshToken(token: RefreshToken): Promise<InsertOneResult<RefreshTokenDocument>>;
    findAndDeleteToken(tokenId: string): Promise<WithId<RefreshTokenDocument> | null>;
}