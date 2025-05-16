import { Request, Response } from "express";
import { UserService } from "../services/userService";
import { RecipeService } from "../services/recipeService";
import { FeUserSchema } from "../schemas/user.schema";
import { BadRequestError, UnauthorizedError } from "../errors";
import { ensureObjectId } from "../util/ensureObjectId";
import { FeRecipeSchema } from "../schemas/recipe.schema";
import { z } from "zod";
import { ErrorCode } from "../types/enums";
import { zodValidationWrapper } from "../util/zodParseWrapper";

/**
 * User based req and res handling
 * @todo - post - Error Handling
 */
// 
export class UserController {

    constructor(private userService: UserService, private recipeService: RecipeService) {}

    // Originally used for current user data, as I've removed sessions, the getCurrentUsersData below replaced it. Leaving here for public profiles when implemented. 
    // public getUsersData = async (req: Request, res: Response): Promise<void> => {
    //     const userId = req.params.id;
    //     if (!userId) throw new BadRequestError(
    //         'UserId missing from request', 
    //         { location: 'usersController.getUsersData', reqParams: req.params}, 
    //         ErrorCode.RESOURCE_ID_PARAM_MISSING
    //     );

    //     const freshUser = await this.userService.getUserData(ensureObjectId(userId));
        
    //     const paginatedResponse = await this.recipeService.getUsersRecipes(freshUser);

    //     const userRecipes = paginatedResponse.data;
    //     const totalRecipes = paginatedResponse.totalDocs;

    //     zodValidationWrapper(FeUserSchema, freshUser, 'usersController.getUsersData');
    //     zodValidationWrapper(z.array(FeRecipeSchema), userRecipes, 'usersController.getUsersData');
    //     res.status(200).json({ user: freshUser, userRecipes, totalRecipes });
    // }

    public getCurrentUsersData = async (req: Request, res: Response): Promise<void> => {
        const userId = req.user?._id;

        if (!userId) throw new UnauthorizedError('Current User Id not found, relogin', { location: 'usersController.getCurrentUserData' }, ErrorCode.REQ_USERID_NOT_FOUND)

        const freshUser = await this.userService.getUserData(ensureObjectId(userId));

        const paginatedResponse = await this.recipeService.getUsersRecipes(freshUser);
        
        const userRecipes = paginatedResponse.data;
        const totalRecipes = paginatedResponse.totalDocs;

        zodValidationWrapper(FeUserSchema, freshUser, 'usersController.getCurrentUsersData');
        zodValidationWrapper(z.array(FeRecipeSchema), userRecipes, 'usersController.getCurrentUsersData');
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

        zodValidationWrapper(FeUserSchema, updatedUserResponse, 'usersController.updateUserRecipes');
        res.status(201).json({success: true, user: updatedUserResponse});
    }
}
