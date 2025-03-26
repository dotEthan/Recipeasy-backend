import { UserDocument } from "../types/user";
import { BaseRepository } from "./baseRepository";


export class UserRepository extends BaseRepository<UserDocument> {

    constructor() {
        super('users');
    }

    async findByUid(uid: string): Promise<UserDocument | null> {
        return this.findOne({uid} as Partial<UserDocument>)
    }
}