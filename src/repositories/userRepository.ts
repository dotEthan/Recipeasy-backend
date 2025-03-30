import { ObjectId, UpdateResult } from "mongodb";
import { UserDocument } from "../types/user";
import { BaseRepository } from "./baseRepository";


export class UserRepository extends BaseRepository<UserDocument> {

    constructor() {
        super('users');
    }

    async findByid(_id: ObjectId): Promise<UserDocument | null> {
        return this.findOne({_id} as Partial<UserDocument>);
    };

    async findByemail(email: string): Promise<UserDocument | null> {
        return this.findOne({email} as Partial<UserDocument>);
    };

    async updateById(_id: ObjectId, updatedData: Partial<UserDocument>): Promise<UpdateResult | null> {
        return this.updateOne({_id}, updatedData);
    };

    // For Admin Dashboard
    async deleteUser(_id: ObjectId) {
        return this.delete({_id})
    }
}