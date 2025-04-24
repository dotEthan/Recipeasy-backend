import { Request, Response } from "express";
import { UserService } from "../services/userService";
import { RecipeService } from "../services/recipeService";
import { Recipe } from "../types/recipe";
import { FeUserSchema } from "../schemas/user.schema";
import { AppError } from "../util/appError";
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
        try {
            console.log('getting User Body: ', req.user);
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
            console.log('User Data retrieved:', freshUser);
            res.status(200).json({ user: freshUser, userRecipes, totalRecipes });
        } catch(error: unknown) {
            console.log('Error Getting User: ', error);
        }
    }

    /**
     * Validate Password Token
     * @todo left to refactor for user dashboard updating
     */
    public userPasswordUpdate = async (req: Request, res: Response): Promise<void> => {
        try {
            // const newPassword = req.body.password;
            // await this.userService.updateUserPassword(newPassword);

            res.status(201).json({success: true});
        } catch(error: unknown) {
            console.log('Error Updating User: ', error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            if (errorMessage === 'User does not exist') {
                res.status(404).json({ success: false, message: errorMessage});
                return;
            }
            res.status(500).json({success: false, message: errorMessage});
        }
    }

    public updateUserRecipes = async (req: Request, res: Response): Promise<void> => {
        try {
            console.log('updating Users Recipes array')
            const currentUserId = ensureObjectId(req.params.id);
            if(!currentUserId) throw new AppError('Malformed User ID', 400);

            const toBeAddedRecipeId = ensureObjectId(req.body.recipeId);
            const originalUserId = ensureObjectId(req.body.originalUserId);
            console.log('update User Recipes', toBeAddedRecipeId);
            const updatedUserResponse = await this.userService.updateUserRecipes(currentUserId, originalUserId, toBeAddedRecipeId);
            if (!updatedUserResponse) throw new AppError('No User data found', 404);

            console.log('updated user: ', updatedUserResponse);
            FeUserSchema.parse(updatedUserResponse);
            res.status(201).json({success: true, user: updatedUserResponse});
        } catch (error) {
            console.log('userUserRecipes Error', error);
        }
    }
}
