import { Filter, ObjectId } from "mongodb";
import { RecipesRepository } from "../repositories/recipes/recipesRepository";
import { UserRepository } from "../repositories/user/userRepository";
import { Recipe, RecipeDocument } from "../types/recipe";
import { PaginateResponse, StandardRecipeResponse } from "../types/responses";
import { User } from "../types/user";
import { Visibility } from "../types/enums";
import { AppError } from "../util/appError";
import { ensureObjectId } from "../util/ensureObjectId";
import { mergeAlterations } from "../util/mergeAlterations";

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
     * @example
     * const recipeService = useRecipeService();
     * await recipeService.saveRecipe(req, false, errorMessage);
     */  
    public async saveRecipe(recipe: Recipe, userId: ObjectId): Promise<StandardRecipeResponse> {
        let success = false;

        const recipeSaveResponse = await this.recipesRepository.createRecipe(recipe)
        const userUpdateRes = await this.userRepository.addToUsersRecipesArray(userId,  recipeSaveResponse._id);
        
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { createdAt, updatedAt, ...feRecipe } = recipeSaveResponse;

        if (userUpdateRes?.modifiedCount && userUpdateRes?.modifiedCount > 0) success = true;

        console.log(`Save Successful: ${success}, recipe going back: ${feRecipe}`)
        return {success, recipe: feRecipe}
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
     * await recipeService.getRecipes(Visibility.Public, 25, 75);
     */  
    public async getRecipes(visibility: Visibility | undefined, limit: number, skip: number): Promise<PaginateResponse> {
        console.log('getPublicRecipes rec: ');
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
     * @todo add user.recipes.alteratoins once public recipe add to new user
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
        if (!originalRecipe) throw new AppError(`Can't find original recipe`, 404);

        let recipeResponse: RecipeDocument;
        if (userIsCreator) {
            console.log('user is OG Creator');
            const recipeSaveResponse = await this.recipesRepository.updateRecipe(ensureObjectId(recipe._id), recipe);
            if (recipeSaveResponse === null) throw new Error('Updating recipe failed: recipe does not exist');
            recipeResponse = recipeSaveResponse;
        } else {
            console.log('user is NOT OG Creator');
            // User.recipes.alterations - save there and overwrite when loading User Recipes

            const alterations = this.findRecipeAlterations(originalRecipe, recipe);
            // save to user.recipes.alterations
            const updateResponse = await this.userRepository.updateAlterationsOnUserRecipes(userId, recipeId, alterations);

            if (!updateResponse) throw new AppError('Updating User.recipes.alterations failed', 500);
            if (updateResponse.matchedCount === 0 || updateResponse.modifiedCount === 0) throw new AppError('Did not update alterations object', 500);

            console.log('updateResponse: ', updateResponse);

            recipeResponse = mergeAlterations(originalRecipe, alterations);
            // update Get User Recipes to add alternations
        }

        console.log('Recipe Updated', userId)
        
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { createdAt, updatedAt, ...feRecipe } = recipeResponse;

        return {success: true, recipe: feRecipe as Recipe}
    }

    /**   
     * Get User's personal recipes with queries
     * @todo Update when Alterations complete
     * @todo Pagination
     * @group Recipe Management - retrieval
     * @param {UsersRecipeData[]} usersRecipeData - User.recipes[] - All recipes user linked to
     * @return {Recipe[]} - All recipes listed in the User.recipes[]
     * @example
     * const recipeService = useRecipeService();
     * await recipeService.getUsersRecipes([ObjectId('1234abcd')]);
     */  
    async getUsersRecipes(user: User): Promise<PaginateResponse> {
        console.log('getUserRecipes: ');
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
     * @group Recipe Management - retrieval
     * @todo add user.recipes.alteratoins once public recipe add to new user
     * @param {ObjectId} userId - Id of user requesting Deletion
     * @param {ObjectId} recipeId - Id of recipe to delete
     * @example
     * const recipeService = useRecipeService();
     * await recipeService.deleteRecipe(ObjectId('1234abcd'), ObjectId('9876zyxw'));
     */  
    async deleteRecipe(userId: ObjectId, recipeId: ObjectId): Promise<StandardRecipeResponse> {
        const thisRecipe = await this.recipesRepository.findById(recipeId);
        if (!thisRecipe) throw new Error('Deletion Failed: Recipe Not Found');
        const recipesOwnersId = ensureObjectId(thisRecipe.userId);
        
        let updateRecipeResponse;
        let updateUserResponse;
        if (recipesOwnersId.equals(userId)) {
            updateRecipeResponse = await this.recipesRepository.updateOne({'_id': recipeId}, { $set: { internalData: { isDeleted: true, wasDeletedAt: new Date(), deletedBy: userId}}});
            
            updateUserResponse = await this.userRepository.updateOne({ '_id': userId }, { $pull: { recipes: { id: recipeId }}});
            
        } else {
            updateUserResponse = await this.userRepository.updateOne({ '_id': userId }, { $pull: { recipes: { id: recipeId }}});
        }
        if (updateRecipeResponse && (!updateRecipeResponse.acknowledged || updateRecipeResponse.modifiedCount === 0)) throw new Error('Deletion Failed: Recipe deletion failed');
        if (!updateUserResponse.acknowledged || updateUserResponse.modifiedCount === 0) throw new Error('Deletion Failed: Updating User Recipe array failed');

        console.log('recipe deleted');
        return {success: true}
    }

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
        console.log('changes: ', changes)
        return changes;
    }
}