import { ObjectId } from "mongodb";
import { RecipesRepository } from "../repositories/recipes/recipesRepository";
import { UserRepository } from "../repositories/user/userRepository";
import { Recipe } from "../types/recipe";
import { PaginateResponse, StandardResponse } from "../types/responses";

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

    public async getPublicRecipes(limit: number, skip: number): Promise<PaginateResponse | null> {
        console.log('getPublicRecipes rec: ');
        const response = await this.recipesRepository.paginatedFindByIndex(
            {visibility: 'public'},
            {
                sort: { 'ratings.averageRating': -1 },
                skip,
                limit
            }
        );
        
        const total = await this.recipesRepository.getTotalDocuments({ visibility: 'public' });
        return {totalDocs: total, data: response};
    }

    async getUsersRecipes(recipeIdArray: ObjectId[]) {
        const cursor = await this.recipesRepository.findByIndex({ 
          _id: { $in: recipeIdArray } 
        });
        return cursor.toArray();
      }
}