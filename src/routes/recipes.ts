import { Router } from "express";

import { RecipeController } from "../controllers/recipesController";
import { validateRequestBodyData } from "../middleware/validateRequestData";
import { FeSavedRecipe, FeUpdateRecipe } from "../schemas/recipe.schema";
import { isAuthenticated } from "../middleware/auth";

export default function createRecipesRouter(recipeController: RecipeController) {
    const router = Router();
    // RESTFULy id resource in url
    // Autheticate as needed
    router.get("/public-recipes", recipeController.getPublicRecipes);
    router.put("/update-recipe", validateRequestBodyData(FeUpdateRecipe), recipeController.updateRecipe);
    router.post("/new-recipe", validateRequestBodyData(FeSavedRecipe), recipeController.saveRecipe);
    router.delete("/recipe/:id", isAuthenticated(), recipeController.deleteRecipe);

    return router;
}
