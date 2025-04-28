import { Filter, ObjectId } from "mongodb";
import { RecipesRepository } from "../repositories/recipes/recipesRepository";
import { UserRepository } from "../repositories/user/userRepository";
import { Recipe, RecipeDocument } from "../types/recipe";
import { PaginateResponse, StandardRecipeResponse } from "../types/responses";
import { User } from "../types/user";
import { Visibility } from "../types/enums";
import { BadRequestError, NotFoundError, ServerError } from "../errors";
import { ensureObjectId } from "../util/ensureObjectId";
import { mergeAlterations } from "../util/mergeAlterations";
import { NewRecipeSchema, FeUpdateRecipeSchema } from "../schemas/recipe.schema";
import { IsObjectIdSchema } from "../schemas/shared.schema";

/**
 * Handles all recipe related services
 * @todo Ensure all errors are handled
 * @todo Add logging
 * @todo BOW TO ZOD PARSING!
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
     * @throws {ServerError} 500 - if the create recipe fails
     * @example
     * const recipeService = useRecipeService();
     * await recipeService.saveRecipe(req, false, errorMessage);
     */  
    public async saveRecipe(recipe: Recipe, userId: ObjectId): Promise<StandardRecipeResponse> {
        let success = false;

        NewRecipeSchema.parse({recipe});
        const recipeSaveResponse = await this.recipesRepository.createRecipe(recipe);
        if (!recipeSaveResponse.acknowledged || !recipeSaveResponse.insertedId) throw new ServerError('saveRecipe - Create recipe failed', { recipe, recipeSaveResponse })
        
        const savedRecipe = await this.recipesRepository.findById(recipeSaveResponse.insertedId);
        if (savedRecipe === null) throw new ServerError('saveRecipe - Saved Recipe not found after saving', { savedRecipe, insertedId: recipeSaveResponse.insertedId });

        const userUpdateRes = await this.userRepository.addToUsersRecipesArray(userId,  recipeSaveResponse.insertedId);
        if (userUpdateRes?.modifiedCount && userUpdateRes?.modifiedCount > 0) success = true;

        return {success, recipe: savedRecipe}
    }

    /**   
     * Get Recipes with queries
     * @group Recipe Management - retrieval
     * @todo Ensure 'get' stays one step ahead? eg: get 50 first time, then 25 per.
     * @todo remove Users own recipes? or leave as little 'Oh that's mine' moments
     * @todo Generic query args?
     * @todo make 'sort' options in getRecipes
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
            "internalData.isDeleted": { $ne: true } 
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
                        internalData: 0
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
        if (!originalRecipe) throw new ServerError('updateRecipe- Cannot find original recipe', { originalRecipe, recipeId });

        let recipeResponse: RecipeDocument;
        if (userIsCreator) {
            console.log('user is Creator');
            FeUpdateRecipeSchema.parse({ recipe });
            IsObjectIdSchema.parse({ _id: recipeId });
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const {_id, ...recipeNoId} = recipe;
            const recipeSaveResponse = await this.recipesRepository.updateRecipe({ '_id': recipeId }, recipeNoId);
            if (recipeSaveResponse === null) throw new ServerError('Updating recipe failed: recipe does not exist', { recipeId, recipe});
            recipeResponse = recipeSaveResponse;
        } else {
            console.log('user is NOT Creator');

            const alterations = this.findRecipeAlterations(originalRecipe, recipe);
            const updateResponse = await this.userRepository.updateAlterationsOnUserRecipes(userId, recipeId, alterations);

            if (updateResponse == null) throw new ServerError('updateRecipe - Updating User.recipes.alterations failed', { userId, recipeId, alterations });
            if (updateResponse.matchedCount === 0 ) throw new BadRequestError('updateRecipe - No user matched userId', { userId });
            if (updateResponse.modifiedCount === 0) throw new ServerError('updateRecipe - Did not update alterations object', { userId, recipeId, alterations });

            console.log('updateResponse: ', updateResponse);

            recipeResponse = mergeAlterations(originalRecipe, alterations);
        }

        console.log('Recipe Updated', userId)
        
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
                        internalData: 0
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
     * @example
     * const recipeService = useRecipeService();
     * await recipeService.deleteRecipe(ObjectId('1234abcd'), ObjectId('9876zyxw'));
     */  
    async deleteRecipe(userId: ObjectId, recipeId: ObjectId): Promise<StandardRecipeResponse> {
        const thisRecipe = await this.recipesRepository.findById(recipeId);
        if (!thisRecipe) throw new NotFoundError('Deletion Failed: Recipe Not Found');
        const recipesOwnersId = ensureObjectId(thisRecipe.userId);
        
        let updateRecipeResponse;
        let updateUserResponse;
        if (recipesOwnersId.equals(userId)) {
            updateRecipeResponse = await this.recipesRepository.updateOne({'_id': recipeId}, { $set: { internalData: { isDeleted: true, wasDeletedAt: new Date(), deletedBy: userId}}});
            
            updateUserResponse = await this.userRepository.updateOne({ '_id': userId }, { $pull: { recipes: { id: recipeId }}});
            
        } else {
            updateUserResponse = await this.userRepository.updateOne({ '_id': userId }, { $pull: { recipes: { id: recipeId }}});
        }
        if (updateRecipeResponse && (!updateRecipeResponse.acknowledged || updateRecipeResponse.modifiedCount === 0))
            throw new ServerError('Deletion Failed: Recipe deletion failed', { recipeId });
        if (!updateUserResponse.acknowledged || updateUserResponse.modifiedCount === 0)
            throw new ServerError('Deletion Failed: Updating User Recipe array failed', { userId });

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