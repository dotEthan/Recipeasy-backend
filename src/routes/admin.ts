import express from "express";


import { AdminController } from "../controllers/adminController";
import { emailVerificationService, passwordService, userService } from "../services";
import { validateRequestBodyData } from "../middleware/validateRequestData";
import { catchAsyncError } from "../util/catchAsyncErrors";

import { ResetFlowSetPasswordSchema } from "../schemas/user.schema";
import { IsCodeSchema, IsEmailSchema } from "../schemas/shared.schema";
import { csrfMiddleware } from "../middleware/csrf";

/**
 * Handles all Administration based routes
 * @todo Add Authentication As needed
 * @todo Full Error Lists
 * @todo catchAsyncError for errors?
 */
// 

const router = express.Router();
const adminController = new AdminController(passwordService, userService, emailVerificationService);

/**
 * Gets Csurf token for user
 * @route GET /admin/csrf-token
 * @group Security - user tracking
 * @returns {SuccessResponse} 200 - Csurfing!
 * @returns {ErrorResponse} 500 - Token not generated
 * @produces application/json
 */
router.get('/csrf-token', catchAsyncError(adminController.getCsurf));

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
router.post('/verification-codes/verify', csrfMiddleware(true), validateRequestBodyData(IsCodeSchema), catchAsyncError(adminController.verifyCode));


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
router.post('/password-reset-requests', csrfMiddleware(true), validateRequestBodyData(IsEmailSchema), catchAsyncError(adminController.resetPasswordRequest));

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
router.post('/password-reset/validate', csrfMiddleware(true), validateRequestBodyData(IsCodeSchema), catchAsyncError(adminController.validatePasswordToken));

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
router.patch("/user-password", csrfMiddleware(true), validateRequestBodyData(ResetFlowSetPasswordSchema), catchAsyncError(adminController.finishPasswordResetRequest));

export default router;
