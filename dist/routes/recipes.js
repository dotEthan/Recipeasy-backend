"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cloudinary_1 = require("../config/cloudinary");
const recipesController_1 = require("../controllers/recipesController");
const services_1 = require("../services");
const validateRequestData_1 = require("../middleware/validateRequestData");
const auth_1 = require("../middleware/auth");
const checkIdParam_1 = require("../middleware/checkIdParam");
const catchAsyncErrors_1 = require("../util/catchAsyncErrors");
const recipe_schema_1 = require("../schemas/recipe.schema");
const validateImageUpload_1 = require("../middleware/validateImageUpload");
const csrf_1 = require("../middleware/csrf");
const rateLimiters_1 = require("../middleware/rateLimiters");
/**
 * Handles all Recipe based routes
 * @todo Add middleware (authetnication, has ownership, ratelimiter, validateRequestData) As needed
 * @todo - post - Full Error Lists
 */
// 
const router = express_1.default.Router();
const recipeController = new recipesController_1.RecipeController(services_1.recipeService);
/**
 * Create New Recipe data
 * @route POST /recipes/
 * @group Recipe Management - Recipe Retrieval
 * @param {Visibility} request.query.visibility - 'public'/'private'
 * @param {number} request.body.required - New recipe object
 * @returns {PaginateResponse} 201 - New recipe data saved to DB
 * @returns {ErrorResponse} 409 - Recipe already exists
 * @returns {ErrorResponse} 400 - Validation Error
 * @returns {ErrorResponse} 500 - Server/database issues
 * @produces application/json
 * @consumes application/json
 * @example
 * // Client-side usage:
 * fetch('/recipes/`, { method: 'POST', body: recipe  });
 */
router.post("/", (0, auth_1.isAuthenticated)(), (0, csrf_1.csrfMiddleware)(), (0, validateRequestData_1.validateRequestBodyData)(recipe_schema_1.NewRecipeSchema), (0, catchAsyncErrors_1.catchAsyncError)(recipeController.saveNewRecipe));
/**
 * Get Public Recipe data
 * @todo - post - refactor to accomodate pagination
 * @route GET /recipes/
 * @group Recipe Management - Recipe Retrieval
 * @param {Visibility} request.query.visibility - 'public'/'private'
 * @param {number} request.query.page - User's page (pagination)
 * @param {number} request.query.limit - Recipes per page
 * @returns {PaginateResponse} 200 - Recipe Data
 * @returns {ErrorResponse} 404 - Recipes not found
 * @returns {ErrorResponse} 401 - Queries malformed
 * @returns {ErrorResponse} 500 - Server/database issues
 * @produces application/json
 * @example
 * // Client-side usage:
 * fetch('/recipes/`, { method: 'GET' });
 */
router.get("/", (0, catchAsyncErrors_1.catchAsyncError)(recipeController.getPublicRecipes));
/**
 * Update Recipe data
 * @route PUT /recipes/:id
 * @group Recipe Management - Recipe Retrieval
 * @param {string} request.params.id - Recipe Id to update
 * @param {Recipe} request.body.recipe - updated recipe data
 * @returns {PaginateResponse} 201 - Update completed Successfully
 * @returns {ErrorResponse} 404 - Recipes not found
 * @returns {ErrorResponse} 401 - Queries malformed
 * @returns {ErrorResponse} 500 - Server/database issues
 * @consumes application/json
 * @produces application/json
 * @example
 * // Client-side usage:
 * fetch('/recipes/${recipeId}`, { method: 'PUT', body: updatedRecipe  });
 */
router.put("/:id", (0, csrf_1.csrfMiddleware)(), (0, checkIdParam_1.checkIdParam)(), (0, auth_1.isAuthenticated)(), (0, validateRequestData_1.validateRequestBodyData)(recipe_schema_1.FeUpdateRecipeSchema), (0, catchAsyncErrors_1.catchAsyncError)(recipeController.updateRecipe));
/**
 * Delete Recipe data
 * @route POST /recipes/:id
 * @group Recipe Management - Recipe Deletion
 * @param {number} request.params.require - Recipe _id
 * @returns {PaginateResponse} 204 - New recipe data saved to DB
 * @returns {ErrorResponse} 400 - Validation Error
 * @returns {ErrorResponse} 401 - User not Found
 * @returns {ErrorResponse} 500 - Server/database issues
 * @consumes application/json
 * @produces application/json
 * @example
 * // Client-side usage:
 * fetch('/recipes/${recipeId}`, { method: 'DELETE' });
 */
router.delete("/:id", rateLimiters_1.apiLimiter, (0, csrf_1.csrfMiddleware)(), (0, checkIdParam_1.checkIdParam)(), (0, auth_1.isAuthenticated)(), (0, catchAsyncErrors_1.catchAsyncError)(recipeController.deleteRecipe));
/**
 * Image upload for recipes
 * @route post /image
 * @group Recipe Management - image uploads
 * @param {File} request.file - Image file user Uploaded
 * @returns {StandardResponse} 201 - success: true url: secureUrl
 * @returns {ErrorResponse} 400 - Validation Error
 * @returns {ErrorResponse} 404 - User does not exist
 * @returns {ErrorResponse} 500 - Server/database issues
 * @consumes application/json
 * @produces application/json
 * @remarks
 * ## Validation Notes:
 * - File validation happens in controller as file is not in req.body
 * @example
 * // Client-side usage:
 * const formData = new FormData();
 * formData.append('image', fileInput.files[0]);
 * fetch('/recipes/image-upload', { method: 'POST', body: formData });
 */
router.post("/image", rateLimiters_1.apiLimiter, (0, csrf_1.csrfMiddleware)(), (0, auth_1.isAuthenticated)(), cloudinary_1.upload.single('image'), validateImageUpload_1.validateImageUpload, (0, catchAsyncErrors_1.catchAsyncError)(recipeController.uploadRecipeImage));
/**
 * Deleted Image uploaded for recipe
 * @route delete /image/:id
 * @group Recipe Management - image deletion
 * @param {string} request.body.params.id - Public Id of the image to delete
 * @returns {StandardResponse} 201 - success: true
 * @returns {ErrorResponse} 400 - Validation Error
 * @returns {ErrorResponse} 404 - User does not exist
 * @returns {ErrorResponse} 500 - Server/database issues
 * @produces application/json
 * @consumes application/json
 * @example
 * // Client-side usage:
 * fetch(`/recipes/image/${imageId}`, { method: 'DELETE' });
 */
router.delete("/image/:id", rateLimiters_1.apiLimiter, (0, csrf_1.csrfMiddleware)(), (0, checkIdParam_1.checkIdParam)(), (0, auth_1.isAuthenticated)(), (0, catchAsyncErrors_1.catchAsyncError)(recipeController.deleteRecipeImage));
exports.default = router;
