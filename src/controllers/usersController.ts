import { Request, Response } from "express";
import { UserService } from "../services/userService";
import { RecipeService } from "../services/recipeService";
import { Recipe } from "../types/recipe";
import { FeUserSchema } from "../schemas/user.schema";
import { AppError } from "../errors";
import { ensureObjectId } from "../util/ensureObjectId";

/**
 * User based req and res handling
 * @todo BOW TO ZOD PARSING!
 * @todo console.logs
 * @todo Error Handling
 */
// 
export class UserController {

    constructor(private userService: UserService, private recipeService: RecipeService) {}


    public getUsersData = async (req: Request, res: Response): Promise<void> => {
        const userId = req.params.id;
        if (!userId) {
            res.status(401).json({success: false, message: 'User Id missing from request'});
            return;
        }

        const freshUser = await this.userService.getUserData(ensureObjectId(userId));

        let userRecipes: Recipe[] = [];
        let totalRecipes = 0;
        if (freshUser.recipes && freshUser.recipes.length > 0) {
            const paginatedResponse = await this.recipeService.getUsersRecipes(freshUser);
            userRecipes = paginatedResponse.data;
            totalRecipes = paginatedResponse.totalDocs
        }
        console.log('getUsersData - retrieved:');
        res.status(200).json({ user: freshUser, userRecipes, totalRecipes });
    }

    public updateUserRecipes = async (req: Request, res: Response): Promise<void> => {
        const currentUserId = ensureObjectId(req.params.id);
        if(!currentUserId) throw new AppError('Malformed User ID', 400);

        const toBeAddedRecipeId = ensureObjectId(req.body.recipeId);
        const originalUserId = ensureObjectId(req.body.originalUserId);

        const updatedUserResponse = await this.userService.updateUserRecipes(currentUserId, originalUserId, toBeAddedRecipeId);
        if (!updatedUserResponse) throw new AppError('No User data found', 404);

        console.log('updateUserRecipes - updated:');
        FeUserSchema.parse(updatedUserResponse);
        res.status(201).json({success: true, user: updatedUserResponse});
    }
}
