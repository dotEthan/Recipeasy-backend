import { Router } from "express";

import { RecipeController } from "../controllers/recipesController";
import { validateRequestBodyData } from "../middleware/validateRequestData";
import { FeSavedRecipeArray } from "../schemas/recipe.schema";

export default function createRecipesRouter(recipeController: RecipeController) {
    const router = Router();

    router.post("/new-recipes", validateRequestBodyData(FeSavedRecipeArray), recipeController.saveRecipes);
    router.get("/public-recipes", recipeController.getPublicRecipes);

    return router;
}
