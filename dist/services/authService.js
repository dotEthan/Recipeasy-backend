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
exports.AuthService = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const admin_schema_1 = require("../schemas/admin.schema");
const errors_1 = require("../errors");
const enums_1 = require("../types/enums");
/**
 * Handles all Authorization related services
 * @todo - post - Ensure all errors are handled
 */
// 
class AuthService {
    constructor(authLoginAttemptRepository, userService, recipeService, emailVerificationService) {
        this.authLoginAttemptRepository = authLoginAttemptRepository;
        this.userService = userService;
        this.recipeService = recipeService;
        this.emailVerificationService = emailVerificationService;
    }
    /**
     * Register new user
     * @group Authorization - User registration
     * @param {string} displayName - User displayName
     * @param {string} email - User email
     * @param {string} password - User password
     * @throws {ConflictError} 409 - if email is already in use
     * @example
     * const authService = useAuthService();
     * await authService.registerNewUser('Frank', 'frank@frank.com', 'password');
     */
    registerNewUser(displayName, email, password) {
        return __awaiter(this, void 0, void 0, function* () {
            const hashedPassword = yield bcryptjs_1.default.hash(password, 12);
            const emailInUse = yield this.userService.findUserByEmail(email);
            if (emailInUse != null)
                throw new errors_1.ConflictError('Email already in use', { email, location: 'authService.registerNewUser' }, enums_1.ErrorCode.EMAIL_ALREADY_IN_USE);
            const userResponse = yield this.userService.createNewUser(displayName, email, hashedPassword);
            return userResponse;
        });
    }
    /**
     * User login
     * @todo - post - No errors thrown? Intentional?
     * @group Authorization - User login
     * @param {User} user - User logging in
     * @returns {LoginResponse} user: User, newEmailVerifyCodeCreated: boolean, recipeResponse: recipe
     * @example
     * const authService = useAuthService();
     * await authService.registerNewUser('Frank', 'frank@frank.com', 'password');
     */
    userLogin(user) {
        return __awaiter(this, void 0, void 0, function* () {
            let newEmailVerifyCodeCreated = false;
            if (!user.verified) {
                const codeExists = yield this.emailVerificationService.getVerificationCode(user._id);
                if (codeExists === null) {
                    yield this.emailVerificationService.setAndSendVerificationCode(user.email, user.displayName, user._id);
                    newEmailVerifyCodeCreated = true;
                }
            }
            let recipeResponse = [];
            let totalRecipes = 0;
            if (user.recipes) {
                const paginatedResponse = yield this.recipeService.getUsersRecipes(user);
                recipeResponse = paginatedResponse.data;
                totalRecipes = paginatedResponse.totalDocs;
            }
            const responseData = {
                user,
                newEmailVerifyCodeCreated,
                recipeResponse,
                totalRecipes: totalRecipes
            };
            return responseData;
        });
    }
    /**
     * Logs all login attempts
     * @group Logging - Auth logs
     * @todo - post - test req.ip is working in production
     * @param {Request} req - Request object
     * @param {boolean} success - successful
     * @param {string} errorMessage - Error message
     * @throws {LogOnlyError} 888 - Non-breaking error, logging only
     * @example
     * const authService = useAuthService();
     * await authService.logLoginAttempt(req, false, errorMessage);
     */
    logLoginAttempt(req, success, errorMessage) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const loginData = {
                userId: (_a = req.user) === null || _a === void 0 ? void 0 : _a._id,
                ipAddress: req.ip,
                userAgent: req.headers['user-agent'],
                timestamp: new Date(),
                success,
                errorMessage: success ? '' : errorMessage,
            };
            admin_schema_1.SaveLoginAttemptDataSchema.parse(loginData);
            const loginAttemptDoc = yield this.authLoginAttemptRepository.create(loginData);
            if (!loginAttemptDoc)
                throw new errors_1.LogOnlyError('Logging login attempts failed, log and move on', { location: "authService.logLoginAttempt" }, enums_1.ErrorCode.LOGGING_FAILED);
        });
    }
}
exports.AuthService = AuthService;
