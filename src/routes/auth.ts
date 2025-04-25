import express, { Request, Response } from "express";
import { validateRequestBodyData } from "../middleware/validateRequestData";
import { LoginSchema, RegisterUserSchema } from "../schemas/user.schema";
import { catchAsyncError } from "../util/catchAsyncErrors";
import { AuthController } from "../controllers/authController";
import { EmailService } from "../services/emailService";
import { AuthService } from "../services/authService";
import { UserService } from "../services/userService";
import { RecipesRepository } from "../repositories/recipes/recipesRepository";
import { UserRepository } from "../repositories/user/userRepository";
import { AuthLoginAttemptRepository, AuthVerificationCodesRepository } from "../repositories/auth/authRepository";
import { RecipeService } from "../services/recipeService";
import { isAuthenticated } from "../middleware/auth";


/**
 * Handles all Authorization based routes
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
 * Check to ensure user session is still active
 * @route GET /auth/session
 * @group Authorization - Session Management
 * @returns {LoginResponse} 200 - User registered
 * @returns {ErrorResponse} 401 - User credentials wrong
 * @returns {ErrorResponse} 400 - Validation Error
 * @returns {ErrorResponse} 500 - Server/database issues
 * @produces application/json
 */
router.get('/session', isAuthenticated(), (req: Request, res: Response) => {
  console.log('checking session is Autheticated: ', req.isAuthenticated());
  if (req.isAuthenticated()) {
    res.status(200).json({ success: true, user: req.user});
  } else {
    res.status(401).json({success: false, message: 'User Not Autheticated'})
  }
});

/**
 * Delete User session
 * @route DELETE /auth/session
 * @group Authorization - Session Management
 * @returns {StandardResponse} 201 - User registered
 * @returns {ErrorResponse} 400 - Validation Error
 * @returns {ErrorResponse} 401 - User password too short
 * @returns {ErrorResponse} 409 - User Already Exists
 * @returns {ErrorResponse} 500 - Server/database issues
 * @produces application/json
 * @consumes application/json
 */
router.delete("/session", isAuthenticated(), catchAsyncError(authController.logUserOut));

/**
 * Log in user
 * @route POST /auth/login
 * @group Authorization - Session Management
 * @returns {LoginResponse} 200 - User registered
 * @returns {ErrorResponse} 400 - Validation Error
 * @returns {ErrorResponse} 401 - User credentials wrong
 * @returns {ErrorResponse} 404 - User Not Found
 * @returns {ErrorResponse} 500 - Server/database issues
 * @produces application/json
 * @consumes application/json
 */
router.post("/login", validateRequestBodyData(LoginSchema), catchAsyncError(authController.login));

/**
 * Register new user
 * @route POST /auth/register
 * @group Authorization - User Management
 * @param {EmailRegistration} request.body.required - email and plaintext password
 * @returns {StandardResponse} 201 - User registered
 * @returns {ErrorResponse} 400 - Validation Error
 * @returns {ErrorResponse} 401 - User password too short
 * @returns {ErrorResponse} 409 - User Already Exists
 * @returns {ErrorResponse} 500 - Server/database issues
 * @produces application/json
 * @consumes application/json
 */
router.post("/register", validateRequestBodyData(RegisterUserSchema), catchAsyncError(authController.register));

export default router;