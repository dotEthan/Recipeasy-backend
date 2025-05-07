import express from "express";
import { validateRequestBodyData } from "../middleware/validateRequestData";
import { LoginSchema, RegisterUserSchema } from "../schemas/user.schema";
import { catchAsyncError } from "../util/catchAsyncErrors";
import { AuthController } from "../controllers/authController";
import { isAuthenticated } from "../middleware/auth";
import { authService, passwordService } from "../services";
import { apiLimiter, registrationLimiter } from "../middleware/rateLimiters";


/**
 * Handles all Authorization based routes
 * @todo Add Authentication As needed
 * @todo - post - Full Error Lists
 */
// 

const router = express.Router();

const authController = new AuthController(authService, passwordService);

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
router.post(
    "/register", 
    validateRequestBodyData(RegisterUserSchema), 
    registrationLimiter, 
    catchAsyncError(authController.register)
);

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
router.post(
    "/login", 
    apiLimiter, 
    validateRequestBodyData(LoginSchema), 
    catchAsyncError(authController.login)
);

/**
 * Check to ensure user session is still active
 * @route GET /auth/session
 * @group Authorization - Session Management
 * @returns {LoginResponse} 200 - Session active
 * @returns {ErrorResponse} 401 - No active session found
 * @returns {ErrorResponse} 500 - Server/database issues
 * @produces application/json
 */
router.get(
    '/session', 
    apiLimiter, 
    isAuthenticated(), 
    catchAsyncError(authController.checkSession)
);

/**
 * Delete User session
 * @route DELETE /auth/session
 * @group Authorization - Session deletion
 * @returns {StandardResponse} 200 - Deletion successful
 * @returns {ErrorResponse} 500 - Server/database issues
 * @produces application/json
 * @consumes application/json
 */
router.delete(
    "/session", 
    apiLimiter, 
    isAuthenticated(), 
    catchAsyncError(authController.logUserOut)
);

export default router;