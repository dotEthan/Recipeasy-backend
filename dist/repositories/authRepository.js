"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthVerificationCodesRepository = exports.AuthLoginAttemptRepository = void 0;
const admin_schema_1 = require("../schemas/admin.schema");
const baseRepository_1 = require("./baseRepository");
/**
 * Temporary auth-related collections:
 * - auth_verification_codes: email based verification codes, 1hr TTL
 * - auth_login_attempts: logging all login attempts for security, 30day TTL
 */
class AuthLoginAttemptRepository extends baseRepository_1.BaseRepository {
    constructor() {
        super('auth_login_attempts');
    }
    saveLoginAttemptData(loginData) {
        return __awaiter(this, void 0, void 0, function* () {
            admin_schema_1.SaveLoginAttemptDataSchema.parse(loginData);
            return yield this.create(loginData);
        });
    }
}
exports.AuthLoginAttemptRepository = AuthLoginAttemptRepository;
class AuthVerificationCodesRepository extends baseRepository_1.BaseRepository {
    constructor() {
        super('auth_verification_codes');
    }
    createVerificationCOde(verificationCodeData) {
        return __awaiter(this, void 0, void 0, function* () {
            admin_schema_1.createVerificationCodeSchema.parse(verificationCodeData);
            return yield this.create(verificationCodeData);
        });
    }
    findVerificationCode(_id) {
        return __awaiter(this, void 0, void 0, function* () {
            admin_schema_1.FindVerificationCode.parse({ _id });
            return yield this.findOne(_id);
        });
    }
    deleteVerificationCode(_id) {
        return __awaiter(this, void 0, void 0, function* () {
            admin_schema_1.DeleteVerificationCode.parse({ _id });
            return yield this.delete(_id);
        });
    }
}
exports.AuthVerificationCodesRepository = AuthVerificationCodesRepository;
