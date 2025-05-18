import { Request, Response } from "express";
import { v2 as cloudinary } from 'cloudinary';

import { RecipeService } from "../services/recipeService";
import { Recipe } from "../types/recipe";
import { BadRequestError, NotFoundError, ServerError, UnauthorizedError } from "../errors";
import { ErrorCode, Visibility } from "../types/enums";
import { ensureObjectId } from "../util/ensureObjectId";
import { FeRecipeSchema, StandardRecipeResponseSchema } from "../schemas/recipe.schema";
import { z } from "zod";
import { zodValidationWrapper } from "../util/zodParseWrapper";


/**
 * Recipe based req and res handling
 * @todo - post - Double check for unhandled errors
 */
// 
export class RecipeController {

  constructor(private recipeService: RecipeService) {}

  public saveNewRecipe = async (req: Request,res: Response): Promise<void> => {
    const recipe = req.body.recipe;
    const userId = req.user?._id
    if(!userId) throw new UnauthorizedError(
      'Request User _id not found, relogin', 
      { reqUser: req.user, location: 'recipesController.saveNewRecipe' },
      ErrorCode.REQ_USER_MISSING
    );
    if(!recipe) throw new BadRequestError(
      'Recipe data not found', 
      { 
        recipe, 
        location: 'recipesController.saveNewRecipe',
        details: 'New recipe data not found'
      },
      ErrorCode.REQ_BODY_DATA_MISSING
    );
    
    const response = await this.recipeService.saveNewRecipe(recipe, userId);
    zodValidationWrapper(StandardRecipeResponseSchema, response, 'recipesController.saveNewRecipe');
    res.status(201).json(response);
  }

  public getPublicRecipes = async (req: Request, res: Response): Promise<void> => {
    const visibility = req.query.visibility as Visibility | undefined;
    const page = parseInt(req.query.page as string || '1', 10);
    const limit = parseInt(req.query.limit as string || '25', 10);
    const skip = (page - 1) * limit;

    const response = await this.recipeService.getRecipes(visibility, limit, skip);
    if (response === null) throw new NotFoundError(
      'No public recipes found ', 
      { response, location: 'recipesController.getPublicRecipes' }, 
      ErrorCode.PUBLIC_RECIPES_MISSING
    );

    zodValidationWrapper(z.array(FeRecipeSchema), response.data, 'recipesController.getPublicRecipes');
    res.status(200).json(response?.data);
  }

  public updateRecipe = async (req: Request,res: Response,): Promise<void> => {
    const recipeId = req.params.id;
    const recipe = req.body.recipe as Recipe;
    if (!recipeId || recipeId !== recipe._id.toString())  throw new BadRequestError(
      'URL Recipe Id does not match Recipe Object ID', 
      { recipeId, recipe, location: 'recipesController.updateRecipe' }, 
      ErrorCode.ID_PARAM_MISMATCH);

    if (!req.user?._id)  throw new UnauthorizedError(
      'request userId not found, relogin', 
      { user: req.user, location: 'recipesController.updateRecipe' }, 
      ErrorCode.REQ_USER_MISSING
    );
    const userId = req.user?._id;

    const response = await this.recipeService.updateRecipe(recipe, userId);

    zodValidationWrapper(StandardRecipeResponseSchema, response, 'recipesController.updateRecipe');
    res.status(201).json(response);
  }

  public deleteRecipe = async (req: Request, res: Response): Promise<void> => {
    const recipeId = ensureObjectId(req.params.id);
    const userId = req.user?._id
    if (!recipeId) throw new BadRequestError(
      'Recipe id to delete not provided: relogin', 
      { recipeId, location: 'recipesController.deleteRecipe' }, 
      ErrorCode.ID_PARAM_MISSING
    );
    if (!userId) throw new UnauthorizedError(
      'User Not Found: relogin', 
      { userId, location: 'recipesController.deleteRecipe' }, 
      ErrorCode.REQ_USER_MISSING
    );

    await this.recipeService.deleteRecipe(userId, recipeId);
  
    res.status(204).end();
  }

  public uploadRecipeImage = async (req: Request, res: Response): Promise<void> => {
    if (!req.file) {
      throw new BadRequestError(
        "No file uploaded",
        { location: 'recipesController.uploadRecipeImage' },
        ErrorCode.FILE_MISSING
      );
    }
    const options = {
      folder: `recipeasy/user_uploads/${req.user?._id.toString()}`,
      use_filename: true,
      unique_filename: true,
      overwrite: false,
      transformation: [
        {
          height: 350,
          crop: 'scale',
          fetch_format: "webp",
          quality: "auto",
          effect: "sharpen:30"
        }
      ],
    }
    const base64File = req.file.buffer.toString('base64');
    const dataURI = `data:${req.file.mimetype};base64,${base64File}`
    const uploadResult = await cloudinary.uploader.upload(dataURI, options);
    if (!uploadResult.secure_url) throw new ServerError(
      'Image upload URL missing, try again?', 
      { uploadResult, location: 'recipesController.uploadRecipeImage' }, 
      ErrorCode.RESPONSE_DATA_MISSING
    );

    res.status(201).json({success: true, url: uploadResult.secure_url});
  }

  public deleteRecipeImage = async (req: Request, res: Response) => {
    const publicId = req.params.id
    const imagePublicId = decodeURIComponent(publicId);
    if (!imagePublicId) throw new BadRequestError(
      'imagePublicId malformed', 
      { publicId, location: 'recipesController.deleteRecipeImage' },
      ErrorCode.ID_PARAM_MISSING
    );
    await cloudinary.uploader.destroy(imagePublicId);

    res.status(204).end();
  }
}