import { FeSavedRecipeArray, FeSavedRecipe, FeUpdateRecipe } from "../../schemas/recipe.schema";
import { FindByIdSchema } from "../../schemas/user.schema";
import { PaginationOptions } from "../../types/express";
import { Recipe, RecipeDocument } from "../../types/recipe";
import { CreatedDataResponse } from "../../types/responses";
import { AppError } from "../../util/appError";
import { BaseRepository } from "../base/baseRepository";
import { Filter, InsertManyResult, ObjectId } from "mongodb";

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

    async paginatedFindByIndex(filterBy: Filter<Recipe>, options: PaginationOptions) {
        console.log('data: ', filterBy)
        const cursor = await this.findByIndex(filterBy);
        if (!cursor || (Array.isArray(cursor) && cursor.length === 0)) {
            throw new AppError('Resource not found', 404);
        }
        const sort = typeof options.sort === 'object' && 'field' in options.sort
        ? { [options.sort.field]: options.sort.direction }
        : options.sort;
        if (!sort) throw new AppError('Sorting Requires Options', 400);
        const response = cursor?.sort(sort).toArray();
        return response;
    }
    
    async findById(_id: ObjectId): Promise<RecipeDocument | null> {
        FindByIdSchema.parse({_id});
        return await this.findOne({_id} as Partial<Recipe>);
    };
}