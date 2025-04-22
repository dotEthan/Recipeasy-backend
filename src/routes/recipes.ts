import express from "express";

import { RecipeController } from "../controllers/recipesController";
import { validateRequestBodyData } from "../middleware/validateRequestData";
import { FeSavedRecipe, FeUpdateRecipe } from "../schemas/recipe.schema";
import { hasOwnership, isAuthenticated } from "../middleware/auth";
import { UserRepository } from "../repositories/user/userRepository";
import { RecipesRepository } from "../repositories/recipes/recipesRepository";
import { RecipeService } from "../services/recipeService";

/**
 * Handles all Recipe based routes
 * @todo Add Authentication As needed
 * @todo Full Error Lists
 */
// 

const router = express.Router();

const userRepository = new UserRepository();
const recipeRepository = new RecipesRepository();

const recipeService = new RecipeService(recipeRepository, userRepository);

const recipeController = new RecipeController(recipeService);

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
 */
router.post("/", isAuthenticated(), hasOwnership(),  validateRequestBodyData(FeSavedRecipe), recipeController.saveRecipe);

/**
 * Get Public Recipe data
 * @todo refactor to accomodate pagination 
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
 */
router.get("/", recipeController.getRecipes);

/**
 * Update Recipe data
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
 */
router.put("/:id", isAuthenticated(), hasOwnership(), validateRequestBodyData(FeUpdateRecipe), recipeController.updateRecipe);


/**
 * Delete Recipe data
 * @route POST /recipes/:id
 * @group Recipe Management - Recipe Deletion
 * @param {number} request.params.require - Recipe _id
 * @returns {PaginateResponse} 204 - New recipe data saved to DB
 * @returns {ErrorResponse} 400 - Validation Error
 * @returns {ErrorResponse} 401 - User not Found
 * @returns {ErrorResponse} 500 - Server/database issues
 * @produces application/json
 * @consumes application/json
 */
router.delete("/:id", isAuthenticated(), recipeController.deleteRecipe);

export default router;