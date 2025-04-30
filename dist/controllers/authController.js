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
exports.AuthController = void 0;
const passport_1 = __importDefault(require("passport"));
const user_schema_1 = require("../schemas/user.schema");
const errors_1 = require("../errors");
const enums_1 = require("../types/enums");
const sanitizeUser_1 = require("../util/sanitizeUser");
/**
 * Authorization based req and res handling
 * @todo - post - Double check for unhandled errors
 */
// 
class AuthController {
    constructor(authService, passwordService) {
        this.authService = authService;
        this.passwordService = passwordService;
        /**
         * Register new user
         * @group Authorization - Create User
         * @param {string} req.body.displayName - User's Displayed Name
         * @param {string} req.body.email.required - User's email
         * @param {string} req.body.password.required - User's password
         * @return {StandardResponse} success: boolean, data: userResponse
         * @throws {BadRequestError} 400 - req.body missing displayName, email, or password
         * @throws {ZodError} 401 - Validation failed
         */
        this.register = (req, res) => __awaiter(this, void 0, void 0, function* () {
            const { displayName, email, password } = req.body;
            if (!displayName || !email || !password)
                throw new errors_1.BadRequestError('register - req.body missing required data', { body: req.body }, enums_1.ErrorCode.RESOURCE_ID_PARAM_MISSING);
            const registeredUser = yield this.authService.registerNewUser(displayName, email, password);
            // for email validation
            req.session.unverifiedUserId = registeredUser._id;
            user_schema_1.FeUserSchema.parse(registeredUser);
            res.status(201).json({ success: true, data: registeredUser });
        });
        /**
         * Log User In
         * @todo - post - 3 failed attempts triggers password reset required
         * @group Authorization - Create session
         * @param {string} req.body.email - User's email
         * @param {string} req.body.password - User's password
         * @return  {LoginResponse} user: User, newEmailVerifyCodeCreated: boolean, recipeResponse: Recipe[], totalRecipes: number
         * @throws {BadRequestError} 400 - req.body missing email
         * @throws {ZodError} 401 - Validation failed
         */
        this.login = (req, res) => __awaiter(this, void 0, void 0, function* () {
            const { email, password } = req.body;
            if (!email || !password)
                throw new errors_1.BadRequestError('register - req.body missing required data', { body: req.body }, enums_1.ErrorCode.MISSING_REQUIRED_BODY_DATA);
            yield this.passwordService.checkIfPwResetInProgress(email);
            const csrfToken = req.session.csrfToken;
            const authenticatedUser = yield this.authenticateUser(req, res);
            const autheticatedSantizedUser = (0, sanitizeUser_1.sanitizeUser)(authenticatedUser);
            req.session.csrfToken = csrfToken;
            // csrf-sync not working with passportjs to add csrftokens after new session creation
            yield new Promise((resolve, reject) => {
                req.session.save((err) => {
                    if (err) {
                        reject(err);
                    }
                    else {
                        resolve();
                    }
                });
            });
            const responseData = yield this.authService.userLogin(autheticatedSantizedUser);
            user_schema_1.LoginResSchema.parse(responseData);
            res.status(200).json(responseData);
            yield this.authService.logLoginAttempt(req, true);
        });
        /**
         * User Log out
         * @group User Session - Ends Session
         * @return  {StandardResponse} success, message, data, error - Stardard response for generic calls
         */
        this.logUserOut = (req, res) => __awaiter(this, void 0, void 0, function* () {
            const csrfToken = req.session.csrfToken;
            yield new Promise((resolve, reject) => {
                req.logOut((error) => {
                    if (error)
                        return reject(error);
                    resolve();
                });
            });
            res.clearCookie('recipeasy.sid', {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict'
            });
            // still needed?
            res.clearCookie('XSRF-TOKEN', {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict'
            });
            // regenerating to maintain csrfToken
            yield new Promise((resolve, reject) => {
                req.session.regenerate((error) => {
                    if (error)
                        return reject(error);
                    req.session.csrfToken = csrfToken;
                    req.session.save((saveErr) => {
                        if (saveErr)
                            return reject(saveErr);
                        resolve();
                    });
                });
            });
            req.session.csrfToken = csrfToken;
            res.status(200).json({
                success: true,
                message: "User logged out successfully"
            });
        });
        /**
         * Checks if user session active on page reload
         * @group User Session - Checks Session
         * @return  {StandardUserResponse} success, message, data, error - Stardard response for generic calls
         * @throws {ZodError} 401 - Validation failed
         */
        this.checkSession = (req, res) => {
            const user = req.user ? (0, sanitizeUser_1.sanitizeUser)(req.user) : undefined;
            if (req.isAuthenticated() && user) {
                user_schema_1.FeUserSchema.parse(user);
                res.status(200).json({ success: true, user });
            }
            else {
                throw new errors_1.UnauthorizedError('User session not found', { location: 'authController.checkSession' }, enums_1.ErrorCode.REQ_USER_MISSING);
            }
        };
        /**
         * Passport's authenticate User
         * @group Authorization - Autheticates User
         * @return  {StandardUserResponse} success, message, data, error - Stardard response for generic calls
         * @throws {ZodError} 401 - Validation failed
         * @throws {PassportErrors} 401 - Validation failed
         */
        this.authenticateUser = (req, res) => {
            const passportOptions = {
                failureWithError: true
            };
            return new Promise((resolve, reject) => {
                passport_1.default.authenticate('local', passportOptions, (error, user, info) => {
                    if (error) {
                        return reject(new errors_1.ServerError('authenticateUsererror', { location: 'authController.authenticateUser' }, enums_1.ErrorCode.PASSPORT_FAILED));
                    }
                    if (!user) {
                        return reject(new errors_1.UnauthorizedError(info.message, { location: 'authController.authenticateUser' }, enums_1.ErrorCode.PASSPORT_UNAUTH));
                    }
                    req.session.regenerate((err) => {
                        if (err) {
                            return reject(new errors_1.ServerError('Session regeneration failed', { location: 'authController.authenticateUser' }, enums_1.ErrorCode.SESSION_REGEN_FAILED));
                        }
                        req.logIn(user, (loginError) => {
                            if (loginError) {
                                return reject(loginError);
                            }
                            resolve(user);
                        });
                    });
                })(req, res);
            });
        };
    }
}
exports.AuthController = AuthController;
