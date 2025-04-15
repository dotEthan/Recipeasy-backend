import { Router } from "express";

import { RecipeController } from "../controllers/recipesController";
import { validateRequestBodyData } from "../middleware/validateRequestData";
import { FeSavedRecipe, FeUpdateRecipe } from "../schemas/recipe.schema";

export default function createRecipesRouter(recipeController: RecipeController) {
    const router = Router();

    router.get("/public-recipes", recipeController.getPublicRecipes);
    router.put("/update-recipe", validateRequestBodyData(FeUpdateRecipe), recipeController.updateRecipe);
    router.post("/new-recipe", validateRequestBodyData(FeSavedRecipe), recipeController.saveRecipe);

    return router;
}
