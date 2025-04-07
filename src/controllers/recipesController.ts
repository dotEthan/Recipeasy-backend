import { NextFunction, Request, Response } from "express";

import { HttpError } from "../errors";
import { RecipeService } from "../services/recipeService";


export class RecipeController {
  private recipeService: RecipeService;

  constructor(recipeService: RecipeService) {
    this.recipeService = recipeService;
    this.saveRecipes = this.saveRecipes.bind(this);
    this.getPublicRecipes = this.getPublicRecipes.bind(this);
  }

  // originally created just to get existing recipes into database, update when bulk inserts needed for offline functionality
  public async saveRecipes(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    // const body = req.body as RequestBody;
    try {
      const recipes = req.body;
      this.recipeService.saveRecipes(req.body.recipes);
      res.status(201)
        .json({
          message: "recipe Added: ",
          recipes: recipes,
        });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to create Recipe";
      next(new HttpError(500, message));
    }
  }

  public async getPublicRecipes(req: Request, res: Response) {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 25;
    const skip = (page - 1 ) * limit;
    try {
      console.log('getting limit: ', limit);
      const response = await this.recipeService.getPublicRecipes(limit, skip);

      res.json(response?.data);
    } catch(error) {
      console.log('getting public recipes err: ', error);
    }
  }
}