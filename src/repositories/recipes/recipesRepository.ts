import { FeSavedRecipeArray } from "../../schemas/recipe.schema";
import { PaginationOptions } from "../../types/express";
import { Recipe, RecipeDocument } from "../../types/recipe";
import { BaseRepository } from "../base/baseRepository";
import { Filter, InsertManyResult } from "mongodb";

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

    async paginatedFindByIndex(filterBy: Filter<Recipe>, options: PaginationOptions) {
        console.log('data: ', filterBy)
        const cursor = await this.findByIndex(filterBy);
        if (!cursor) throw new Error('Query Failed');
        const sort = typeof options.sort === 'object' && 'field' in options.sort
        ? { [options.sort.field]: options.sort.direction }
        : options.sort;
        if (!sort) throw new Error('Sorting Requires Options');
        const response = cursor?.sort(sort).toArray();
        return response;
    }
}