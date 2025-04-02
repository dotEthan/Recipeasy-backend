import { ObjectId, UpdateResult } from "mongodb";
import { UserDocument } from "../types/user";
import { BaseRepository } from "./baseRepository";


export class UserRepository extends BaseRepository<UserDocument> {

    constructor() {
        super('users');
    }

    async findByid(_id: ObjectId): Promise<UserDocument | null> {
        return await this.findOne({_id} as Partial<UserDocument>);
    };

    async findByemail(email: string): Promise<UserDocument | null> {
        return await this.findOne({email} as Partial<UserDocument>);
    };

    async findIdByemail(email: string): Promise<ObjectId | undefined> {
        const user = await this.findOne({email} as Partial<UserDocument>);
        return user?._id;
    };

    async updateById(_id: ObjectId, updatedData: Partial<UserDocument>): Promise<UpdateResult | null> {
        return await this.updateOne({_id}, updatedData);
    };

    // For Admin Dashboard
    async deleteUser(_id: ObjectId) {
        return await this.delete({_id})
    }
}