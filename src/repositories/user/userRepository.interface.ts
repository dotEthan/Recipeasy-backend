import { 
    DeleteResult, 
    InsertOneResult, 
    ObjectId, 
    UpdateResult
} from 'mongodb';
import { MongoDbUserProjection, UserDocument, UsersRecipeData } from '../../types/user';
import { Recipe } from '../../types/recipe';

export interface IUserRepository<T> {
    createUser(data: Omit<UserDocument, '_id'>): Promise<InsertOneResult<UserDocument>>;
    findById(_id: ObjectId, addedProjection?: MongoDbUserProjection): Promise<T | null>;
    findPartialById(_id: ObjectId, addedProjection?: MongoDbUserProjection): Promise<Partial<UserDocument> | null>;
    findByEmail(email: string, addedProjection?: MongoDbUserProjection): Promise<UserDocument | null>;
    findByEmailWithInternalState(email: string): Promise<UserDocument | null>;
    findIdByEmail(email: string, addedProjection?: MongoDbUserProjection): Promise<ObjectId | undefined>;
    updateById(_id: ObjectId, update: Partial<UserDocument>): Promise<UpdateResult | null>;
    addToUsersRecipesArray(_id: ObjectId, usersRecipesObject: UsersRecipeData): Promise<UpdateResult | null>;
    updateAlterationsOnUserRecipes(_id: ObjectId, recipeId: ObjectId, alterations: Partial<Recipe>): Promise<UpdateResult | null>;
    deleteUser(_id: ObjectId): Promise<DeleteResult>;
}