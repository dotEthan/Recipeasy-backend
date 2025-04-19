import express from "express";

import { RecipeController } from "../controllers/recipesController";
import { validateRequestBodyData } from "../middleware/validateRequestData";
import { FeSavedRecipe, FeUpdateRecipe } from "../schemas/recipe.schema";
import { hasOwnership, isAuthenticated } from "../middleware/auth";
import { UserRepository } from "../repositories/user/userRepository";
import { RecipesRepository } from "../repositories/recipes/recipesRepository";
import { RecipeService } from "../services/recipeService";


const router = express.Router();

const userRepository = new UserRepository();
const recipeRepository = new RecipesRepository();

const recipeService = new RecipeService(recipeRepository, userRepository);

const recipeController = new RecipeController(recipeService);

// Use Single Get for ALL recipes, pass in filters through querys /recipes?visibility=true. 
router.get("/", recipeController.getRecipes);
// Add id as param
router.put("/:id", isAuthenticated(), hasOwnership(), validateRequestBodyData(FeUpdateRecipe), recipeController.updateRecipe);
router.post("/", isAuthenticated(), hasOwnership(),  validateRequestBodyData(FeSavedRecipe), recipeController.saveRecipe);
router.delete("/:id", isAuthenticated(), recipeController.deleteRecipe);

export default router;