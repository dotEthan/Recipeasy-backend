import { ObjectId } from "mongodb";
import { RecipesRepository } from "../repositories/recipes/recipesRepository";
import { UserRepository } from "../repositories/user/userRepository";
import { Recipe } from "../types/recipe";
import { PaginateResponse, StandardResponse } from "../types/responses";
import { UsersRecipeData } from "../types/user";

export class RecipeService {
    private recipesRepository: RecipesRepository;
    private userRepository: UserRepository;
    constructor(recipesRepository: RecipesRepository,userRepository: UserRepository) {
        this.recipesRepository = recipesRepository;
        this.userRepository = userRepository;
    }

    public async saveRecipe(recipe: Recipe, userId: ObjectId): Promise<StandardResponse> {
        let success = false;

        const recipeSaveResponse = await this.recipesRepository.createRecipe(recipe)
        const userUpdateRes = await this.userRepository.updateRecipeIdArrayByIdNoDupes(userId,  recipeSaveResponse._id);
        
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { createdAt, updatedAt, ...feRecipe } = recipeSaveResponse;

        if (userUpdateRes?.modifiedCount && userUpdateRes?.modifiedCount > 0) success = true;

        console.log(`Save Successful: ${success}, recipe going back: ${feRecipe}`)
        return {success, data: feRecipe}
    }

    public async updateRecipe(recipe: Recipe, userId: ObjectId): Promise<StandardResponse> {
        console.log('recipe service, updating')
        const recipeSaveResponse = await this.recipesRepository.updateRecipe(new ObjectId(recipe._id), recipe);
        if (recipeSaveResponse === null) throw new Error('Updating recipe failed: recipe does not exist')
            console.log('recipe service, updating2  ')

        // TODO add user.recipes.alteratoins once public recipe add to new user
        console.log('updated, now update user:', userId)
        // const userUpdateRes = await this.userRepository.updateRecipeIdArrayByIdNoDupes(userId,  recipeSaveResponse._id);
        
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { createdAt, updatedAt, ...feRecipe } = recipeSaveResponse;

        return {success: true, data: feRecipe}
    }

    public async getPublicRecipes(limit: number, skip: number): Promise<PaginateResponse | null> {
        console.log('getPublicRecipes rec: ');
        // todo stay one step ahead, get 50 first time, then 25 per.
        // remove "Users"? or leave as little 'Oh that's mine' moments
        const response = await this.recipesRepository.paginatedFindByIndex(
            {visibility: 'public'},
            {
                sort: { 'ratings.averageRating': -1 },
                skip,
                limit
            }
        );
        
        const total = await this.recipesRepository.getTotalDocuments({ visibility: 'public' });
        const feRecipes = response.map(recipe => {
            
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { createdAt, updatedAt, ...feRecipe } = recipe;
            return feRecipe
        }) 
        return {totalDocs: total, data: feRecipes};
    }

    async getUsersRecipes(usersRecipeData: UsersRecipeData[]): Promise<Recipe[]> {
        const recipeIdArray = usersRecipeData.map((item) => new ObjectId(item.id));
        const cursor = await this.recipesRepository.findByIndex({ 
          _id: { $in: recipeIdArray } 
        });
        const recipeArray = await cursor.toArray();
        const feUserRecipes = recipeArray.map(recipe => {
            
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { createdAt, updatedAt, ...feRecipe } = recipe;
            return feRecipe;
        }) 
        console.log('FeUserRecipes Array: ', feUserRecipes)
        return feUserRecipes
    }

    async deleteRecipe(userId: ObjectId, recipeId: ObjectId): Promise<StandardResponse> {
        // find out if user's copy is really theirs
        const thisRecipe = await this.recipesRepository.findById(recipeId);
        if (!thisRecipe) throw new Error('No Recipe found to delete');
        const recipesOwnersId = new ObjectId(thisRecipe.userId);
        let updateRecipeResponse;
        let updateUserResponse;
        if (recipesOwnersId.equals(userId)) {
            console.log('is this users recipe');
            updateRecipeResponse = await this.recipesRepository.updateOne({'_id': recipeId}, { $set: { internalData: { isDeleted: true, wasDeletedAt: new Date(), deletedBy: userId}}});
            
            updateUserResponse = await this.userRepository.updateOne({ '_id': userId }, { $pull: { recipes: { id: recipeId }}});
            
        } else {
            console.log('is NOT this users recipe');
            console.log('is NOT this users recipe', recipeId);
            updateUserResponse = await this.userRepository.updateOne({ '_id': userId }, { $pull: { recipes: { id: recipeId }}});
        }
        if (updateRecipeResponse && (!updateRecipeResponse.acknowledged || updateRecipeResponse.modifiedCount === 0)) throw new Error('Deletion Failed');
        if (!updateUserResponse.acknowledged || updateUserResponse.modifiedCount === 0) throw new Error('UPdating User Recipe array failed');
        return {success: true}
    }
}