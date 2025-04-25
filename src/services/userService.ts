import { ObjectId, UpdateResult, WithId } from "mongodb";
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

import { UserRepository } from "../repositories/user/userRepository";
import { EmailService } from "./emailService";

import { User, UserDocument, UsersRecipeData } from "../types/user";
import { CreatedDataResponse, StandardResponse } from "../types/responses";
import { AuthService } from "./authService";
import { createNewUserUtility } from "../util/createNewuser";
import { BeUpdateUsersRecipesSchema, FindByEmailSchema, UpdateByIdSchema } from "../schemas/user.schema";
import { PW_RESET_TOKEN_TTL } from "../constants";
import { AppError, ConflictError, NotFoundError, ServerError } from "../errors";
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
        private emailService: EmailService, 
        private authService: AuthService
    ) {}

    public async createNewUser(displayName: string, email: string, hashedPassword: string): Promise<CreatedDataResponse<UserDocument>> {
        const newUserData = createNewUserUtility(displayName, email, hashedPassword);
        
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { createdAt, ...userWithoutBeData } = await this.userRepository.createUser(newUserData);
        
        if (!userWithoutBeData) throw new AppError(`createNewUser - User not created`, 500);

        const verificationSetAndSent = await this.authService.setAndSendVerificationCode(email, displayName,userWithoutBeData._id );
        if (!verificationSetAndSent) throw new AppError(`createNewUser - Verificatin Code not set or sent`, 500);
        console.log('Verification email sent: ', verificationSetAndSent)
        return userWithoutBeData;
    }

    public async getUserData(_id: ObjectId): Promise<UserDocument> {    
        const userResponse = await this.userRepository.findById(_id);
        if(!userResponse) throw new AppError(`getUserData - User Not Found with id: ${_id}, relogin`, 404);
        return userResponse as UserDocument;
    }

    public async setUserVerified(_id: ObjectId): Promise<StandardResponse> {
        console.log('Setting user to Verified');
        const hasUser = await this.userRepository.findById(_id);
        if (!hasUser) throw new AppError(`setUserVerified - User Not Found with id: ${_id}, relogin`, 404);
        const updatedData = {verified: true};
        UpdateByIdSchema.parse({updatedData});
        const updateResult = await this.userRepository.updateById(_id, { $set: updatedData});
        if(!updateResult?.acknowledged || updateResult?.modifiedCount === 0) throw new Error('update not successful');
        return {success: true};
    }

    public async startPasswordResetFlow(email: string): Promise<StandardResponse> {
        console.log('Emailing user password Reset token');
        const userId = await this.userRepository.findIdByEmail(email);
        if (!userId) throw new AppError(`setUserVerified - User Not Found with email: ${email}, relogin`, 404);

        const userToken = {
            userId,
            type: 'reset-password'
        };

        const secret = (process.env.NODE_ENV !== 'production') ? process.env.JWT_SECRET_PROD : process.env.JWT_SECRET_DEV;

        if (!secret) throw new AppError('startPasswordResetFlow: Env JWT_SECRET_PROD/DEV not set', 500);
        const expiresIn = '1h';

        const resetToken = jwt.sign(userToken, secret, {expiresIn});
        const emailSentInfo = await this.emailService.sendEmailToUser('passwordReset', '', email, resetToken);

        const passwordResetData = {
            resetInProgress: true,
            resetRequestedAt: new Date(),
            attempts: 0,
            expiresAt: new Date(Date.now() + PW_RESET_TOKEN_TTL) 
        }
        const updatedData = { passwordResetData: passwordResetData };
        UpdateByIdSchema.parse({updatedData});
        const updateUserRes = await this.userRepository.updateById(userId, { $set: updatedData});

        if (updateUserRes?.matchedCount === 0 || updateUserRes?.modifiedCount === 0) throw new AppError('startPasswordResetFlow: User update failed', 500);
        
        const emailSent = emailSentInfo.rejected.length === 0 ? true : false;
        return {success: emailSent};
    }
    
    /**
     * Delete passwordResetData - No flow in process
     * @todo log if deleteUserPwResetData fails (non-breaking)
     * @group Security - Bot trap
     * @param {UserDocument} userResponse - User to delete object from
     * @throws {ConflictError} 500 - if deletion fails (error as necessary cleanup)
     * @example
     * const userService = useUserService();
     * await userService.deleteUserPwResetData('xyz987');
     */
    public async checkIfPwResetInProgress(userEmail: string): Promise<boolean> {
        FindByEmailSchema.parse({email: userEmail});
        const userResponse =  await this.userRepository.findByEmail(userEmail);
        if (!userResponse) throw new AppError(`User with email: ${userEmail} not found`, 404);
        
        const isExpired = userResponse.passwordResetData?.expiresAt != null
        && new Date(userResponse.passwordResetData.expiresAt) < new Date();
        const pwResetInProgress = userResponse.passwordResetData != null && isExpired;
        if (isExpired) {
            this.deleteUserPwResetData(userResponse);
        }

        return pwResetInProgress
    }

    /**
     * Delete passwordResetData 
     * @group User Data - Forgotten Password
     * @param {UserDocument} userResponse - User to delete object from
     * @throws {ConflictError} 500 - if deletion fails (error as necessary cleanup)
     * @example
     * const userService = useUserService();
     * await userService.deleteUserPwResetData('xyz987');
     */
    public async deleteUserPwResetData(userResponse: UserDocument): Promise<UpdateResult | null> {
        return await this.userRepository.updateById(userResponse._id, {$unset: { passwordResetData: '' }});
    }

    /**
     * Change user password
     * @group User Data - management
     * @param {string} password - user's new password
     * @param {User} user - User to update
     * @return {UpdateResult} - User Document || null
     * @throws {NotFoundError} 404 - Data not found
     * @throws {ConflictError} 409 - Data state conflict
     * @example
     * const userService = useUserService();
     * await userService.updateUserPassword('xyz987', {_id:'12332132'});
     */
    public async updateUserPassword(password: string, user: User): Promise<UpdateResult<Document> | null> {
        const hashedPassword = await bcrypt.hash(password, 12);
        await this.cachePreviousPassword(user._id, password, hashedPassword);
        
        const updatedData = {password: hashedPassword};
        UpdateByIdSchema.parse({updatedData});
        const updateResponse = await this.userRepository.updateById(ensureObjectId(user._id), { $set: updatedData});
        if (updateResponse && updateResponse.matchedCount === 0) {
            console.log("updateUserPassword Document Not Found");
            throw new NotFoundError('updateUserPassword Document Not Found');
        } else if (updateResponse && updateResponse.modifiedCount === 0) {
            console.log("updateUserPassword Document not modified");
            throw new ConflictError('Document Not Modified');
        }
        return updateResponse;
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
    public async updateUserRecipes(userId: ObjectId, originalUserId: ObjectId, recipeId: ObjectId): Promise<WithId<UserDocument> | null> {
        const dataToAdd = {
            id: recipeId,
            copyDetails: {
                originalCreatorId: originalUserId,
                originalRecipeId: recipeId,
                copiedAt: new Date(),
                updatedAt: new Date(),
                modified: false
            }
        } as UsersRecipeData
        BeUpdateUsersRecipesSchema.parse(dataToAdd);

        const user = await this.userRepository.findOneAndUpdate({ '_id': userId }, { $addToSet: { recipes: dataToAdd }});
        return user
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

    /**
     * Ensures current PW isn't same as prevoius, and adds if not.
     * @group User Data - password management
     * @param {ObjectId} userId - user's id
     * @param {string} newPassword - user's new password
     * @param {string} hashedPassword - User new password hashed value
     * @return {AppError} 404 - Data not found
     * @return {AppError} 409 - Data state conflict
     * @return {AppError} 500 - Server Error
     * @example
     * const userService = useUserService();
     * await userService.updateUserPassword('xyz987', {_id:'12332132'});
     */
    private async cachePreviousPassword(
        userId: ObjectId, 
        newPassword: string, 
        hashedPassword: string
    ): Promise<void> {
        const findUserResponse = await this.userRepository.findById(
            ensureObjectId(userId), 
            { previousPasswords: 1 }
        );
        if (!findUserResponse) throw new NotFoundError('updateUserPassword - User not found');

        const previousPwArray = findUserResponse.previousPasswords || [];

        for ( const pw of previousPwArray) {
            const isEqual = await bcrypt.compare(newPassword, pw.hash);
            if (isEqual) throw new ConflictError('Password previously used');
        }

        const updatedPwArray = [...previousPwArray];
        if (updatedPwArray.length === 3) {
            previousPwArray.pop();
        }

        updatedPwArray.unshift({
            hash: hashedPassword,
            deprecatedAt: new Date()
        })

        const updateResult = await this.userRepository.updateOne(
            { _id: findUserResponse._id },
            { $set: {previousPasswords: updatedPwArray} }
        )
        if (updateResult.modifiedCount === 0) throw new ServerError('cachePreviousPassword - Failed to update password history');
    }
}