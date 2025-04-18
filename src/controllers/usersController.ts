import { Request, Response } from "express";
import { UserService } from "../services/userService";
import { RecipeService } from "../services/recipeService";
import { Recipe } from "../types/recipe";
import { FeUserSchema } from "../schemas/user.schema";
import { ObjectId } from "mongodb";

export class UserController {

    constructor(private userService: UserService, private recipeService: RecipeService) {}


    public getUserData = async (req: Request, res: Response): Promise<void> => {
        try {
            console.log('getting User Body: ', req.user);
            const reqUser = req.user;
            if (!reqUser) {
                res.status(401).json({success: false, message: 'Session User Data Not Found, relogin'});
                return;
            }

            const freshUser = await this.userService.getUserData(reqUser._id);

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
            console.log('updating user Recipes array')
            if(!req.user?._id) throw new Error('No User Found, relogin')
            const newRecipeId = new ObjectId(req.body.id as string);
            const originalUserId = req.body.originalUserId
            console.log('update User Recipes', newRecipeId);
            const updatedUserResponse = await this.userService.updateUserRecipes(req.user?._id, originalUserId, newRecipeId);
            if (!updatedUserResponse) throw new Error('No User data found');
            console.log('updated user: ', updatedUserResponse);
            FeUserSchema.parse(updatedUserResponse);
            res.json(updatedUserResponse);
        } catch (error) {
            console.log('userUserRecipes Error', error);
        }
    }
}
