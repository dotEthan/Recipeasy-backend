import {  
    Filter, 
    InsertOneResult, 
    ObjectId, 
    WithId
} from 'mongodb';
import { Recipe } from '../../types/recipe';
import { PaginationOptions } from '../../types/express';
import { CreatedDataResponse } from '../../types/responses';

export interface IRecipeRepository<RecipeDocument> {
    createRecipe(recipe: Omit<RecipeDocument, '_id'>): Promise <InsertOneResult<RecipeDocument>>;
    updateRecipe(filter: Filter<Recipe>, recipe: RecipeDocument): Promise <CreatedDataResponse<RecipeDocument> | null>;
    paginatedFindByIndex(filterBy: Filter<Recipe>, options: PaginationOptions<Recipe>): Promise<WithId<RecipeDocument>[]>;
    findById(_id: ObjectId): Promise<RecipeDocument | null>
}