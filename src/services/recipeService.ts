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
        const recipeIdArray = usersRecipeData.map((item) => item.id);
        const cursor = await this.recipesRepository.findByIndex({ 
          _id: { $in: recipeIdArray } 
        });
        const recipeArray = await cursor.toArray();
        const feUserRecipes = recipeArray.map(recipe => {
            
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { createdAt, updatedAt, ...feRecipe } = recipe;
            return feRecipe;
        }) 
        return feUserRecipes
      }
}