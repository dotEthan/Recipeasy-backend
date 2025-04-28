import { 
    DeleteResult, 
    InsertOneResult, 
    ObjectId, 
    UpdateResult
} from 'mongodb';
import { UserDocument } from '../../types/user';
import { Recipe } from '../../types/recipe';

export interface IUserRepository<T> {
    createUser(data: Omit<UserDocument, '_id'>): Promise<InsertOneResult<UserDocument>>;
    findById(_id: ObjectId, addedProjection?: Partial<Record<keyof UserDocument, 0 | 1 | boolean>>): Promise<T | null>;
    findPartialById(_id: ObjectId, addedProjection?: Partial<Record<keyof UserDocument, 0 | 1 | boolean>>): Promise<Partial<UserDocument> | null>;
    findByEmail(email: string, addedProjection?: Document): Promise<UserDocument | null>;
    findIdByEmail(email: string, addedProjection?: Document): Promise<ObjectId | undefined>;
    updateById(_id: ObjectId, update: Partial<UserDocument>): Promise<UpdateResult | null>;
    addToUsersRecipesArray(_id: ObjectId, recipeId: ObjectId): Promise<UpdateResult | null>;
    updateAlterationsOnUserRecipes(_id: ObjectId, recipeId: ObjectId, alterations: Partial<Recipe>): Promise<UpdateResult | null>;
    deleteUser(_id: ObjectId): Promise<DeleteResult>;
}