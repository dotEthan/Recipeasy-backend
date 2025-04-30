"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const adminController_1 = require("../controllers/adminController");
const services_1 = require("../services");
const validateRequestData_1 = require("../middleware/validateRequestData");
const catchAsyncErrors_1 = require("../util/catchAsyncErrors");
const user_schema_1 = require("../schemas/user.schema");
const shared_schema_1 = require("../schemas/shared.schema");
const csrf_1 = require("../middleware/csrf");
const rateLimiters_1 = require("../middleware/rateLimiters");
/**
 * Handles all Administration based routes
 * @todo Add Authentication As needed
 * @todo - post - Full Error Lists
 */
// 
const router = express_1.default.Router();
const adminController = new adminController_1.AdminController(services_1.passwordService, services_1.userService, services_1.emailVerificationService);
/**
 * Gets Csurf token for user
 * @route GET /admin/csrf-token
 * @group Security - user tracking
 * @returns {SuccessResponse} 200 - Csurfing!
 * @returns {ErrorResponse} 500 - Token not generated
 * @produces application/json
 */
router.get('/csrf-token', rateLimiters_1.registrationLimiter, (0, catchAsyncErrors_1.catchAsyncError)(adminController.getCsurf));
/**
 * Verify a user's authentication code
 * @route POST /admin/verification-codes/verify
 * @group Authentication - Code verification
 * @param {VerifyCodeRequest} request.body.code.required - Code and user identifier
 * @returns {SuccessResponse} 200 - Verification successful
 * @returns {ErrorResponse} 400 - Invalid code format
 * @returns {ErrorResponse} 401 - Code expired or incorrect
 * @produces application/json
 * @consumes application/json
 */
router.post('/verification-codes/verify', rateLimiters_1.apiLimiter, (0, csrf_1.csrfMiddleware)(true), (0, validateRequestData_1.validateRequestBodyData)(shared_schema_1.IsCodeSchema), (0, catchAsyncErrors_1.catchAsyncError)(adminController.verifyCode));
/**
 * Request to start user Password reset
 * @route POST /admin/password-reset-requests
 * @group Authentication - Password Management
 * @param {VerifyCodeRequest} request.body.required - email
 * @returns {SuccessResponse} 201 - Request creation successful
 * @returns {ErrorResponse} 400 - Validation Error
 * @returns {ErrorResponse} 404 - User email not found
 * @returns {ErrorResponse} 500 - Send email request failed
 * @produces application/json
 * @consumes application/json
 */
router.post('/password-reset-requests', rateLimiters_1.apiLimiter, (0, csrf_1.csrfMiddleware)(true), (0, validateRequestData_1.validateRequestBodyData)(shared_schema_1.IsEmailSchema), (0, catchAsyncErrors_1.catchAsyncError)(adminController.resetPasswordRequest));
/**
 * Validate Password Reset Token input by User
 * @route POST /admin/password-reset/validate
 * @group Authentication - Password Management
 * @param {VerifyCodeRequest} request.body.required - Reset token
 * @returns {SuccessResponse} 200 - Validation Successful
 * @returns {ErrorResponse} 400 - Input Token invalid
 * @returns {ErrorResponse} 404 - Token record not found in DB
 * @returns {ErrorResponse} 500 - Server Error
 * @produces application/json
 * @consumes application/json
 */
router.post('/password-reset/validate', rateLimiters_1.apiLimiter, (0, csrf_1.csrfMiddleware)(true), (0, validateRequestData_1.validateRequestBodyData)(shared_schema_1.IsCodeSchema), (0, catchAsyncErrors_1.catchAsyncError)(adminController.validatePasswordToken));
/**
 * Final step in user password reset Request - update with new password
 * @route PATCH /admin/user-password
 * @group Recipe Management - User data Update
 * @param {string} request.body.code.required - reset token
 * @param {string} request.body.password.required - new password
 * @returns {StandardResponse} 201 - success: true
 * @returns {ErrorResponse} 400 - Validation Error
 * @returns {ErrorResponse} 404 - User does not exist
 * @returns {ErrorResponse} 500 - Server/database issues
 * @produces application/json
 * @consumes application/json
*/
router.patch("/user-password", rateLimiters_1.apiLimiter, (0, csrf_1.csrfMiddleware)(true), (0, validateRequestData_1.validateRequestBodyData)(user_schema_1.ResetFlowSetPasswordSchema), (0, catchAsyncErrors_1.catchAsyncError)(adminController.finishPasswordResetRequest));
exports.default = router;
