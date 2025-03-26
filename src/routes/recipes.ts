import { Router } from "express";

import { recipeController } from "../controllers/recipesController";

const router = Router();

router.get("/", recipeController.getAllRecipes);

router.post("/recipes/add", recipeController.createRecipe);

router.put("/recipes/:recipeId", recipeController.updateRecipe);

router.delete("/recipes/:recipeId", recipeController.deleteRecipe);

export default router;
