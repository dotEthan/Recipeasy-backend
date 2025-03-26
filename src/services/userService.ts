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
}