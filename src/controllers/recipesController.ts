import { NextFunction, Request, Response } from "express";

import { HttpError } from "../errors";
import { RecipeService } from "../services/recipeService";


export class RecipeController {
  private recipeService: RecipeService;

  constructor(recipeService: RecipeService) {
    this.recipeService = recipeService;
    this.saveRecipe = this.saveRecipe.bind(this);
    this.updateRecipe = this.updateRecipe.bind(this);
    this.getPublicRecipes = this.getPublicRecipes.bind(this);
  }

  // originally created just to get existing recipes into database, update when bulk inserts needed for offline functionality
  public async saveRecipe(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    // const body = req.body as RequestBody;
    try {
      const recipe = req.body.recipe;
      const userId = req.user?._id
      if(!userId) throw new Error('No user Logged in, please log in and try again')
      const response = await this.recipeService.saveRecipe(recipe, userId);
      // RecipeResponseSchema<re.parse(response);
      res.status(201)
        .json({
          response
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
    // const body = req.body as RequestBody;
    try {
      const recipe = req.body.recipe;
      const userId = req.user?._id
      if(!userId) throw new Error('No user Logged in, please log in and try again')
      const response = await this.recipeService.updateRecipe(recipe, userId);
      // RecipeResponseSchema<re.parse(response);
      res.status(201)
        .json(response);
    } catch (err) {
      let message = "Failed to create Recipe";
      if (err instanceof Error) {
        if (err.message === 'Updating recipe failed: recipe does not exist') {
          res.status(404).end();
        }
        message = err.message;
      } 
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