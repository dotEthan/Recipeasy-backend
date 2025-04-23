import { Filter, ObjectId, UpdateResult, WithId } from "mongodb";
import { UserDocument } from "../../types/user";
import { BaseRepository } from "../base/baseRepository";
import { CreatedDataResponse } from "../../types/responses";
import { 
    BeCreateUserSchema,
    DeleteUserByIdSchema,
    FindByEmailSchema, 
    FindByIdSchema,
    UpdateByIdSchema
} from "../../schemas/user.schema";
import { Recipe } from "../../types/recipe";

/**
 * Users Collection specific Mongodb Related calls
 * @todo BOW TO ZOD PARSING!
 * @todo create and implement Interface
 * Zod database related data parsing 
 */
// 
export class UserRepository extends BaseRepository<UserDocument> {

    constructor() {
        super('users');
    }

    async createUser(data: Omit<UserDocument, '_id'>): Promise<CreatedDataResponse<UserDocument>> {
        BeCreateUserSchema.parse(data);
        return await this.create(data);
    }

    async findById(_id: ObjectId): Promise<UserDocument | null> {
        FindByIdSchema.parse({_id});
        return await this.findOne(
            {_id} as Partial<UserDocument>, 
            { createdAt: 0, passwordResetInProgress: 0 }
        );
    };

    async findByEmail(email: string): Promise<UserDocument | null> {
        FindByEmailSchema.parse({email});
        return await this.findOne(
            {email} as Partial<UserDocument>, 
            { createdAt: 0, passwordResetInProgress: 0 }
        );
    };

    async findIdByEmail(email: string): Promise<ObjectId | undefined> {
        FindByEmailSchema.parse({email});
        const user = await this.findOne(
            {email} as Partial<UserDocument>, 
            { createdAt: 0, passwordResetInProgress: 0 }
        );
        return user?._id;
    };
    // Move schema.parse to service functions 
    async updateById(_id: ObjectId, updatedData: Partial<UserDocument>): Promise<UpdateResult | null> {
        UpdateByIdSchema.parse({updatedData});
        return await this.updateOne({_id}, { $set: updatedData});
    };

    // No Dupes
    async addToUsersRecipesArray(_id: ObjectId, recipeId: ObjectId): Promise<UpdateResult | null> {
        console.log('going in: ', recipeId)
        return await this.updateByMergeOneNoDupe({_id}, {$addToSet: {recipes: {id: recipeId} }});
    };

    // No Dupes
    async updateAlterationsOnUserRecipes(_id: ObjectId, recipeId: ObjectId, alterations: Partial<Recipe>): Promise<UpdateResult | null> {
        return await this.updateOne({
            _id,
            "recipes.id": recipeId
        }, {
            $set: {
                "recipes.$.alterations": alterations,
                "recipes.$.copyDetails.modifications": true
            }
        });
    };

    async findOneAndOverwrite(filter: Filter<UserDocument>, updatedData: Partial<UserDocument>): Promise<WithId<UserDocument> | null> {
        const insertingDocument = {
            ...updatedData,
            updatedAt: new Date()
        }
        const response = await this.findOneAndUpdate(filter, {$addToSet: insertingDocument});
        console.log(response);
        return response;
    }

    // For Admin Dashboard
    async deleteUser(_id: ObjectId) {
        DeleteUserByIdSchema.parse({_id});
        return await this.delete({_id})
    }
}