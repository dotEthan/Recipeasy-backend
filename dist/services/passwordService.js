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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PasswordService = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const zod_1 = require("zod");
const ensureObjectId_1 = require("../util/ensureObjectId");
const constants_1 = require("../constants");
const user_schema_1 = require("../schemas/user.schema");
const enums_1 = require("../types/enums");
const errors_1 = require("../errors");
/**
 * Handles all Password related logic
 * @todo - post - Ensure all errors are handled
 * @todo - post - Add logging
 */
class PasswordService {
    constructor(userRepository, userService, emailService) {
        this.userRepository = userRepository;
        this.userService = userService;
        this.emailService = emailService;
    }
    /**
     * Start the "Forgot Password" reset flow
     * @todo - post - log if deleteUserPwResetData fails (non-breaking)
     * @group Password Management - Email Token & Add Reset Data
     * @param {string} email - User email
     * @throws {NotFoundError} 404 - User Not found
     * @throws {ConflictError} 409 - if deletion fails (error as necessary cleanup)
     * @throws {ServerError} 500 - if env variables not set or user update fails
     * @example
     * const passwordService = passwordService();
     * await passwordService.startPasswordResetFlow('xyz987');
     */
    startPasswordResetFlow(email) {
        return __awaiter(this, void 0, void 0, function* () {
            const userId = yield this.userRepository.findIdByEmail(email);
            if (!userId)
                throw new errors_1.NotFoundError(`User Not Found with email: ${email}, relogin`, { location: 'passwordService.startPasswordResetFlow', email }, enums_1.ErrorCode.NO_USER_WITH_EMAIL);
            const userToken = {
                userId,
                type: 'reset-password'
            };
            const secret = (process.env.NODE_ENV !== 'production') ? process.env.JWT_SECRET_PROD : process.env.JWT_SECRET_DEV;
            if (!secret)
                throw new errors_1.ServerError('startPasswordResetFlow: Env JWT_SECRET_PROD/DEV not set', { location: 'passwordService.startPasswordResetFlow' }, enums_1.ErrorCode.UNSET_ENV_VARIABLE);
            const expiresIn = '1h';
            const resetToken = jsonwebtoken_1.default.sign(userToken, secret, { expiresIn });
            const emailSentInfo = yield this.emailService.sendEmailToUser('passwordReset', '', email, resetToken);
            const passwordResetData = {
                resetInProgress: true,
                resetRequestedAt: new Date(),
                attempts: 0,
                expiresAt: new Date(Date.now() + constants_1.PW_RESET_TOKEN_TTL)
            };
            const updatedData = { passwordResetData: passwordResetData, updatedAt: new Date() };
            user_schema_1.UpdateByIdSchema.parse({ updatedData });
            const updateUserRes = yield this.userRepository.updateById(userId, { $set: updatedData });
            if ((updateUserRes === null || updateUserRes === void 0 ? void 0 : updateUserRes.matchedCount) === 0)
                throw new errors_1.NotFoundError('startPasswordResetFlow: User to update not found', { location: 'passwordService.startPasswordResetFlow' }, enums_1.ErrorCode.RESOURCE_TO_UPDATE_NOT_FOUND);
            if ((updateUserRes === null || updateUserRes === void 0 ? void 0 : updateUserRes.modifiedCount) === 0)
                throw new errors_1.ServerError('startPasswordResetFlow: User update failed', { location: 'passwordService.startPasswordResetFlow' }, enums_1.ErrorCode.MONGODB_RESOURCE_UPDATE_FAILED);
            const emailSent = emailSentInfo.rejected.length === 0 ? true : false;
            return { success: emailSent };
        });
    }
    /**
     * Validate Password Reset Token
     * @group Password Management - Token Validation
     * @param {string} token - password reset token
     * @return {boolean} true - validation success
     * @example
     * const authService = useAuthService();
     * await authService.validatePasswordToken('xyz987');
     */
    validatePasswordToken(token, type) {
        return __awaiter(this, void 0, void 0, function* () {
            const secret = (process.env.NODE_ENV !== 'prod') ? process.env.JWT_SECRET_PROD : process.env.JWT_SECRET_DEV;
            if (!secret)
                throw new errors_1.ServerError('validatePasswordToken - Env JWT_SECRET_PROD/DEV not set', { location: 'passwordService.validatePasswordToken' }, enums_1.ErrorCode.UNSET_ENV_VARIABLE);
            const decoded = jsonwebtoken_1.default.verify(token, secret);
            if (decoded.type !== type) {
                throw new errors_1.BadRequestError('validatePasswordToken - Invalid token type', { location: 'passwordService.validatePasswordToken' }, enums_1.ErrorCode.VALIDATION_TOKEN_TYPE_INVALID);
            }
            const userId = decoded.userId;
            if (!userId)
                throw new errors_1.UnauthorizedError('validatePasswordToken - Token UserId not found', { location: 'passwordService.validatePasswordToken' }, enums_1.ErrorCode.VALIDATION_TOKEN_USERID_INVALID);
            return { success: true, data: userId };
        });
    }
    /**
     * Reset Password Request - Final Step
     * @group Password Management - Set PW and cleanup
     * @param {string} token - Token from client
     * @param {string} newPassword - New Password
     * @return {StandardResponse} - succes, message, recipe, error
     * @throws {NotFoundError} 404 - Token's userid not valid
     * @throws {ServerError} 500 - Server error
     * @example
     * const passwordService = passwordResetService();
     * await passwordService.passwordResetFinalStep("1234abcd", "password");
     */
    passwordResetFinalStep(token, newPassword) {
        return __awaiter(this, void 0, void 0, function* () {
            const validationRes = yield this.validatePasswordToken(token, enums_1.TokenTypes.PASSWORD_RESET);
            const userId = validationRes.data;
            const user = yield this.userService.findUserById((0, ensureObjectId_1.ensureObjectId)(userId));
            if (!user)
                throw new errors_1.NotFoundError('passwordResetFinalStep - No user found validating password token', { location: 'passwordService.passwordResetFinalStep', id: userId }, enums_1.ErrorCode.NO_USER_WITH_ID);
            const updatePasswordRes = yield this.updateUserPassword(newPassword, user);
            if ((updatePasswordRes === null || updatePasswordRes === void 0 ? void 0 : updatePasswordRes.matchedCount) === 0)
                throw new errors_1.NotFoundError('Update User Password: User not found', { location: 'passwordService.passwordResetFinalStep', user }, enums_1.ErrorCode.NO_USER_FOUND);
            if ((updatePasswordRes === null || updatePasswordRes === void 0 ? void 0 : updatePasswordRes.modifiedCount) === 0)
                throw new errors_1.ServerError('passwordResetFinalStep - Updating User password failed', { location: 'passwordService.passwordResetFinalStep', user }, enums_1.ErrorCode.MONGODB_RESOURCE_UPDATE_FAILED);
            const deleteResponse = yield this.deleteUserPwResetData(user);
            if ((deleteResponse === null || deleteResponse === void 0 ? void 0 : deleteResponse.matchedCount) === 0 || (deleteResponse === null || deleteResponse === void 0 ? void 0 : deleteResponse.modifiedCount) === 0) {
                throw new errors_1.ConflictError('User password reset data not deleted, retry?', { location: 'passwordService.passwordResetFinalStep' }, enums_1.ErrorCode.UPDATE_RESOURCE_FAILED);
            }
            return { success: true };
        });
    }
    /**
     * Delete passwordResetData - No flow in process
     * @todo - post - log if deleteUserPwResetData fails (non-breaking)
     * @group Security - Bot trap
     * @param {UserDocument} userResponse - User to delete object from
     * @throws {ForbiddenError} 403 - Password Reset in progress, can't login
     * @throws {NotFoundError} 404 - If user with email not found
     * @throws {ConflictError} 500 - if deletion fails (error as necessary cleanup)
     * @example
     * const userService = useUserService();
     * await userService.deleteUserPwResetData('xyz987');
     */
    checkIfPwResetInProgress(userEmail) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const userResponse = yield this.userRepository.findByEmail(userEmail);
            if (!userResponse)
                throw new errors_1.NotFoundError(`checkIfPwResetInProgress - User with email: ${userEmail} not found`, { location: 'passwordService.checkIfPwResetInProgress', email: userEmail }, enums_1.ErrorCode.NO_USER_WITH_EMAIL);
            const isExpired = ((_a = userResponse.passwordResetData) === null || _a === void 0 ? void 0 : _a.expiresAt) != null
                && new Date(userResponse.passwordResetData.expiresAt) < new Date();
            if (isExpired) {
                const deletionResponse = yield this.deleteUserPwResetData(userResponse);
                if ((deletionResponse === null || deletionResponse === void 0 ? void 0 : deletionResponse.modifiedCount) === 0)
                    throw new errors_1.LogOnlyError('Users password reset data not deleted', { location: 'passwordService.checkIfPwResetInProgress' }, enums_1.ErrorCode.NON_REQUIRED_DELETE_FAILED);
            }
            const pwResetInProgress = userResponse.passwordResetData != null && isExpired;
            if (pwResetInProgress)
                throw new errors_1.ForbiddenError('Password reset already in progress', { location: 'passwordService.checkIfPwResetInProgress' }, enums_1.ErrorCode.PW_RESET_IN_PROGRESS);
        });
    }
    /**
     * Delete passwordResetData
     * @group User Data - Forgotten Password
     * @param {UserDocument} userResponse - User to delete object from
     * @throws {ConflictError} 500 - if deletion fails (error as necessary cleanup)
     * @example
     * const userService = useUserService();
     * await userService.deleteUserPwResetData('xyz987');
     */
    deleteUserPwResetData(userResponse) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.userRepository.updateById(userResponse._id, {
                $unset: { passwordResetData: '' },
                $set: { updatedAt: new Date() }
            });
        });
    }
    /**
     * Change user password
     * @group User Data - management
     * @param {string} password - user's new password
     * @param {User} user - User to update
     * @return {UpdateResult} - User Document || null
     * @throws {NotFoundError} 404 - Data not found
     * @throws {ConflictError} 409 - Data state conflict
     * @example
     * const userService = useUserService();
     * await userService.updateUserPassword('xyz987', {_id:'12332132'});
     */
    updateUserPassword(password, user) {
        return __awaiter(this, void 0, void 0, function* () {
            const hashedPassword = yield bcryptjs_1.default.hash(password, 12);
            yield this.cachePreviousPassword(user._id, password, hashedPassword);
            const updatedData = { password: hashedPassword, updatedAt: new Date() };
            user_schema_1.UpdateByIdSchema.parse({ updatedData });
            const updateResponse = yield this.userRepository.updateById((0, ensureObjectId_1.ensureObjectId)(user._id), { $set: updatedData });
            if (updateResponse && updateResponse.matchedCount === 0) {
                throw new errors_1.NotFoundError('updateUserPassword - Document Not Found', { location: 'passwordService.updateUserPassword' }, enums_1.ErrorCode.RESOURCE_TO_UPDATE_NOT_FOUND);
            }
            else if (updateResponse && updateResponse.modifiedCount === 0) {
                throw new errors_1.ConflictError('updateUserPassword - Document Not Modified', { location: 'passwordService.updateUserPassword' }, enums_1.ErrorCode.UPDATE_RESOURCE_FAILED);
            }
            return updateResponse;
        });
    }
    /**
     * Ensures current PW isn't same as prevoius, and adds if not.
     * @group User Data - password management
     * @param {ObjectId} userId - user's id
     * @param {string} newPassword - user's new password
     * @param {string} hashedPassword - User new password hashed value
     * @return {AppError} 404 - Data not found
     * @return {AppError} 409 - Data state conflict
     * @return {AppError} 500 - Server Error
     * @example
     * const userService = useUserService();
     * await userService.updateUserPassword('xyz987', {_id:'12332132'});
     */
    cachePreviousPassword(userId, newPassword, hashedPassword) {
        return __awaiter(this, void 0, void 0, function* () {
            const findUserResponse = yield this.userRepository.findById((0, ensureObjectId_1.ensureObjectId)(userId), { previousPasswords: 1 });
            if (!findUserResponse)
                throw new errors_1.NotFoundError('User not found', { location: 'passwordService.cachePreviousPassword', userId }, enums_1.ErrorCode.RESOURCE_TO_UPDATE_NOT_FOUND);
            const previousPwArray = findUserResponse.previousPasswords || [];
            for (const pw of previousPwArray) {
                const isEqual = yield bcryptjs_1.default.compare(newPassword, pw.hash);
                if (isEqual)
                    throw new errors_1.ConflictError('Password previously used', { location: 'passwordService.cachePreviousPassword' }, enums_1.ErrorCode.PW_RECENTLY_USED);
            }
            const updatedPwArray = [...previousPwArray];
            if (updatedPwArray.length === 3) {
                previousPwArray.pop();
            }
            updatedPwArray.unshift({
                hash: hashedPassword,
                deprecatedAt: new Date()
            });
            zod_1.z.array(user_schema_1.PreviousPasswordSchema).parse(updatedPwArray);
            const updateResult = yield this.userRepository.updateCachedPasswords(findUserResponse._id, updatedPwArray);
            if (updateResult.modifiedCount === 0)
                throw new errors_1.ServerError('Failed to update password history', { location: 'passwordService.cachePreviousPassword', updatedPwArray }, enums_1.ErrorCode.MONGODB_RESOURCE_UPDATE_FAILED);
        });
    }
}
exports.PasswordService = PasswordService;
