import { Request, Response } from "express";
import { UserService } from "../services/userService";
import { RecipeService } from "../services/recipeService";
import { Recipe } from "../types/recipe";
import { FeUserSchema } from "../schemas/user.schema";
import { ObjectId } from "mongodb";
import { AppError } from "../util/appError";

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

            const freshUser = await this.userService.getUserData(new ObjectId(userId));

            let userRecipes: Recipe[] = [];
            if (freshUser.recipes && freshUser.recipes.length > 0) {
                userRecipes = await this.recipeService.getUsersRecipes(freshUser.recipes);
            }
            console.log('User Data retrieved:', freshUser);
            res.json({ user: freshUser, userRecipes });
        } catch(error: unknown) {
            console.log('Error Getting User: ', error);
        }
    }

    public updateUserPassword = async (req: Request, res: Response): Promise<void> => {
        try {
            const token = req.body.code;
            const newPassword = req.body.password;
            await this.userService.updateUserPassword(newPassword, token);

            res.json({success: true});
        } catch(error: unknown) {
            console.log('Error Updating User: ', error);
            // Todo Look into which errors wont be an instance of error and address here
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            // TODO get correct erorr messages to diferentiate
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
            const currentUserId = new ObjectId(req.params.id);
            if(!currentUserId) throw new AppError('No User Found, relogin', 401);
            const toBeAddedRecipeId = new ObjectId(req.body.recipeId as string);
            const originalUserId = req.body.originalUserId
            console.log('update User Recipes', toBeAddedRecipeId);
            const updatedUserResponse = await this.userService.updateUserRecipes(currentUserId, originalUserId, toBeAddedRecipeId);
            if (!updatedUserResponse) throw new AppError('No User data found', 401);
            console.log('updated user: ', updatedUserResponse);
            FeUserSchema.parse(updatedUserResponse);
            res.json(updatedUserResponse);
        } catch (error) {
            console.log('userUserRecipes Error', error);
        }
    }
}
