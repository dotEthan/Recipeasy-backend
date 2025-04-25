import express from "express";

import { UserController } from "../controllers/usersController";
import { validateRequestBodyData } from "../middleware/validateRequestData";
import { FeUpdateUsersRecipesSchema } from "../schemas/user.schema";
import { isAuthenticated } from "../middleware/auth";
import { catchAsyncError } from "../util/catchAsyncErrors";
import { UserService } from "../services/userService";
import { UserRepository } from "../repositories/user/userRepository";
import { EmailService } from "../services/emailService";
import { AuthService } from "../services/authService";
import { AuthLoginAttemptRepository, AuthVerificationCodesRepository } from "../repositories/auth/authRepository";
import { RecipeService } from "../services/recipeService";
import { RecipesRepository } from "../repositories/recipes/recipesRepository";
// import { updatePasswordSchema } from "../schemas/admin.schema";
import { checkIdParam } from "../middleware/checkIdParam";
// import { registrationLimiter } from "../middleware/rateLimiters";

/**
 * Handles all User based routes
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

const userController = new UserController(userService, recipeService);

/**
 * Get user data
 * @route GET /users/:id
 * @group User Management - User Retrieval
 * @param {number} request.params.required - user _id
 * @returns {GetUserResponse} 200 - User and User Reipes
 * @returns {ErrorResponse} 400 - Validation Error
 * @returns {ErrorResponse} 401 - Missing User Id param
 * @returns {ErrorResponse} 404 - User not found
 * @returns {ErrorResponse} 500 - Server/database issues
 * @produces application/json
*/
router.get("/:id", isAuthenticated(), checkIdParam(), catchAsyncError(userController.getUsersData));

/**
 * Update user with new password
 * @todo for User Admin Panel
 * @route PATCH /users/password
 * @group Recipe Management - User data Update
 * @param {string} request.body.password.required
 * @returns {StandardResponse} 201 - success: true
 * @returns {ErrorResponse} 400 - Validation Error
 * @returns {ErrorResponse} 404 - User does not exist
 * @returns {ErrorResponse} 500 - Server/database issues
 * @produces application/json
 * @consumes application/json
*/
// router.patch("/password", validateRequestBodyData(updatePasswordSchema), userController.userPasswordUpdate);

/**
 * Update User.recipes array
 * @todo send in missing ':id' see what happens
 * @route PATCH /users/:id/recipes
 * @group User Management - User data Update
 * @param {string} request.body.recipeId.required
 * @param {string} request.body.originalUserId.required
 * @returns {StandardUserResponse} 201 - success: true
 * @returns {ErrorResponse} 400 - Validation Error
 * @returns {ErrorResponse} 404 - User does not exist
 * @returns {ErrorResponse} ??? - ID already exists
 * @returns {ErrorResponse} 500 - Server/database issues
 * @produces application/json
 * @consumes application/json
*/
router.patch("/:id/recipes", checkIdParam(), isAuthenticated(), validateRequestBodyData(FeUpdateUsersRecipesSchema), catchAsyncError(userController.updateUserRecipes));

export default router;