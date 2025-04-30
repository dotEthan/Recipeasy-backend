"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const usersController_1 = require("../controllers/usersController");
const validateRequestData_1 = require("../middleware/validateRequestData");
const user_schema_1 = require("../schemas/user.schema");
const auth_1 = require("../middleware/auth");
const catchAsyncErrors_1 = require("../util/catchAsyncErrors");
const checkIdParam_1 = require("../middleware/checkIdParam");
const services_1 = require("../services");
const csrf_1 = require("../middleware/csrf");
const rateLimiters_1 = require("../middleware/rateLimiters");
// import { registrationLimiter } from "../middleware/rateLimiters";
/**
 * Handles all User based routes
 * @todo Add Middleware
 * @todo - post - Full Error Lists
 * @todo - post - Test what happens if :id missing
 */
// 
const router = express_1.default.Router();
const userController = new usersController_1.UserController(services_1.userService, services_1.recipeService);
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
router.get("/:id", rateLimiters_1.apiLimiter, (0, checkIdParam_1.checkIdParam)(), (0, auth_1.isAuthenticated)(), (0, catchAsyncErrors_1.catchAsyncError)(userController.getUsersData));
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
router.patch("/:id/recipes", rateLimiters_1.apiLimiter, (0, csrf_1.csrfMiddleware)(), (0, checkIdParam_1.checkIdParam)(), (0, auth_1.isAuthenticated)(), (0, validateRequestData_1.validateRequestBodyData)(user_schema_1.FeUpdateUsersRecipesSchema), (0, catchAsyncErrors_1.catchAsyncError)(userController.updateUserRecipes));
exports.default = router;
