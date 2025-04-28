import { DeleteResult, InsertOneResult, ObjectId, WithId } from 'mongodb';
import { EmailAuthCode, LoginAttempt } from '../../types/auth';

export interface IAuthLoginAttemptRepository<LoginAttemptDocument> {
    saveLoginAttemptData(loginData: LoginAttempt): Promise<InsertOneResult<LoginAttemptDocument>>
}

export interface IAuthVerficationCodeRepository<EmailAuthCodeDocument> {
    createVerificationCode(verificationCodeData: EmailAuthCode): Promise<InsertOneResult<EmailAuthCodeDocument>>;
    getVerificationCode(_id: ObjectId): Promise<WithId<EmailAuthCodeDocument> | null>;
    deleteVerificationCode(_id: ObjectId): Promise<DeleteResult>
}