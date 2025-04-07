import { ObjectId, UpdateFilter, UpdateResult } from "mongodb";
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
        return await this.findOne({_id} as Partial<UserDocument>);
    };

    async findByEmail(email: string): Promise<UserDocument | null> {
        FindByEmailSchema.parse({email});
        return await this.findOne({email} as Partial<UserDocument>);
    };

    async findIdByEmail(email: string): Promise<ObjectId | undefined> {
        FindByEmailSchema.parse({email});
        const user = await this.findOne({email} as Partial<UserDocument>);
        return user?._id;
    };
    // Move schema.parse to service functions 
    async updateById(_id: ObjectId, updatedData: Partial<UserDocument>): Promise<UpdateResult | null> {
        UpdateByIdSchema.parse({_id, updatedData});
        return await this.updateOne({_id}, updatedData);
    };
    // No Dupes
    async updateRecipeIdArrayByIdNoDupes(_id: ObjectId, updatedData: UpdateFilter<UserDocument>): Promise<UpdateResult | null> {
        console.log('going in: ', updatedData)
        return await this.updateOneByMergeNoDupe({_id}, updatedData);
    };

    // For Admin Dashboard
    async deleteUser(_id: ObjectId) {
        DeleteUserByIdSchema.parse({_id});
        return await this.delete({_id})
    }
}