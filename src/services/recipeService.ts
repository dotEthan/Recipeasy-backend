import { Filter, ObjectId } from "mongodb";
import { RecipesRepository } from "../repositories/recipes/recipesRepository";
import { UserRepository } from "../repositories/user/userRepository";
import { Recipe, RecipeDocument } from "../types/recipe";
import { PaginateResponse, StandardRecipeResponse } from "../types/responses";
import { User } from "../types/user";
import { ErrorCode, Visibility } from "../types/enums";
import { BadRequestError, NotFoundError, ServerError } from "../errors";
import { ensureObjectId } from "../util/ensureObjectId";
import { mergeAlterations } from "../util/mergeAlterations";
import { NewRecipeSchema, FeUpdateRecipeSchema, InternalStateSchema, PartialRecipeSchema } from "../schemas/recipe.schema";
import { IsObjectIdSchema } from "../schemas/shared.schema";
import { UserRecipesIdSchema } from "../schemas/user.schema";
import { zodValidationWrapper } from "../util/zodParseWrapper";

/**
 * Handles all recipe related services
 * @todo - post - Ensure all errors are handled
 * @todo - post - Add logging
 */
// 
export class RecipeService {
    private recipesRepository: RecipesRepository;
    private userRepository: UserRepository;
    constructor(recipesRepository: RecipesRepository,userRepository: UserRepository) {
        this.recipesRepository = recipesRepository;
        this.userRepository = userRepository;
    }

    /**   
     * Saves New Recipe
     * @group Recipe Management - Saving
     * @param {Recipe} recipe - Recipe to be saved
     * @param {ObjectId} userId - userId
     * @return {StandardRecipeResponse} - succes, message, recipe, error
     * @throws {ServerError} 500 - if the create recipe fails or user not found/updated
     * @example
     * const recipeService = useRecipeService();
     * await recipeService.saveRecipe(req, false, errorMessage);
     */  
    public async saveNewRecipe(recipe: Recipe, userId: ObjectId): Promise<StandardRecipeResponse> {

        zodValidationWrapper(NewRecipeSchema, { recipe }, 'recipeService.saveNewRecipe');
        const recipeSaveResponse = await this.recipesRepository.createRecipe(recipe);
        if (!recipeSaveResponse.acknowledged || !recipeSaveResponse.insertedId) throw new ServerError(
            'Create recipe failed',             
            { 
                recipe, recipeSaveResponse, 
                location: 'recipeService.saveRecipe',
                details: 'Recipe create failed'
            },
            ErrorCode.CREATE_RESOURCE_FAILED
        )
        
        const savedRecipe = await this.recipesRepository.findById(recipeSaveResponse.insertedId);
        if (savedRecipe === null) throw new ServerError(
            'Find Saved recipe by insertedId failed', 
            { 
                savedRecipe, 
                insertedId: recipeSaveResponse.insertedId, 
                location: 'recipeService.saveRecipe' 
            },
            ErrorCode.FIND_RESOURCE_FAILED
        );

        const userUpdateRes = await this.userRepository.addToUsersRecipesArray(ensureObjectId(userId),  { id: ensureObjectId(recipeSaveResponse.insertedId) });

        if (userUpdateRes?.matchedCount === 0) throw new ServerError(
            'User to update not found',
            { 
                location: 'recipeService.saveNewRecipe', 
                userId,
                details: "updating user recipes array"
             },
            ErrorCode.UPDATE_USER_FAILED
        );
        if (userUpdateRes?.modifiedCount === 0) throw new ServerError(
            'User found but array not updated',
            { 
                location: 'recipeService.saveNewRecipe',  
                userId,
                details: "updating user recipes array"
             },
            ErrorCode.UPDATE_USER_FAILED
        );
        
        return {success: true, recipe: savedRecipe}
    }

