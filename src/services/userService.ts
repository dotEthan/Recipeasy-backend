import { ObjectId, WithId } from "mongodb";

import { UserRepository } from "../repositories/user/userRepository";
import { createNewUserUtility } from "../util/createNewuser";

import { BeCreateUserSchema, BeUpdateUsersRecipesSchema, UpdateByIdSchema } from "../schemas/user.schema";
import { UserDocument, UsersRecipeData } from "../types/user";
import { CreatedDataResponse, StandardResponse } from "../types/responses";
import { NotFoundError, ServerError } from "../errors";
import { EmailVerificationService } from "./emailVerificationService";
import { IsObjectIdSchema } from "../schemas/shared.schema";
import { ensureObjectId } from "../util/ensureObjectId";

/**
 * Handles all user related services
 * @todo previousPasswords hash TLL = 1yr for hash
 * @todo Ensure all errors are handled
 * @todo Add logging
 * @todo BOW TO ZOD PARSING!
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
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const creationResult = await this.userRepository.createUser(newUserData);
        if (!creationResult.acknowledged || !creationResult.insertedId) throw new ServerError('createNewUser - Create new user failed', { newUserData })

        const userId = ensureObjectId(creationResult.insertedId);
        IsObjectIdSchema.parse(userId);
        const user = await this.userRepository.findById(creationResult.insertedId);
        if (!user) throw new ServerError(`createNewUser - User not created`, { createdUserId: creationResult.insertedId });

        const verificationSetAndSent = await this.emailVerificationService.setAndSendVerificationCode(email, displayName, user._id );
        if (!verificationSetAndSent.success) throw new ServerError(`createNewUser - Verificatin Code not set or sent`);

        return user;
    }

    public async getUserData(_id: ObjectId): Promise<UserDocument> {    
        const userResponse = await this.userRepository.findById(_id);
        if(!userResponse) throw new NotFoundError(`getUserData - User Not Found relogin`, { userId: _id});
        return userResponse as UserDocument;
    }

    public async setUserVerified(_id: ObjectId): Promise<StandardResponse> {
        console.log('Setting user to Verified');
        const hasUser = await this.userRepository.findById(_id);
        if (!hasUser) throw new NotFoundError(`setUserVerified - User Not Found, relogin`, { _id });
        const updatedData = {verified: true};
        UpdateByIdSchema.parse({updatedData});
        const updateResult = await this.userRepository.updateById(_id, { $set: updatedData});
        if(!updateResult?.acknowledged || updateResult?.modifiedCount === 0) throw new ServerError('update not successful', { _id, updatedData});
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

        const user = await this.userRepository.findOneAndUpdate({ '_id': userId }, { $addToSet: { recipes: dataToAdd }});
        if(!user) throw new ServerError('updateUserRecipes - Update User Failed', { userId, dataToAdd });

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
        // parse
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
        // parse
        return await this.userRepository.findOne({_id});
    }
}