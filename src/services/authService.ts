import { Request } from "express";
import { ObjectId, WithId } from "mongodb";
import bcrypt from 'bcryptjs';

import { AuthLoginAttemptRepository } from "../repositories/auth/authRepository";
import { EmailVerificationService } from "./emailVerificationService";
import { RecipeService } from "./recipeService";
import { UserService } from "./userService";
import { SaveLoginAttemptDataSchema } from "../schemas/admin.schema";
import { FeUser, UserDocument } from "../types/user";
import { LoginResponse, PaginateResponse } from "../types/responses";
import {LoginAttempt } from "../types/auth";
import { RecipeDocument } from "../types/recipe";
import { ConflictError, LogOnlyError } from "../errors";
import { ErrorCode } from "../types/enums";
import { zodValidationWrapper } from "../util/zodParseWrapper";

/**
 * Handles all Authorization related services
 * @todo - post - Ensure all errors are handled
 */
// 

export class AuthService {

    constructor(
        private authLoginAttemptRepository: AuthLoginAttemptRepository,
        private userService: UserService,
        private recipeService: RecipeService,
        private emailVerificationService: EmailVerificationService
    ) {}

    /**
     * Register new user
     * @group Authorization - User registration
     * @param {string} displayName - User displayName
     * @param {string} email - User email
     * @param {string} password - User password
     * @throws {ConflictError} 409 - if email is already in use
     * @example
     * const authService = useAuthService();
     * await authService.registerNewUser('Frank', 'frank@frank.com', 'password');
     */  
    public async registerNewUser(displayName: string, email: string, password: string): Promise<UserDocument> {
        const hashedPassword = await bcrypt.hash(password, 12);
        const emailInUse = await this.userService.findUserByEmail(email);
        if(emailInUse != null) throw new ConflictError(
            'Email already in use', 
            { email, location: 'authService.registerNewUser' },
            ErrorCode.EMAIL_IN_USE
        );

        const userResponse = await this.userService.createNewUser(displayName, email, hashedPassword);
        return userResponse;
    }

    /**
     * User login
     * @todo - post - No errors thrown? Intentional?
     * @group Authorization - User login
     * @param {User} user - User logging in
     * @returns {LoginResponse} user: User, newEmailVerifyCodeCreated: boolean, recipeResponse: recipe
     * @example
     * const authService = useAuthService();
     * await authService.registerNewUser('Frank', 'frank@frank.com', 'password');
     */  
    public async userLogin(user: FeUser): Promise<LoginResponse> {
        let newEmailVerifyCodeCreated = false;
        if (!user.verified) {
            const codeExists = await this.emailVerificationService.getVerificationCode(user.email);
            if (codeExists === null) {
                await this.emailVerificationService.setAndSendVerificationCode(
                    user.email, 
                    user.displayName, 
                    user._id
                );
                newEmailVerifyCodeCreated = true;
            }
        }

        let recipeResponse = [] as WithId<RecipeDocument>[];
        let totalRecipes = 0;
        if (user.recipes) {
            const paginatedResponse: PaginateResponse = await this.recipeService.getUsersRecipes(user);
            recipeResponse = paginatedResponse.data;
            totalRecipes = paginatedResponse.totalDocs;
        }
        const responseData = {
            user,
            newEmailVerifyCodeCreated,
            recipeResponse,
            totalRecipes: totalRecipes
        } as LoginResponse;
        
        return responseData;
    }

    /**
     * Logs all login attempts
     * @group Logging - Auth logs
     * @todo - post - test req.ip is working in production
     * @param {Request} req - Request object
     * @param {boolean} success - successful
     * @param {string} errorMessage - Error message
     * @throws {LogOnlyError} 888 - Non-breaking error, logging only
     * @example
     * const authService = useAuthService();
     * await authService.logLoginAttempt(req, false, errorMessage);
     */  
    public async logLoginAttempt(req: Request, userId: ObjectId, success: boolean, errorMessage?: string)  {
        const loginData: LoginAttempt = {
            userId: userId,
            ipAddress: req.ip,
            userAgent: req.headers['user-agent'],
            timestamp: new Date(),
            success,
            errorMessage: success ? '' : errorMessage,
        };
        zodValidationWrapper(SaveLoginAttemptDataSchema, loginData, 'authService.logLoginAttempt');
        const loginAttemptDoc = await this.authLoginAttemptRepository.create(loginData);
        if (!loginAttemptDoc) throw new LogOnlyError(
            'Logging login attempts failed, log and move on',
        { location: "authService.logLoginAttempt"},
        ErrorCode.LOGGING_FAILED
    );
    }

}