    /**   
     * Get Recipes with queries
     * @group Recipe Management - retrieval
     * @todo - post - Ensure 'get' stays one step ahead? eg: get 50 first time, then 25 per.
     * @todo - post - remove Users own recipes? or leave as little 'Oh that's mine' moments
     * @todo - post - Generic query args?
     * @todo - post - make 'sort' options in getRecipes
     * @param {Visibility} public Status - 'public'/'private'
     * @param {number} limit - recipes per page
     * @param {number} skip - Start new results after N recipes
     * @return {PaginateResponse} - succes, message, recipe, error
     * @example
     * const recipeService = useRecipeService();
     * await recipeService.getRecipes(Visibility.PUBLIC, 25, 75);
     */  
    public async getRecipes(visibility: Visibility | undefined, limit: number, skip: number): Promise<PaginateResponse> {
        const query: Filter<Recipe> = {
            "internalState.isDeleted": { $ne: true } 
        };

        if (visibility) { 
            query.visibility = visibility
        }

        const [recipes, total] = await Promise.all([
            this.recipesRepository.paginatedFindByIndex(
                query,
                {
                    skip,
                    limit,
                    projection: {
                        createdAt: 0,
                        internalState: 0
                    }
                }
            ),
            this.recipesRepository.getTotalDocuments(query)
        ]);

        return {totalDocs: total, data: recipes};
    }

    /**   
     * Update Existing Recipes
     * @group Recipe Management - Updating
     * @param {Recipe} recipe - Updated Recipe
     * @param {number} userId - User's _id
     * @return {StandardRecipeResponse} - Success status and updated Recipe
     * @example
     * const recipeService = useRecipeService();
     * await recipeService.updateRecipe(recipe, ObjectId('1234abcd'));
     */  
    public async updateRecipe(recipe: Recipe, userId: ObjectId): Promise<StandardRecipeResponse> {
        const recipeCreatorId = ensureObjectId(recipe.userId);
        const recipeId = ensureObjectId(recipe._id);
        const userIsCreator = recipeCreatorId.equals(userId);

        const originalRecipe = await this.recipesRepository.findById(recipeId);
        if (!originalRecipe) throw new ServerError(
            'updateRecipe- Cannot find original recipe', 
            { originalRecipe, recipeId },
            ErrorCode.FIND_RESOURCE_FAILED
        );

        let recipeResponse: RecipeDocument;
        if (userIsCreator) {
            zodValidationWrapper(IsObjectIdSchema, { _id: recipeId }, 'recipeService.updateRecipe');
            zodValidationWrapper(FeUpdateRecipeSchema, { recipe }, 'recipeService.updateRecipe');
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const {_id, ...recipeNoId} = recipe;
            const recipeSaveResponse = await this.recipesRepository.updateRecipe({ _id: recipeId }, recipeNoId);
            if (recipeSaveResponse === null) {
                throw new NotFoundError(
                    'Updating recipe failed: recipe does not exist', 
                    { recipeId, recipe},
                    ErrorCode.RESOURCE_NOT_FOUND
                );
            }
            recipeResponse = recipeSaveResponse;
        } else {
            const alterations = this.findRecipeAlterations(originalRecipe, recipe);
            zodValidationWrapper(PartialRecipeSchema, alterations, 'recipeService.updateRecipe');
            const updateResponse = await this.userRepository.updateAlterationsOnUserRecipes(ensureObjectId(userId), recipeId, alterations);
            console.log('updateResponse:', updateResponse)
            if (updateResponse.matchedCount === 0 ) throw new BadRequestError(
                'updateRecipe - No user matched userId', 
                { userId },
                ErrorCode.USER_NOT_FOUND
            );
            if (updateResponse.modifiedCount === 0) throw new ServerError(
                'updateRecipe - Did not update alterations object', 
                { 
                    userId, 
                    recipeId, 
                    alterations,
                    details: 'User alterations update failed',
                    location: 'recipeService.updateRecipe'
                },
                ErrorCode.UPDATE_RESOURCE_FAILED
            );

            recipeResponse = mergeAlterations(originalRecipe, alterations);
        }
        
        return {success: true, recipe: recipeResponse as Recipe}
    }

    /**   
     * Get User's personal recipes with queries
     * @group Recipe Management - retrieval
     * @param {User} user - User to get recipes for
     * @return {PaginateResponse} - userRecipes set up for pagination
     * @example
     * const recipeService = useRecipeService();
     * await recipeService.getUsersRecipes(currentUser);
     */  
    async getUsersRecipes(user: User): Promise<PaginateResponse> {
        if (!user.recipes || user.recipes.length === 0) return { data: [], totalDocs: 0 }
        const recipeIdArray = user.recipes?.map((item) => ensureObjectId(item.id));

        const query: Filter<Recipe> = { _id: { $in: recipeIdArray } };
        
        const [recipes, total] = await Promise.all([
            this.recipesRepository.paginatedFindByIndex(
                query,
                {
                    skip: 0,
                    limit: 50,
                    projection: {
                        createdAt: 0,
                        internalState: 0
                    }
                }
            ),
            this.recipesRepository.getTotalDocuments(query)
        ]);

        const userRecipesMap = new Map(
            user.recipes?.map(item => [item.id.toString(), item]) ?? []
        );
        const mergedRecipes = recipes.map(recipe => {
            const userRecipe = userRecipesMap.get(recipe._id.toString());
            return mergeAlterations(recipe, userRecipe?.alterations);
        });

        return {totalDocs: total, data: mergedRecipes};
    }

