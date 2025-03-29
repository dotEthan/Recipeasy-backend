import { LoginAttemptDocument } from "../types/loginAttempts";
import { BaseRepository } from "./baseRepository";

export class LoginAttemptRepository extends BaseRepository<LoginAttemptDocument> {
    constructor() {
        super('login_attempts');
    }
}