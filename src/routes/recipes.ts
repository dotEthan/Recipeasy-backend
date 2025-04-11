import { Router } from "express";

import { RecipeController } from "../controllers/recipesController";
import { validateRequestBodyData } from "../middleware/validateRequestData";
import { FeSavedRecipe } from "../schemas/recipe.schema";

export default function createRecipesRouter(recipeController: RecipeController) {
    const router = Router();

    router.post("/new-recipe", validateRequestBodyData(FeSavedRecipe), recipeController.saveRecipe);
    router.get("/public-recipes", recipeController.getPublicRecipes);

    return router;
}
