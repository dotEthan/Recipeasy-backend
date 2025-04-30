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
exports.AdminController = void 0;
const enums_1 = require("../types/enums");
const shared_schema_1 = require("../schemas/shared.schema");
const ensureObjectId_1 = require("../util/ensureObjectId");
const errors_1 = require("../errors");
const csrf_1 = require("../middleware/csrf");
/**
 * Administration based req and res handling
 */
class AdminController {
    constructor(passwordService, userService, emailVerificationService) {
        this.passwordService = passwordService;
        this.userService = userService;
        this.emailVerificationService = emailVerificationService;
        /**
         * Gets csrf-async token for user
         * @group Security - session tracking
         * @param {VerifyCodeRequest} request.body.required - Code and user identifier
         * @returns {SuccessResponse} 200 - Verification successful
         * @produces application/json
         */
        this.getCsurf = (req, res) => {
            const token = (0, csrf_1.generateCsrfToken)(req); // Explicit generation
            res.header("X-CSRF-Token", token);
            res.json({ token }); // Send both header and body
        };
        /**
         * Request to start User password reset flow
         * @group Admin - Password Reset Request
         * @param {string} req.body.email - User's email
         * @param {Response} userId - User's _id
         * @return  {StandardResponse} success, message, data, error - Stardard response for generic calls
         * @throws  {BadRequestError} 400 - If client didn't attach email to req
         */
        this.resetPasswordRequest = (req, res) => __awaiter(this, void 0, void 0, function* () {
            const email = req.body.email;
            if (!email)
                throw new errors_1.BadRequestError('resetPasswordRequest - email missing from req.body', { body: req.body }, enums_1.ErrorCode.MISSING_REQUIRED_BODY_DATA);
            const passwordReset = yield this.passwordService.startPasswordResetFlow(email);
            shared_schema_1.StandardResponseSchema.parse(passwordReset);
            res.status(201).json(passwordReset);
        });
        /**
         * Validate if password token provided by FrontEnd.
         * @group Admin - Password Reset Request
         * @param {Request} req.body.token - User's token
         * @return  {StandardResponse} success, message, data, error - Stardard response for generic calls
         * @throws  {BadRequestError} 400 - If client didn't attach code to req
         */
        this.validatePasswordToken = (req, res) => __awaiter(this, void 0, void 0, function* () {
            const token = req.body.code;
            if (!token)
                throw new errors_1.BadRequestError('resetPasswordRequest - code missing from req.body', { body: req.body, location: "adminController.validatePasswordToken" }, enums_1.ErrorCode.MISSING_REQUIRED_BODY_DATA);
            const response = yield this.passwordService.validatePasswordToken(token, enums_1.TokenTypes.PASSWORD_RESET);
            shared_schema_1.StandardResponseSchema.parse(response);
            res.status(200).json(response);
        });
        /**
         * Reset Password Flow - change password and delete resetPasswordData
         * @group Admin - Password Reset Request
         * @param {Request} req.body.token - User's token
         * @param {Request} req.body.password - User's new password
         * @return  {StandardResponse} success, message, data, error - Stardard response for generic calls
         * @throws  {BadRequestError} 400 - If client didn't attach code or password to req
         */
        this.finishPasswordResetRequest = (req, res) => __awaiter(this, void 0, void 0, function* () {
            const { code: token, password } = req.body;
            if (!token || !password)
                throw new errors_1.BadRequestError('resetPasswordRequest - code or password missing from req.body', { body: req.body, location: "adminController.finishPasswordResetRequest" }, enums_1.ErrorCode.MISSING_REQUIRED_BODY_DATA);
            const success = yield this.passwordService.passwordResetFinalStep(token, password);
            shared_schema_1.StandardResponseSchema.parse(success);
            res.status(201).json({ success });
        });
        /**
         * Check client token for email Verification
         * @todo - post - Retry emails?
         * @group Admin - Email Verfication Validation
         * @param {string} req.body.code - User's email verification code
         * @param {Response} userId - User's _id
         * @return  {StandardResponse} 200 - success - Should always be true
         * @throws  {BadRequestError} 400 - Code to verify not present
         * @throws  {UnauthorizedError} 401 - no req.user || req.session.unverifiedUserId (new user)
         */
        this.verifyCode = (req, res) => __awaiter(this, void 0, void 0, function* () {
            var _a;
            const code = req.body.code;
            const currentUserId = req.session.unverifiedUserId || ((_a = req.user) === null || _a === void 0 ? void 0 : _a._id);
            if (!currentUserId)
                throw new errors_1.UnauthorizedError('User Session Ended, please log in again', { location: 'adminController.verifyCode' }, enums_1.ErrorCode.USER_SESSION_NOT_FOUND);
            if (!code)
                throw new errors_1.BadRequestError('verifyCode - Code not present', { code, currentUserId, location: 'adminController.verifyCode' }, enums_1.ErrorCode.MISSING_REQUIRED_BODY_DATA);
            const userId = (0, ensureObjectId_1.ensureObjectId)(currentUserId);
            const verified = yield this.emailVerificationService.checkVerificationCode(userId, code);
            if (verified) {
                this.userService.setUserVerified(userId);
                this.emailVerificationService.deleteVerificationCode(userId);
            }
            const verifyRes = { success: verified };
            shared_schema_1.StandardResponseSchema.parse(verifyRes);
            res.status(200).json(verifyRes);
        });
    }
}
exports.AdminController = AdminController;
