import { DeleteResult, InsertOneResult, ObjectId, UpdateResult } from "mongodb";

import { BaseRepository } from "../base/baseRepository";

import { IsEmailSchema, IsObjectIdSchema } from "../../schemas/shared.schema";
import { MongoDbUserProjection, PreviousPasssword, UserDocument, UsersRecipeData } from "../../types/user";
import { Recipe } from "../../types/recipe";
import { IUserRepository } from "./userRepository.interface";
import { zodValidationWrapper } from "../../util/zodParseWrapper";

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
        zodValidationWrapper(IsObjectIdSchema, { _id }, 'userRepository.findById')
        const defaultProjection = { createdAt: 0, previousPasswords: 0, password: 0 };
        const projection = addedProjection ?? defaultProjection;
        const findResult = await this.findOne(
            {_id}, 
            projection
        );
        return findResult ? findResult as T : null;
    };

    async findPartialById(_id: ObjectId, addedProjection?: MongoDbUserProjection): Promise<Partial<UserDocument> | null> {
        zodValidationWrapper(IsObjectIdSchema, { _id }, 'userRepository.findPartialById');
        const defaultProjection = { createdAt: 0, previousPasswords: 0, password: 0 };
        const projection = addedProjection ?? defaultProjection;
        return await this.findOne(
            {_id}, 
            projection
        );
    };

    async findByEmail(email: string, addedProjection?: MongoDbUserProjection): Promise<UserDocument | null> {
        zodValidationWrapper(IsEmailSchema, { email }, 'userRepository.findByEmail');
        const defaultProjection = { createdAt: 0, previousPasswords: 0, password: 0 };
        const projection = addedProjection ?? defaultProjection;
        return await this.findOne(
            {email} as Partial<UserDocument>, 
            projection
        );
    };

    async findByEmailWithInternalData(email: string): Promise<UserDocument | null> {
        zodValidationWrapper(IsEmailSchema, { email }, 'userRepository.findByEmailWithInternalData');
        return await this.findOne(
            {email} as Partial<UserDocument>
        );
    };

    async findIdByEmail(email: string, addedProjection?: MongoDbUserProjection): Promise<ObjectId | undefined> {
        zodValidationWrapper(IsEmailSchema, { email }, 'userRepository.findIdByEmail');
        const defaultProjection = { createdAt: 0, previousPasswords: 0, password: 0 };
        const projection = addedProjection ?? defaultProjection;
        const user = await this.findOne(
            {email} as Partial<UserDocument>, 
            projection
        );
        return user?._id;
    };
    
    async updateById(_id: ObjectId, update: Partial<UserDocument>): Promise<UpdateResult | null> {
        zodValidationWrapper(IsObjectIdSchema, { _id }, 'userRepository.updateById');
        return await this.updateOne({ _id }, update);
    };
    
    async updateCachedPasswords(_id: ObjectId, cachedPasswordArray: PreviousPasssword[]) {
        zodValidationWrapper(IsObjectIdSchema, { _id }, 'userRepository.deleteUser');
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
        zodValidationWrapper(IsObjectIdSchema, { _id }, 'userRepository.addToUsersRecipesArray');
        return await this.updateByMergeOneNoDupe(
            {_id}, 
            {
                $addToSet: { recipes: usersRecipesObject },
                $set: { updatedAt: new Date() }
            }
        );
    };
    
    // No Dupes
    async updateAlterationsOnUserRecipes(_id: ObjectId, recipeId: ObjectId, alterations: Partial<Recipe>): Promise<UpdateResult> {
        zodValidationWrapper(IsObjectIdSchema, { _id }, 'userRepository.updateAlterationsOnUserRecipes');
        zodValidationWrapper(IsObjectIdSchema, { _id: recipeId }, 'userRepository.updateAlterationsOnUserRecipes');
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
        zodValidationWrapper(IsObjectIdSchema, { _id }, 'userRepository.removeFromUserRecipeArray');
        return await this.updateOne({ _id }, {
            $pull: { recipes: dataToRemove },
            $set: { updatedAt: new Date() }
        });
    }

    // For Admin Dashboard
    async deleteUser(_id: ObjectId): Promise<DeleteResult> {
        zodValidationWrapper(IsObjectIdSchema, { _id }, 'userRepository.deleteUser');
        return await this.delete({_id})
    }
}