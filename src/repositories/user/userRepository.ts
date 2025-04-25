import { Filter, ObjectId, UpdateResult, WithId } from "mongodb";
import { UserDocument } from "../../types/user";
import { BaseRepository } from "../base/baseRepository";
import { CreatedDataResponse } from "../../types/responses";
import { 
    BeCreateUserSchema,
    FindByEmailSchema, 
    FindByIdSchema
} from "../../schemas/user.schema";
import { Recipe } from "../../types/recipe";

/**
 * Users Collection specific Mongodb Related calls
 * @todo create and implement Interface
 * @todo move Parsing to Service
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

    async findById(_id: ObjectId, addedProjection?: Partial<Record<keyof UserDocument, 0 | 1 | boolean>>): Promise<Partial<UserDocument> | null> {
        const projection = addedProjection ? addedProjection : { createdAt: 0, previousPasswords: 0 };
        FindByIdSchema.parse({_id});
        return await this.findOne(
            {_id} as Partial<UserDocument>, 
            projection
        );
    };

    async findByEmail(email: string, addedProjection?: Document): Promise<UserDocument | null> {
        const projection = addedProjection ? addedProjection : { createdAt: 0, previousPasswords: 0 };
        return await this.findOne(
            {email} as Partial<UserDocument>, 
            projection
        );
    };

    async findIdByEmail(email: string, addedProjection?: Document): Promise<ObjectId | undefined> {
        const projection = addedProjection ? addedProjection : { createdAt: 0, previousPasswords: 0 };
        FindByEmailSchema.parse({email});
        const user = await this.findOne(
            {email} as Partial<UserDocument>, 
            projection
        );
        return user?._id;
    };
    
    async updateById(_id: ObjectId, update: Partial<UserDocument>): Promise<UpdateResult | null> {
        return await this.updateOne({_id}, update);
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
                "recipes.$.copyDetails.modified": true
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
        return await this.delete({_id})
    }
}