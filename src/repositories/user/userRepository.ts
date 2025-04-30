import { DeleteResult, InsertOneResult, ObjectId, UpdateResult } from "mongodb";

import { BaseRepository } from "../base/baseRepository";

import { IsEmailSchema, IsObjectIdSchema } from "../../schemas/shared.schema";
import { MongoDbUserProjection, PreviousPasssword, UserDocument, UsersRecipeData } from "../../types/user";
import { Recipe } from "../../types/recipe";
import { IUserRepository } from "./userRepository.interface";

/**
 * 'users' Collection specific Mongodb Related calls
 * @todo - post - replace id/email with filter: Filter
 */
// 
export class UserRepository extends BaseRepository<UserDocument> implements IUserRepository<UserDocument> {

    constructor() {
        super('users');
    }

    async createUser(data: Omit<UserDocument, '_id'>): Promise<InsertOneResult<UserDocument>> {
        return await this.create(data);
    }

    async findById<T extends Partial<UserDocument> = UserDocument>(_id: ObjectId, addedProjection?: MongoDbUserProjection): Promise<T | null> {
        IsObjectIdSchema.parse({_id});
        const defaultProjection = { createdAt: 0, previousPasswords: 0, password: 0 };
        const projection = addedProjection ?? defaultProjection;
        const findResult = await this.findOne(
            {_id}, 
            projection
        );
        return findResult ? findResult as T : null;
    };

    async findPartialById(_id: ObjectId, addedProjection?: MongoDbUserProjection): Promise<Partial<UserDocument> | null> {
        IsObjectIdSchema.parse({_id});
        const defaultProjection = { createdAt: 0, previousPasswords: 0, password: 0 };
        const projection = addedProjection ?? defaultProjection;
        return await this.findOne(
            {_id}, 
            projection
        );
    };

    async findByEmail(email: string, addedProjection?: MongoDbUserProjection): Promise<UserDocument | null> {
        IsEmailSchema.parse({email});
        const defaultProjection = { createdAt: 0, previousPasswords: 0, password: 0 };
        const projection = addedProjection ?? defaultProjection;
        return await this.findOne(
            {email} as Partial<UserDocument>, 
            projection
        );
    };

    async findByEmailWithInternals(email: string): Promise<UserDocument | null> {
        IsEmailSchema.parse({email});
        return await this.findOne(
            {email} as Partial<UserDocument>
        );
    };

    async findIdByEmail(email: string, addedProjection?: MongoDbUserProjection): Promise<ObjectId | undefined> {
        IsEmailSchema.parse({email});
        const defaultProjection = { createdAt: 0, previousPasswords: 0, password: 0 };
        const projection = addedProjection ?? defaultProjection;
        const user = await this.findOne(
            {email} as Partial<UserDocument>, 
            projection
        );
        return user?._id;
    };
    
    async updateById(_id: ObjectId, update: Partial<UserDocument>): Promise<UpdateResult | null> {
        IsObjectIdSchema.parse({ _id });
        return await this.updateOne({ _id }, update);
    };
    
    async updateCachedPasswords(_id: ObjectId, cachedPasswordArray: PreviousPasssword[]) {
        IsObjectIdSchema.parse({_id});
        return await this.updateOne(
            { _id },
            { $set: {
                previousPasswords: cachedPasswordArray,
                updatedAt: new Date()
            } }
        );
    }

    // No Dupes
    // TODO - post - combine these three? updateUserObject
    async addToUsersRecipesArray(_id: ObjectId, usersRecipesObject: UsersRecipeData): Promise<UpdateResult | null> {
        IsObjectIdSchema.parse({ _id });
        return await this.updateByMergeOneNoDupe(
            {_id}, 
            {
                $addToSet: { recipes: usersRecipesObject },
                $set: { updatedAt: new Date() }
            }
        );
    };
    
    // No Dupes
    async updateAlterationsOnUserRecipes(_id: ObjectId, recipeId: ObjectId, alterations: Partial<Recipe>): Promise<UpdateResult | null> {
        IsObjectIdSchema.parse({ _id });
        IsObjectIdSchema.parse({ _id: recipeId });
        return await this.updateOne({
            _id,
            "recipes.id": recipeId
        }, {
            $set: {
                "recipes.$.alterations": alterations,
                "recipes.$.copyDetails.modified": true,
                "updatedAt": new Date()
            }
        });
    };

    
    async removeFromUserRecipeArray(_id: ObjectId, dataToRemove: UsersRecipeData) {
        IsObjectIdSchema.parse({ _id });
        return await this.updateOne({ _id }, {
            $pull: { recipes: dataToRemove },
            $set: { updatedAt: new Date() }
        });
    }

    // For Admin Dashboard
    async deleteUser(_id: ObjectId): Promise<DeleteResult> {
        IsObjectIdSchema.parse({_id});
        return await this.delete({_id})
    }
}