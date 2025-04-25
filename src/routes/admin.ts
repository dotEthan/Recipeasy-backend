import express, { Request, Response } from "express";
import { AuthController } from "../controllers/authController";
import { CodeSchema, ResetPasswordSchema, ResetFlowSetPasswordSchema } from "../schemas/user.schema";
import { validateRequestBodyData } from "../middleware/validateRequestData";
import { AuthLoginAttemptRepository, AuthVerificationCodesRepository } from "../repositories/auth/authRepository";
import { UserRepository } from "../repositories/user/userRepository";
import { RecipesRepository } from "../repositories/recipes/recipesRepository";
import { EmailService } from "../services/emailService";
import { AuthService } from "../services/authService";
import { UserService } from "../services/userService";
import { RecipeService } from "../services/recipeService";
import { catchAsyncError } from "../util/catchAsyncErrors";

/**
 * Handles all Administration based routes
 * @todo Add Authentication As needed
 * @todo Full Error Lists
 * @todo catchAsyncError for errors?
 */
// 

const router = express.Router();

const authLoginAttemptRepository = new AuthLoginAttemptRepository();
const authVerificationCodesRepository = new AuthVerificationCodesRepository();
const userRepository = new UserRepository();
const recipeRepository = new RecipesRepository();

const emailService = new EmailService();

const authService = new AuthService(
  authLoginAttemptRepository,
  authVerificationCodesRepository,
  emailService, 
  userRepository
)
const userService = new UserService(
  userRepository, 
  emailService, 
  authService
);
const recipeService = new RecipeService(recipeRepository, userRepository);

const authController = new AuthController(userService, authService, recipeService);

/**
 * Gets Csurf token for user
 * @route GET /admin/csrf-token
 * @group Security - user tracking
 * @returns {SuccessResponse} 200 - Csurfing!
 * @returns {ErrorResponse} 500 - Token not generated
 * @produces application/json
 */
router.get('/csrf-token', (req: Request, res: Response) => {
  try {
    const csrfToken = req.csrfToken();
    console.log(`C'Surfing CANADA! - ${csrfToken}`);
    res.header('X-CSRF-Token', csrfToken); 
    res.status(200).json({success: true});
  } catch (error) {
    console.log('Security token not generated: ', error);
    res.status(500).json({
      success: false,
      message: 'Security Token Not Generated. Oh no!'
    })
  }
});

/**
 * Verify a user's authentication code
 * @route POST /admin/verification-codes/verify
 * @group Authentication - Code verification
 * @param {VerifyCodeRequest} request.body.required - Code and user identifier
 * @returns {SuccessResponse} 200 - Verification successful
 * @returns {ErrorResponse} 400 - Invalid code format
 * @returns {ErrorResponse} 401 - Code expired or incorrect
 * @produces application/json
 * @consumes application/json
 */
router.post('/verification-codes/verify', validateRequestBodyData(CodeSchema), catchAsyncError(authController.verifyCode));


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
router.post('/password-reset-requests', validateRequestBodyData(ResetPasswordSchema), catchAsyncError(authController.resetPasswordRequest));

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
router.post('/password-reset/validate', validateRequestBodyData(CodeSchema), catchAsyncError(authController.validatePasswordToken));

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
router.patch("/user-password", validateRequestBodyData(ResetFlowSetPasswordSchema), catchAsyncError(authController.finishPasswordResetRequest));

export default router;
