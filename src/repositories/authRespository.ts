import { VerificationCodeDocument } from "../types/auth";
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
}

export class AuthVerificationCodesRepository extends BaseRepository<VerificationCodeDocument> {
    constructor() {
        super('auth_verification_codes');
    }

}