import { IsObjectIdSchema } from "../../schemas/shared.schema";
import { PaginationOptions } from "../../types/express";
import { FeRecipeOmitId, Recipe, RecipeDocument } from "../../types/recipe";
import { CreatedDataResponse } from "../../types/responses";
import { BaseRepository } from "../base/baseRepository";
import { Filter, InsertOneResult, ObjectId, WithId } from "mongodb";
import { IRecipeRepository } from "./recipeRepository.interface";

/**
 * Recipes Collection specific Mongodb Related calls
 * @todo create and implement Interface
 * @todo Try to make more generic and ensure best practices
 */
// 
export class RecipesRepository extends BaseRepository<RecipeDocument> implements IRecipeRepository<RecipeDocument> {
    constructor() {
        super('recipes');
    }
    
    async createRecipe(recipe: Omit<RecipeDocument, '_id'>): Promise <InsertOneResult<RecipeDocument>> {
        return await this.create(recipe);
    }

    async updateRecipe(filter: Filter<Recipe>, recipe: FeRecipeOmitId): Promise <CreatedDataResponse<RecipeDocument> | null> {
        return await this.findOneAndReplace(filter, recipe);
    }

    async paginatedFindByIndex(filterBy: Filter<Recipe>, options: PaginationOptions<Recipe>): Promise<WithId<RecipeDocument>[]>  {
        return await this.findPaginated(filterBy, options);
    }
    
    async findById(_id: ObjectId): Promise<RecipeDocument | null> {
        IsObjectIdSchema.parse({ _id });
        return await this.findOne(
            {_id} as Partial<Recipe>,
            { createdAt: 0 }
        );
    };
}