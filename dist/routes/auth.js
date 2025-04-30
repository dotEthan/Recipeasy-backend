"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const validateRequestData_1 = require("../middleware/validateRequestData");
const user_schema_1 = require("../schemas/user.schema");
const catchAsyncErrors_1 = require("../util/catchAsyncErrors");
const authController_1 = require("../controllers/authController");
const auth_1 = require("../middleware/auth");
const services_1 = require("../services");
const csrf_1 = require("../middleware/csrf");
const rateLimiters_1 = require("../middleware/rateLimiters");
/**
 * Handles all Authorization based routes
 * @todo Add Authentication As needed
 * @todo - post - Full Error Lists
 */
// 
const router = express_1.default.Router();
const authController = new authController_1.AuthController(services_1.authService, services_1.passwordService);
/**
 * Register new user
 * @route POST /auth/register
 * @group Authorization - User Management
 * @param {EmailRegistration} request.body.required - email and plaintext password
 * @returns {StandardResponse} 201 - User registered
 * @returns {ErrorResponse} 400 - request missing values
 * @returns {ErrorResponse} 401 - User password too short
 * @returns {ErrorResponse} 409 - Email already used
 * @returns {ErrorResponse} 500 - Server/database issues
 * @produces application/json
 * @consumes application/json
 */
router.post("/register", (0, csrf_1.csrfMiddleware)(true), (0, validateRequestData_1.validateRequestBodyData)(user_schema_1.RegisterUserSchema), rateLimiters_1.registrationLimiter, (0, catchAsyncErrors_1.catchAsyncError)(authController.register));
/**
 * Log in user
 * @route POST /auth/login
 * @group Authorization - Session Management
 * @returns {LoginResponse} 200 - User logged in
 * @returns {ErrorResponse} 400 - Validation Error
 * @returns {ErrorResponse} 401 - User credentials wrong
 * @returns {ErrorResponse} 404 - User Not Found
 * @returns {ErrorResponse} 500 - Server/database issues
 * @produces application/json
 * @consumes application/json
 */
router.post("/login", rateLimiters_1.apiLimiter, (0, csrf_1.csrfMiddleware)(true), (0, validateRequestData_1.validateRequestBodyData)(user_schema_1.LoginSchema), (0, catchAsyncErrors_1.catchAsyncError)(authController.login));
/**
 * Check to ensure user session is still active
 * @route GET /auth/session
 * @group Authorization - Session Management
 * @returns {LoginResponse} 200 - Session active
 * @returns {ErrorResponse} 401 - No active session found
 * @returns {ErrorResponse} 500 - Server/database issues
 * @produces application/json
 */
router.get('/session', rateLimiters_1.apiLimiter, (0, auth_1.isAuthenticated)(), (0, catchAsyncErrors_1.catchAsyncError)(authController.checkSession));
/**
 * Delete User session
 * @route DELETE /auth/session
 * @group Authorization - Session deletion
 * @returns {StandardResponse} 200 - Deletion successful
 * @returns {ErrorResponse} 500 - Server/database issues
 * @produces application/json
 * @consumes application/json
 */
router.delete("/session", rateLimiters_1.apiLimiter, (0, csrf_1.csrfMiddleware)(true), (0, auth_1.isAuthenticated)(), (0, catchAsyncErrors_1.catchAsyncError)(authController.logUserOut));
exports.default = router;
