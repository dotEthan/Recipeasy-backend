import { ObjectId, WithId } from "mongodb";

import { UserRepository } from "../repositories/user/userRepository";
import { createNewUserUtility } from "../util/createNewuser";

import { BeCreateUserSchema, BeUpdateUsersRecipesSchema, UpdateByIdSchema } from "../schemas/user.schema";
import { User, UserDocument, UsersRecipeData } from "../types/user";
import { CreatedDataResponse, StandardResponse } from "../types/responses";
import { NotFoundError, ServerError } from "../errors";
import { EmailVerificationService } from "./emailVerificationService";
import { IsEmailSchema, IsObjectIdSchema } from "../schemas/shared.schema";
import { ensureObjectId } from "../util/ensureObjectId";
import { ErrorCode } from "../types/enums";

/**
 * Handles all user related services
 * @todo - post - previousPasswords hash TLL = 1yr for hash
 * @todo - post - Ensure all errors are handled
 * @todo - post - Add logging
 */
// 
export class UserService {

    constructor(
        private userRepository: UserRepository,
        private emailVerificationService: EmailVerificationService
    ) {}

    public async createNewUser(displayName: string, email: string, hashedPassword: string): Promise<CreatedDataResponse<UserDocument>> {
        const newUserData = createNewUserUtility(displayName, email, hashedPassword);
        
        BeCreateUserSchema.parse(newUserData);
        const creationResult = await this.userRepository.createUser(newUserData);
        if (!creationResult.acknowledged || !creationResult.insertedId) throw new ServerError(
            'Create new user failed', 
            { newUserData, location: 'userService.createNewUser' },
            ErrorCode.MONGODB_RESOURCE_CREATE_FAILED
        )

        const userId = ensureObjectId(creationResult.insertedId);
        const user = await this.userRepository.findById(userId);
        if (!user) throw new NotFoundError(
            `Newly created user not found`, 
            { createdUserId: userId, location: 'userService.createNewUser' },
            ErrorCode.NO_USER_WITH_ID
        );

        const verificationSetAndSent = await this.emailVerificationService.setAndSendVerificationCode(email, displayName, user._id );
        if (!verificationSetAndSent.success) throw new ServerError(
            `Verificatin Code not set or sent`, 
            { location: 'userService.createNewUser' },
            ErrorCode.OPERATION_FAILED
        );

        return user;
    }

    public async getUserData(_id: ObjectId): Promise<UserDocument> {
        const userResponse = await this.userRepository.findById(_id);
        if(!userResponse) throw new NotFoundError(
            `User Not Found relogin`, 
            { userId: _id, location: 'userService.getUserData' },
            ErrorCode.NO_USER_WITH_ID
        );
        return userResponse as UserDocument;
    }

    public async setUserVerified(_id: ObjectId): Promise<StandardResponse> {
        const hasUser = await this.userRepository.findById(_id);
        if (!hasUser) throw new NotFoundError(
            `User Not Found, relogin`, 
            { _id, location: 'userService.setUserVerified' },
            ErrorCode.NO_USER_WITH_ID
        );
        const updatedData = { verified: true, updatedAt: new Date() } as Partial<User>;
        UpdateByIdSchema.parse({updatedData});
        const updateResult = await this.userRepository.updateById(_id, { $set: updatedData});
        if(!updateResult?.acknowledged || updateResult?.modifiedCount === 0) throw new ServerError(
            'update not successful', 
            { _id, updatedData, location: 'userService.setUserVerified' },
            ErrorCode.MONGODB_RESOURCE_UPDATE_FAILED
        );
        return {success: (updateResult.modifiedCount > 0)};
    }

    /**
     * Adds recipeID to user.recipes array when user adds a public recipe to their personal list. 
     * @group User Data - updating data
     * @param {ObjectId} userId - user's id
     * @param {ObjectId} originalUserId - User's id that created the recipe
     * @param {ObjectId} recipeId - added recipe's id
     * @return {WithId<UserDocument> | null>} - if User update successful, the user document
     * @example
     * const userService = useUserService();
     * await userService.findUserById('test@test.com');
     */
    public async updateUserRecipes(userId: ObjectId, originalUserId: ObjectId, recipeId: ObjectId): Promise<WithId<UserDocument>> {
        const dataToAdd = {
            id: recipeId,
            copyDetails: {
                originalCreatorId: ensureObjectId(originalUserId),
                originalRecipeId: ensureObjectId(recipeId),
                copiedAt: new Date(),
                updatedAt: new Date(),
                modified: false
            }
        } as UsersRecipeData
        BeUpdateUsersRecipesSchema.parse(dataToAdd);
        IsObjectIdSchema.parse(userId);
        const user = await this.userRepository.findOneAndUpdate({ _id: userId }, { $addToSet: { recipes: dataToAdd }, $set: { updatedAt: new Date() }});

        if(!user) throw new ServerError(
            'Update User Failed', 
            { userId, dataToAdd, location: 'userService.updateUserRecipes' },
            ErrorCode.MONGODB_RESOURCE_UPDATE_FAILED
        );

        return user;
    }

    /**
     * Returns user based on inputed email
     * @group User Data - retrieval
     * @param {string} email - user's email
     * @return {WithId<UserDocument> | null>} - if User found, the user document
     * @example
     * const userService = useUserService();
     * await userService.findUserById('test@test.com');
     */
    public async findUserByEmail(email: string): Promise<WithId<UserDocument> | null> {
        IsEmailSchema.parse({ email });
        return await this.userRepository.findOne({'email': email})
    }

    /**
     * Returns user based on inputed id
     * @group User Data - retrieval
     * @param {ObjectId} _id - user's id
     * @return {WithId<UserDocument> | null>} - if User found, the user document
     * @example
     * const userService = useUserService();
     * await userService.findUserById('12332132');
     */
    public async findUserById(_id: ObjectId): Promise<WithId<UserDocument> | null> {
        IsObjectIdSchema.parse({ _id })
        return await this.userRepository.findOne({ _id });
    }
}