    /**   
     * Delete Recipe
     * @group Recipe Management - deletion
     * @param {ObjectId} userId - Id of user requesting Deletion
     * @param {ObjectId} recipeId - Id of recipe to delete
     * @returns {ErrorResponse} 400 - Validation Error
     * @throws {BadRequestError} 400 - If Zod schema Parsing fails
     * @throws {ServerError} 500 - if recipe deletion or user update fail
     * @example
     * const recipeService = useRecipeService();
     * await recipeService.deleteRecipe(ObjectId('1234abcd'), ObjectId('9876zyxw'));
     */  
    async deleteRecipe(userId: ObjectId, recipeId: ObjectId): Promise<StandardRecipeResponse> {
        const thisRecipe = await this.recipesRepository.findById(recipeId);
        if (!thisRecipe) throw new NotFoundError(
            'Deletion Failed: Recipe Not Found',
            { location: "recipeService.deleteRecipe" },
            ErrorCode.RESOURCE_NOT_FOUND
        );
        const recipesOwnersId = ensureObjectId(thisRecipe.userId);
        
        let updateRecipeResponse;
        if (recipesOwnersId.equals(userId)) {
            const internalState = {
                isDeleted: true,
                wasDeletedAt: new Date(),
                deletedBy: userId
            };
            zodValidationWrapper(InternalStateSchema, internalState, 'recipeService.deleteRecipe');
            updateRecipeResponse = await this.recipesRepository.updateRecipeObject({ _id: recipeId }, { internalState });   
        }
        if (
            updateRecipeResponse && 
            (!updateRecipeResponse.acknowledged || 
            updateRecipeResponse.modifiedCount === 0)
        )
            throw new ServerError(
                'Deletion Failed: Recipe deletion failed', 
                { 
                    recipeId, 
                    location: 'recipeService.deleteRecipe',  
                    details: 'Recipe Deletion Failed'
                },
                ErrorCode.DELETE_RESOURCE_FAILED
            );

        const usersRecipesId = { id: recipeId };
        zodValidationWrapper(UserRecipesIdSchema, usersRecipesId, 'recipeService.deleteRecipe');
        const updateUserResponse = await this.userRepository.removeFromUserRecipeArray(ensureObjectId(userId), usersRecipesId);
        if (
            !updateUserResponse.acknowledged || 
            updateUserResponse.modifiedCount === 0) throw new ServerError(
                'Update Failed: Updating User Recipe array failed', 
                { 
                    userId, 
                    location: 'recipeService.deleteRecipe',
                    details: 'User recipe array update failed'
                },
                ErrorCode.REQUEST_MALFORMED
            );

        return {success: true}
    }

    /**   
     * Compares and returns all changes to updateRecipe compared to originalRecipe
     * @group Recipe Management - retrieval
     * @param {Recipe} originalRecipe - original recipe
     * @param {Recipe} updatedRecipe - updated Recipe
     * @return {Partial<Recipe>} - a object filled with all altered values
     * @example
     * await this.findRecipeAlterations(oldRecipe, updateRecipe);
     */ 
    private findRecipeAlterations(originalRecipe: Recipe, updatedRecipe: Recipe): Partial<Recipe>{
        const changes: Partial<Recipe> = {};

        for (const key in updatedRecipe) {
            if (key === '_id') continue;
            
            const typedKey = key as keyof Recipe;
            const originalValue = originalRecipe[typedKey];
            const updatedValue = updatedRecipe[typedKey];
    
            if (JSON.stringify(originalValue) !== JSON.stringify(updatedValue)) {
                // @ts-expect-error - Partial<Recipe> assignment is safe after JSON comparison
                (changes as Partial<Recipe>)[typedKey] = updatedValue;
            }
        }
        return changes;
    }
}