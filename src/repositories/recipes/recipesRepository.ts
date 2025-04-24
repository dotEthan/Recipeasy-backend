import { FeSavedRecipeArray, FeSavedRecipe, FeUpdateRecipe } from "../../schemas/recipe.schema";
import { FindByIdSchema } from "../../schemas/user.schema";
import { PaginationOptions } from "../../types/express";
import { Recipe, RecipeDocument } from "../../types/recipe";
import { CreatedDataResponse } from "../../types/responses";
import { BaseRepository } from "../base/baseRepository";
import { Filter, InsertManyResult, ObjectId } from "mongodb";

/**
 * Recipes Collection specific Mongodb Related calls
 * @todo create and implement Interface
 * @todo Try to make more generic and ensure best practices
 * @todo move Parsing to Service
 */
// 
export class RecipesRepository extends BaseRepository<RecipeDocument> {
    constructor() {
        super('recipes');
    }
    
    async createRecipes(recipes: Omit<RecipeDocument, '_id'>[]): Promise <InsertManyResult> {
        console.log('creating reciperepo')
        FeSavedRecipeArray.parse({recipes});
        const recipeResponse =  await this.createMany(recipes);
        console.log('recipes return: ', recipeResponse)
        return recipeResponse;
    }

    async createRecipe(recipe: Omit<RecipeDocument, '_id'>): Promise <CreatedDataResponse<RecipeDocument>> {
        console.log('creating reciperepo')
        FeSavedRecipe.parse({recipe});
        const recipeResponse =  await this.create(recipe);
        console.log('recipes return: ', recipeResponse)
        return recipeResponse;
    }

    async updateRecipe(filter: Filter<Recipe>, recipe: RecipeDocument): Promise <CreatedDataResponse<RecipeDocument> | null> {
        FeUpdateRecipe.parse({recipe});
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const {_id, ...recipeNoId} = recipe;
        const recipeResponse =  await this.findOneAndReplace({'_id': filter}, recipeNoId);
        console.log('recipes updated: ', recipeResponse)
        return recipeResponse;
    }

    async paginatedFindByIndex(filterBy: Filter<Recipe>, options: PaginationOptions<Recipe>) {
        //schema.parse(schema)
        return this.findPaginated(filterBy, options);
    }
    
    async findById(_id: ObjectId): Promise<RecipeDocument | null> {
        FindByIdSchema.parse({_id});
        return await this.findOne(
            {_id} as Partial<Recipe>,
            { createdAt: 0 }
        );
    };
}