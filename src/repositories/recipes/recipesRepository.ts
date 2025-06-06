import { IsObjectIdSchema } from "../../schemas/shared.schema";
import { PaginationOptions } from "../../types/express";
import { FeRecipeOmitId, Recipe, RecipeDocument } from "../../types/recipe";
import { CreatedDataResponse } from "../../types/responses";
import { BaseRepository } from "../base/baseRepository";
import { Filter, InsertOneResult, ObjectId, PipelineStage, WithId } from "mongodb";
import { IRecipeRepository } from "./recipeRepository.interface";
import { zodValidationWrapper } from "../../util/zodParseWrapper";

/**
 * Recipes Collection specific Mongodb Related calls
 * @todo - post - refactor with coming calls - Generic VS Specific
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
    
    async updateRecipeObject(filter: Filter<Recipe>, updatedData: Partial<Recipe>) {
        return await this.updateOne(filter, { $set: { ...updatedData }});
    }

    async paginatedFindByIndex(filterBy: Filter<Recipe>, options: PaginationOptions<Recipe>): Promise<WithId<RecipeDocument>[]>  {
        return await this.findPaginated(filterBy, options);
    }
    
    async findById(_id: ObjectId): Promise<RecipeDocument | null> {
        zodValidationWrapper(IsObjectIdSchema, { _id }, 'recipeRepository.findById');
        return await this.findOne(
            {_id} as Partial<Recipe>,
            { createdAt: 0, internalState: 0 }
        );
    };
    
    async findWithProjection(pipeline: PipelineStage[], projection: { [key: string]: 0 | 1 | boolean }): Promise<RecipeDocument[]> {
        const projectedPipeline = [
            ...pipeline,
            { $project: projection }
        ];
        
        return this.aggregate(projectedPipeline);
    }
}