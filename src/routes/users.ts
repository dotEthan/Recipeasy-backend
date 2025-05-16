import express from "express";

import { UserController } from "../controllers/usersController";
import { validateRequestBodyData } from "../middleware/validateRequestData";
import { FeUpdateUsersRecipesSchema } from "../schemas/user.schema";
import { catchAsyncError } from "../util/catchAsyncErrors";
import { checkIdParam } from "../middleware/checkIdParam";
import { recipeService, userService } from "../services";
import { apiLimiter } from "../middleware/rateLimiters";
import { checkAccessToken } from "../middleware/checkAccessToken";

/**
 * Handles all User based routes
 * @todo Add Middleware
 * @todo - post - Full Error Lists
 * @todo - post - Test what happens if :id missing
 */
// 
const router = express.Router();

const userController = new UserController(userService, recipeService);

/**
 * Get user data
 * @todo reimplement when public profiles are created
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
// router.get(
//     "/:id", 
//     apiLimiter,
//     checkAccessToken,
//     checkIdParam(), 
//     catchAsyncError(userController.getUsersData)
// );

/**
 * Get current user data 
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
router.get(
    "/me", 
    apiLimiter,
    checkAccessToken,
    catchAsyncError(userController.getCurrentUsersData)
);

/**
 * Update User.recipes array
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
router.patch(
    "/:id/recipes", 
    apiLimiter,
    checkAccessToken,
    checkIdParam(), 
    validateRequestBodyData(FeUpdateUsersRecipesSchema), 
    catchAsyncError(userController.updateUserRecipes));

export default router;