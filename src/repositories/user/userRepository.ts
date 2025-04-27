import { InsertOneResult, ObjectId, UpdateResult } from "mongodb";

import { BaseRepository } from "../base/baseRepository";

import { IsEmailSchema, IsObjectIdSchema } from "../../schemas/shared.schema";
import { UserDocument } from "../../types/user";
import { Recipe } from "../../types/recipe";

/**
 * Users Collection specific Mongodb Related calls
 * @todo create and implement Interface
 */
// 
export class UserRepository extends BaseRepository<UserDocument> {

    constructor() {
        super('users');
    }

    async createUser(data: Omit<UserDocument, '_id'>): Promise<InsertOneResult<UserDocument>> {
        return await this.create(data);
    }

    async findById<T extends Partial<UserDocument> = UserDocument>(_id: ObjectId, addedProjection?: Partial<Record<keyof UserDocument, 0 | 1 | boolean>>): Promise<T | null> {
        IsObjectIdSchema.parse({_id});
        const defaultProjection = { createdAt: 0, previousPasswords: 0 };
        const projection = addedProjection ?? defaultProjection;
        const findResult = await this.findOne(
            {_id}, 
            projection
        );
        return findResult ? findResult as T : null;
    };

    async findPartialById(_id: ObjectId, addedProjection?: Partial<Record<keyof UserDocument, 0 | 1 | boolean>>): Promise<Partial<UserDocument> | null> {
        IsObjectIdSchema.parse({_id});
        const defaultProjection = { createdAt: 0, previousPasswords: 0 };
        const projection = addedProjection ?? defaultProjection;
        return await this.findOne(
            {_id}, 
            projection
        );
    };

    async findByEmail(email: string, addedProjection?: Document): Promise<UserDocument | null> {
        IsEmailSchema.parse({email});
        const defaultProjection = { createdAt: 0, previousPasswords: 0 };
        const projection = addedProjection ?? defaultProjection;
        return await this.findOne(
            {email} as Partial<UserDocument>, 
            projection
        );
    };

    async findIdByEmail(email: string, addedProjection?: Document): Promise<ObjectId | undefined> {
        IsEmailSchema.parse({email});
        const defaultProjection = { createdAt: 0, previousPasswords: 0 };
        const projection = addedProjection ?? defaultProjection;
        const user = await this.findOne(
            {email} as Partial<UserDocument>, 
            projection
        );
        return user?._id;
    };
    
    async updateById(_id: ObjectId, update: Partial<UserDocument>): Promise<UpdateResult | null> {
        IsObjectIdSchema.parse({_id});
        return await this.updateOne({_id}, update);
    };

    // No Dupes
    async addToUsersRecipesArray(_id: ObjectId, recipeId: ObjectId): Promise<UpdateResult | null> {
        IsObjectIdSchema.parse({_id});
        return await this.updateByMergeOneNoDupe({_id}, {$addToSet: {recipes: {id: recipeId} }});
    };

    // No Dupes
    async updateAlterationsOnUserRecipes(_id: ObjectId, recipeId: ObjectId, alterations: Partial<Recipe>): Promise<UpdateResult | null> {
        IsObjectIdSchema.parse({_id});
        IsObjectIdSchema.parse({recipeId});
        return await this.updateOne({
            _id,
            "recipes.id": recipeId
        }, {
            $set: {
                "recipes.$.alterations": alterations,
                "recipes.$.copyDetails.modified": true
            }
        });
    };

    // For Admin Dashboard
    async deleteUser(_id: ObjectId) {
        IsObjectIdSchema.parse({_id});
        return await this.delete({_id})
    }
}