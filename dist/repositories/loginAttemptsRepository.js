"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoginAttemptRepository = void 0;
const baseRepository_1 = require("./baseRepository");
class LoginAttemptRepository extends baseRepository_1.BaseRepository {
    constructor() {
        super('login_attempts');
    }
}
exports.LoginAttemptRepository = LoginAttemptRepository;
