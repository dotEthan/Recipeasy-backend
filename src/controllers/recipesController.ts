import { NextFunction, Request, Response } from "express";

import { HttpError } from "../errors";
import { Recipe } from "../types/recipe";

// type RequestBody = {
//   text: string;
// };

type RequestParams = {
  recipeId: string;
};

class RecipeController {
  recipes: Recipe[];

  constructor() {
    this.recipes = [];
    this.getAllRecipes = this.getAllRecipes.bind(this);
    this.createRecipe = this.createRecipe.bind(this);
    this.updateRecipe = this.updateRecipe.bind(this);
    this.deleteRecipe = this.deleteRecipe.bind(this);
  }

  public async getAllRecipes(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      console.log("recipes: ", this.recipes);
      res.status(200).json({ message: "recipes got", recipes: this.recipes });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to Get Recipes";
      next(new HttpError(500, message));
    }
  }

  public async createRecipe(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    // const body = req.body as RequestBody;
    try {
      // const newRecipe: Recipe = {
      //   id: "id2",
      //   title: body.text,
      // };
      // this.recipes.push(newRecipe);
      console.log(this.recipes);
      res
        .status(200)
        .json({
          message: "recipe Added: ",
          recipes: this.recipes,
        });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to create Recipe";
      next(new HttpError(500, message));
    }
  }

  public async updateRecipe(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    const params = req.params as RequestParams;
    const recipeId = params.recipeId;
    // const body = req.body as RequestBody;
    console.log("updating");
    try {
      const recipeIndex = this.recipes.findIndex(
        (recipe) => recipe.id === recipeId,
      );
      if (recipeIndex !== -1) {
        // this.recipes[recipeIndex] = {
        //   id: this.recipes[recipeIndex].id,
        //   title: body.text,
        // };
        res
          .status(200)
          .json({
            message: "updated Recipe:" + this.recipes,
            recipes: this.recipes,
          });
        return;
      }
      res.status(404).json({ message: "Could not find Recipe to Update" });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to update Recipe";
      next(new HttpError(500, message));
    }
  }

  public async deleteRecipe(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    const params = req.params as RequestParams;
    try {
      this.recipes = this.recipes.filter(
        (recipe) => recipe.id !== params.recipeId,
      );
      res
        .status(200)
        .json({
          message: "Recipe Deleted",
          deletedRecipeId: params.recipeId,
          recipes: this.recipes,
        });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to delete Recipes";
      next(new HttpError(500, message));
    }
  }
}

export const recipeController = new RecipeController();
