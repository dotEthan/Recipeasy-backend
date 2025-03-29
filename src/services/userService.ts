import { Request } from "express";

import { UserRepository } from "../repositories/userRepository";
import { LoginAttemptRepository } from "../repositories/loginAttemptsRepository";

import { User } from "../types/user";
import { LoginAttempt } from "../types/loginAttempts";

export class UserService {
    private userRepository: UserRepository;
    private loginAttemptRepository: LoginAttemptRepository;

    constructor(userRepository: UserRepository, loginAttemptRepository: LoginAttemptRepository) {
        this.userRepository = userRepository;
        this.loginAttemptRepository = loginAttemptRepository;
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

    async logLoginAttempt(req: Request, success: boolean, errorMessage?: string)  {
        // TODO test req.ip is working in production
        console.log('errormsg:', errorMessage)
        const loginData: LoginAttempt = {
            userId: req.user?._id,
            ipAddress: req.ip,
            userAgent: req.headers['user-agent'],
            timestamp: new Date(),
            success,
            errorMessage: success ? undefined : errorMessage,
        };
        try {
            await this.loginAttemptRepository.create(loginData);
            return;
        } catch(error: unknown) {
            // global error handle, log but don't stop flow
            console.log(error);
        }
    }
}