import { NextFunction, Request, Response } from "express";

import { HttpError } from "../errors";
import { RecipeService } from "../services/recipeService";
import { Recipe } from "../types/recipe";
import { AppError } from "../util/appError";
import { Visibility } from "../types/enums";
import { ensureObjectId } from "../util/ensureObjectId";


/**
 * Recipe based req and res handling
 * @todo BOW TO ZOD PARSING!
 * @todo console.logs
 * @todo Error Handling
 */
// 
export class RecipeController {

  constructor(private recipeService: RecipeService) {}

  public saveRecipe = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    // const body = req.body as RequestBody;
    try {
      const recipe = req.body.recipe;
      const userId = req.user?._id
      if(!userId) throw new AppError('No user Logged in, please log in and try again', 401);
      const response = await this.recipeService.saveRecipe(recipe, userId);
      // RecipeResponseSchema<re.parse(response);
      res.status(201)
        .json(response);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to create Recipe";
      next(new HttpError(500, message));
    }
  }

  public getRecipes = async (req: Request, res: Response): Promise<void> => {
    const visibility = req.query.visibility as Visibility | undefined;
    const page = parseInt(req.query.page as string || '1', 10);
    const limit = parseInt(req.query.limit as string || '25', 10);
    const skip = (page - 1) * limit;

    try {
      const response = await this.recipeService.getRecipes(visibility, limit, skip);
      if (response === null) throw new AppError('No recipes found: ', 404);
      res.status(200).json(response?.data);
    } catch(error) {
      console.log('getting public recipes err: ', error);
    }
  }

  public updateRecipe = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    // const body = req.body as RequestBody;
    try {
      const recipeId = req.params.id;
      const recipe = req.body.recipe as Recipe;
      if (recipeId !== recipe._id.toString())  throw new AppError('URL Recipe Id does not match Recipe Object ID', 400);
      const userId = req.user?._id
      if(!userId) throw new AppError('No user Logged in, please log in and try again', 401);
      const response = await this.recipeService.updateRecipe(recipe, userId);
      // RecipeResponseSchema<re.parse(response);
      res.status(201)
        .json(response);
    } catch (err) {
      let message = "Failed to update Recipe";
      if (err instanceof Error) {
        if (err.message === 'Updating recipe failed: recipe does not exist') {
          res.status(404).end();
        }
        message = err.message;
      } 
      next(new HttpError(500, message));
    }
  }

  public deleteRecipe = async (req: Request, res: Response): Promise<void> => {
    const recipeId = ensureObjectId(req.params.id);
    const userId = req.user?._id
    try {
      if (!userId) throw new AppError('User Not Found: relogin', 401);
      const successResponse = await this.recipeService.deleteRecipe(userId, recipeId);
      console.log('delete repsonse: ', successResponse);
      res.status(204).end();
    } catch (error) {
      console.log('deleting recipe erorro: ', error);
    }
  }
}