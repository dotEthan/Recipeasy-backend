import { Request, Response } from "express";
import { UserService } from "../services/userService";
import { RecipeService } from "../services/recipeService";
import { Recipe } from "../types/recipe";
import { FeUserSchema } from "../schemas/user.schema";
import { BadRequestError } from "../errors";
import { ensureObjectId } from "../util/ensureObjectId";
import { FeRecipeSchema } from "../schemas/recipe.schema";
import { z } from "zod";
import { ErrorCode } from "../types/enums";

/**
 * User based req and res handling
 * @todo - post - Error Handling
 */
// 
export class UserController {

    constructor(private userService: UserService, private recipeService: RecipeService) {}


    public getUsersData = async (req: Request, res: Response): Promise<void> => {
        const userId = req.params.id;
        if (!userId) throw new BadRequestError(
            'UserId missing from request', 
            { location: 'usersController.getUsersData', reqParams: req.params}, 
            ErrorCode.RESOURCE_ID_PARAM_MISSING
        );

        const freshUser = await this.userService.getUserData(ensureObjectId(userId));

        let userRecipes: Recipe[] = [];
        let totalRecipes = 0;
        if (freshUser.recipes && freshUser.recipes.length > 0) {
            const paginatedResponse = await this.recipeService.getUsersRecipes(freshUser);
            userRecipes = paginatedResponse.data;
            totalRecipes = paginatedResponse.totalDocs
        }
        FeUserSchema.parse(freshUser);
        z.array(FeRecipeSchema).parse(userRecipes);
        res.status(200).json({ user: freshUser, userRecipes, totalRecipes });
    }

    public updateUserRecipes = async (req: Request, res: Response): Promise<void> => {
        const currentUserId = ensureObjectId(req.params.id);
        if(!currentUserId) throw new BadRequestError(
            'User Id Param not valid', 
            { currentUserId, location: 'usersController.updateUserRecipes' }, 
            ErrorCode.RESOURCE_ID_PARAM_MISSING
        );

        const toBeAddedRecipeId = ensureObjectId(req.body.recipeId);
        const originalUserId = ensureObjectId(req.body.originalUserId);

        const updatedUserResponse = await this.userService.updateUserRecipes(currentUserId, originalUserId, toBeAddedRecipeId);

        FeUserSchema.parse(updatedUserResponse);
        res.status(201).json({success: true, user: updatedUserResponse});
    }
}
