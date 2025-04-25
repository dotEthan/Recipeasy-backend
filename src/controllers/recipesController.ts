import { NextFunction, Request, Response } from "express";
import { v2 as cloudinary } from 'cloudinary';

import { HttpError } from "../errors";
import { RecipeService } from "../services/recipeService";
import { Recipe } from "../types/recipe";
import { AppError } from "../util/appError";
import { Visibility } from "../types/enums";
import { ensureObjectId } from "../util/ensureObjectId";


/**
 * Recipe based req and res handling
 * @todo Cloudinary Options to maintain or crop
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
    try {
      const recipeId = req.params.id;
      const recipe = req.body.recipe as Recipe;
      if (!recipeId || recipeId !== recipe._id.toString())  throw new AppError('URL Recipe Id does not match Recipe Object ID', 400);
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
    console.log('deleting: ', req.params.id)
    const recipeId = ensureObjectId(req.params.id);
    const userId = req.user?._id
    if (!recipeId) throw new AppError('Recipe id to delete not provided: relogin', 401);
    if (!userId) throw new AppError('User Not Found: relogin', 401);
    try {
      const successResponse = await this.recipeService.deleteRecipe(userId, recipeId);
      console.log('delete repsonse: ', successResponse);
      res.status(204).end();
    } catch (error) {
      console.log('deleting recipe erorro: ', error);
    }
  }

  public uploadRecipeImage = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    if (!req.file) {
      throw new AppError("No file uploaded", 400);
    }
    console.log('uploading req: ', req.file);
    try {
      const options = {
        folder: `recipeasy/user_uploads/${req.user?._id.toString()}`,
        use_filename: true,
        unique_filename: true,
        overwrite: false,
        transformation: [
          // {
          //   height: 350,
          //   crop: 'scale',
          //   fetch_format: "webp",
          //   quality: "auto",
          //   effect: "sharpen:30"
          // }
          {
            width: 500,
            height: 350,
            crop: 'limit'
          },{
            width: 500,
            height: 350,
            crop: "fill",
            gravity: "auto",
            fetch_format: "webp",
            quality: "auto",
            effect: "sharpen:100" // Todo TEST differences
          }
        ],
      }
      const base64File = req.file.buffer.toString('base64');
      const dataURI = `data:${req.file.mimetype};base64,${base64File}`
      const uploadResult = await cloudinary.uploader.upload(dataURI, options);
      console.log('uploadResult: ', uploadResult)
      if (!uploadResult.secure_url) throw new AppError('Image upload URL missing, try again?', 500);

      res.status(201).json({success: true, url: uploadResult.secure_url});
    } catch (error) {
      if (error instanceof AppError) next(error);
      console.log('uploadRecipeImage - upload failed: ', error);
      console.log('uploadRecipeImage - upload failed: ', typeof error);
    }
  }

  public deleteRecipeImage = async (req: Request, res: Response, next: NextFunction) => {
    const imagePublicId = decodeURIComponent(req.params.id);
    if (!imagePublicId) throw new AppError('deleteRecipeImage - imagePublicId malformed', 401);
    try {
      console.log('deleting:', imagePublicId);
      await cloudinary.uploader.destroy(imagePublicId);
      res.status(204).end();
    } catch (error) {
      console.log('deleteRecipeImage - error', error);
      next(error);
    }
  }
}