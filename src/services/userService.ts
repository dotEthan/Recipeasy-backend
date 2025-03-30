import { ObjectId } from "mongodb";
import { UserRepository } from "../repositories/userRepository";

import { User } from "../types/user";

export class UserService {
    private userRepository: UserRepository;

    constructor(userRepository: UserRepository) {
        this.userRepository = userRepository;
    }

    async createUser(displayName: string, email: string, hashedPassword: string): Promise<User> {
        const hasUser = await this.userRepository.findOne({'email': email})
        if (hasUser) {
            throw new Error('Email already in use');
        }

        const userData = {
            displayName,
            email,
            password: hashedPassword,
            verified: false,
        }
        console.log('Created User: ', userData)
        return this.userRepository.create(userData);
    }

    async setUserVerified(_id: ObjectId): Promise<void> {
        try {
            console.log('setting verified userID: ', typeof _id);
            const hasUser = await this.userRepository.findByid(_id)
            console.log('setting verified user exists: ', hasUser);
            if (!hasUser) {
                throw new Error('User Not Found, try logging in again');
            }
            console.log('setting user to verified')
            await this.userRepository.updateOne({"_id": _id}, {verified: true});
        } catch(err) {
            console.log('set user as Verified Err', err);
        }
        return;
    }
}