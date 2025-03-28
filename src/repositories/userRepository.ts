import { UserDocument } from "../types/user";
import { BaseRepository } from "./baseRepository";


export class UserRepository extends BaseRepository<UserDocument> {

    constructor() {
        super('users');
    }

    async findByid(_id: string): Promise<UserDocument | null> {
        return this.findOne({_id} as Partial<UserDocument>);
    };

    async findByemail(email: string): Promise<UserDocument | null> {
        return this.findOne({email} as Partial<UserDocument>);
    };

    // For Admin Dashboard
    async deleteUser(id: string) {
        return this.delete({_id: id})
    }
}