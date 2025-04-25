import { Request, Response } from "express";
import { v2 as cloudinary } from 'cloudinary';

import { RecipeService } from "../services/recipeService";
import { Recipe } from "../types/recipe";
import { AppError } from "../errors";
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

  public saveRecipe = async (req: Request,res: Response): Promise<void> => {
    const recipe = req.body.recipe;
    const userId = req.user?._id
    if(!userId) throw new AppError('No user Logged in, please log in and try again', 401);
    const response = await this.recipeService.saveRecipe(recipe, userId);

    console.log('saveRecipe - Saved');
    // RecipeResponseSchema<re.parse(response);
    res.status(201).json(response);
  }

  public getRecipes = async (req: Request, res: Response): Promise<void> => {
    const visibility = req.query.visibility as Visibility | undefined;
    const page = parseInt(req.query.page as string || '1', 10);
    const limit = parseInt(req.query.limit as string || '25', 10);
    const skip = (page - 1) * limit;

    console.log('getRecipe - Gotten');
    const response = await this.recipeService.getRecipes(visibility, limit, skip);
    if (response === null) throw new AppError('No recipes found: ', 404);

    res.status(200).json(response?.data);
  }

  public updateRecipe = async (req: Request,res: Response,): Promise<void> => {
    const recipeId = req.params.id;
    const recipe = req.body.recipe as Recipe;
    if (!recipeId || recipeId !== recipe._id.toString())  throw new AppError('URL Recipe Id does not match Recipe Object ID', 400);
    const userId = req.user?._id
    if(!userId) throw new AppError('No user Logged in, please log in and try again', 401);
    const response = await this.recipeService.updateRecipe(recipe, userId);

    console.log('updateRecipe - Updated');
    // RecipeResponseSchema<re.parse(response);
    res.status(201).json(response);
  }

  public deleteRecipe = async (req: Request, res: Response): Promise<void> => {
    console.log('deleting: ', req.params.id)
    const recipeId = ensureObjectId(req.params.id);
    const userId = req.user?._id
    if (!recipeId) throw new AppError('Recipe id to delete not provided: relogin', 401);
    if (!userId) throw new AppError('User Not Found: relogin', 401);

    await this.recipeService.deleteRecipe(userId, recipeId);
  
    console.log('deleteRecipe - deleted');
    res.status(204).end();
  }

  public uploadRecipeImage = async (req: Request, res: Response): Promise<void> => {
    if (!req.file) {
      throw new AppError("No file uploaded", 400);
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
    if (!uploadResult.secure_url) throw new AppError('Image upload URL missing, try again?', 500);

    console.log('uploadRecipeImage - uploaded');
    res.status(201).json({success: true, url: uploadResult.secure_url});
  }

  public deleteRecipeImage = async (req: Request, res: Response) => {
    const imagePublicId = decodeURIComponent(req.params.id);
    if (!imagePublicId) throw new AppError('deleteRecipeImage - imagePublicId malformed', 401);
    await cloudinary.uploader.destroy(imagePublicId);

    console.log('deleteRecipeImage - deleted');
    res.status(204).end();
  }
}