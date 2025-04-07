import { ObjectId } from "mongodb";
import { RecipesRepository } from "../repositories/recipes/recipesRepository";
import { UserRepository } from "../repositories/user/userRepository";
import { Recipe } from "../types/recipe";
import { PaginateResponse, StandardResponse } from "../types/responses";
import { UpdateUserByIdSchema } from "../schemas/user.schema";

export class RecipeService {
    private recipesRepository: RecipesRepository;
    private userRepository: UserRepository;
    constructor(recipesRepository: RecipesRepository,userRepository: UserRepository) {
        this.recipesRepository = recipesRepository;
        this.userRepository = userRepository;
    }
    // Build just for data migration, update for real save
    public async saveRecipes(recipes: Recipe[]): Promise<StandardResponse> {
        console.log('recipe service starting')
        recipes.forEach((recipe: Recipe) => {
            return {...recipe, userId: new ObjectId(recipe.userId)};
        });
        console.log('recipeServiceRecipes: ', recipes);
        const recipesSaveResponse = await this.recipesRepository.createRecipes(recipes);
        console.log('reicpes saved, now onto user: ', recipesSaveResponse);
        const recipeIdArray = Object.entries(recipesSaveResponse.insertedIds).map(entry => entry[1]);
        console.log('recipeidarray: ', recipeIdArray);
        //SAVING TO USER NOT WORKING
        UpdateUserByIdSchema.parse({
            user: {recipes: recipeIdArray}
        });
        const userUpdateRes = await this.userRepository.updateRecipeIdArrayByIdNoDupes(new ObjectId('67eeb97488940f7d0833071e'),  { $addToSet: { recipes: { $each: recipeIdArray } } } );
        console.log('user update success: ', userUpdateRes);
        return {success: true}
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