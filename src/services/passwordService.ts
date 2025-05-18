import jwt, { JwtPayload } from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { ObjectId, UpdateResult } from "mongodb";

import { UserRepository } from "../repositories/user/userRepository";
import { EmailService } from './emailService';
import { UserService } from "./userService";
import { ensureObjectId } from "../util/ensureObjectId";
import { PW_RESET_TOKEN_TTL } from '../constants';
import { PreviousPasswordSchema, UpdateByIdSchema } from '../schemas/user.schema';
import { ErrorCode, TokenTypes } from "../types/enums";
import { User, UserDocument } from '../types/user';
import { StandardResponse } from "../types/responses";
import { 
    BadRequestError, 
    ConflictError, 
    ForbiddenError, 
    NotFoundError, 
    ServerError, 
    UnauthorizedError 
} from "../errors";
import { zodValidationWrapper } from '../util/zodParseWrapper';

/**
 * Handles all Password related logic
 * @todo - post - Ensure all errors are handled
 * @todo - post - Add logging
 */

export class PasswordService {
    constructor(
        private userRepository: UserRepository,
        private userService: UserService,
        private emailService: EmailService
    ) {}
    
    /**
     * Start the "Forgot Password" reset flow
     * @todo - post - log if deleteUserPwResetData fails (non-breaking)
     * @todo - update process.env.JWT_SECRET_PROD : process.env.JWT_SECRET_DEV to just one. 
     * @group Password Management - Email Token & Add Reset Data
     * @param {string} email - User email
     * @throws {NotFoundError} 404 - User Not found
     * @throws {ConflictError} 409 - if deletion fails (error as necessary cleanup)
     * @throws {ServerError} 500 - if env variables not set or user update fails
     * @example
     * const passwordService = passwordService();
     * await passwordService.startPasswordResetFlow('xyz987');
     */
    
    public async startPasswordResetFlow(email: string): Promise<StandardResponse> {
        const userId = await this.userRepository.findIdByEmail(email);
        if (!userId) throw new NotFoundError(
            `User Not Found with email: ${email}, relogin`, 
            { location: 'passwordService.startPasswordResetFlow', email },
            ErrorCode.USER_NOT_FOUND
        );

        const userToken = {
            userId,
            type: 'reset-password'
        };

        const secret = process.env.PASSWORD_RESET_SECRET;

        if (!secret) throw new ServerError(
            'startPasswordResetFlow: Env PASSWORD_RESET_SECRET not set',
            { 
                location: 'passwordService.startPasswordResetFlow',
                details: 'PASSWORD_RESET_SECRET missing'
            },
            ErrorCode.ENV_VAR_MISSING
        );
        const expiresIn = '1h';

        const resetToken = jwt.sign(userToken, secret, {expiresIn});
        const emailSentInfo = await this.emailService.sendEmailToUser('passwordReset', '', email, resetToken);

        const passwordResetData = {
            resetInProgress: true,
            resetRequestedAt: new Date(),
            attempts: 0,
            expiresAt: new Date(Date.now() + PW_RESET_TOKEN_TTL) 
        }
        const updatedData = { passwordResetData: passwordResetData, updatedAt: new Date() };
        zodValidationWrapper(UpdateByIdSchema, updatedData, 'passwordService.startPasswordResetFlow');
        const updateUserRes = await this.userRepository.updateById(userId, { $set: updatedData });

        if (updateUserRes?.matchedCount === 0) throw new NotFoundError(
            'startPasswordResetFlow: User to update not found',
            { location: 'passwordService.startPasswordResetFlow' },
            ErrorCode.RESOURCE_NOT_FOUND
        );
        if (updateUserRes?.modifiedCount === 0) throw new ServerError(
            'startPasswordResetFlow: User update failed',
            { 
                location: 'passwordService.startPasswordResetFlow',
                details: 'Updating passwordResetData'
             },
            ErrorCode.UPDATE_USER_FAILED
        );
        
        const emailSent = emailSentInfo.rejected.length === 0 ? true : false;
        return {success: emailSent};
    }
    
    /**
     * Validate Password Reset Token
     * @group Password Management - Token Validation
     * @param {string} token - password reset token
     * @return {boolean} true - validation success
     * @example
     * const authService = useAuthService();
     * await authService.validatePasswordToken('xyz987');
     */
    public async validatePasswordToken(token: string, type: string): Promise<StandardResponse> {
        const secret = process.env.PASSWORD_RESET_SECRET;
        if (!secret) throw new ServerError(
            'validatePasswordToken - Env PASSWORD_RESET_SECRET not set',
            { 
                location: 'passwordService.validatePasswordToken',
                details: 'PASSWORD_RESET_SECRET missing'
             },
            ErrorCode.ENV_VAR_MISSING
        );

        const decoded = jwt.verify(token, secret) as JwtPayload;
        if (decoded.type !== type) {
            throw new BadRequestError(
                'validatePasswordToken - Invalid token type',
                { location: 'passwordService.validatePasswordToken' },
                ErrorCode.VALIDATION_TOKEN_MALFORMED
            );
            // TODO recreate and resend
        }

        const userId = decoded.userId;
        
        if (!userId) {
            throw new UnauthorizedError(
            'validatePasswordToken - Token UserId not found',
            { location: 'passwordService.validatePasswordToken' },
            ErrorCode.VALIDATION_TOKEN_MALFORMED
            );
            // TODO recreate and resend
        }
        return {success: true, data: userId};
    }

    /**   
     * Reset Password Request - Final Step
     * @group Password Management - Set PW and cleanup
     * @param {string} token - Token from client
     * @param {string} newPassword - New Password
     * @return {StandardResponse} - succes, message, recipe, error
     * @throws {NotFoundError} 404 - Token's userid not valid
     * @throws {ServerError} 500 - Server error
     * @example
     * const passwordService = passwordResetService();
     * await passwordService.passwordResetFinalStep("1234abcd", "password");
     */  
    public async passwordResetFinalStep(token: string, newPassword: string): Promise<StandardResponse> {
        
        const validationRes = await this.validatePasswordToken(token, TokenTypes.PASSWORD_RESET);
        const userId = validationRes.data as string;
        
        const user = await this.userService.findUserById(ensureObjectId(userId));
        if(!user) throw new NotFoundError(
            'passwordResetFinalStep - No user found validating password token',
            { location: 'passwordService.passwordResetFinalStep', id: userId},
            ErrorCode.USER_NOT_FOUND
        );
        
        const updatePasswordRes = await this.updateUserPassword(newPassword, user);
        if (updatePasswordRes?.matchedCount === 0) throw new NotFoundError(
            'Update User Password: User not found',
            { location: 'passwordService.passwordResetFinalStep', user },
            ErrorCode.USER_NOT_FOUND
        );
        if (updatePasswordRes?.modifiedCount === 0) throw new ServerError(
            'passwordResetFinalStep - Updating User password failed',
            { 
                location: 'passwordService.passwordResetFinalStep', 
                user,
                details: "updating user password"
             },
            ErrorCode.UPDATE_USER_FAILED
        );
        
        const deleteResponse = await this.deleteUserPwResetData(user);

        if (deleteResponse?.matchedCount === 0) {
            throw new NotFoundError(
                'User password reset data not not found, relogin?',
                { location: 'passwordService.passwordResetFinalStep' },
                ErrorCode.RESOURCE_NOT_FOUND
            );
        } 
        
        if (deleteResponse?.modifiedCount === 0) {
            throw new ConflictError(
                'User password reset data not deleted, retry?',
                { location: 'passwordService.passwordResetFinalStep' },
                ErrorCode.PWRESETDATA_DELETE_FAILED
            );
            // TODO check still exists, and pwResetData still there, if so, retry, if not, user relogin
        }
        return { success: true };
    }
        
    /**
     * Delete passwordResetData - No flow in process
     * @todo - post - log if deleteUserPwResetData fails (non-breaking)
     * @group Security - Bot trap
     * @param {UserDocument} userResponse - User to delete object from
     * @throws {ForbiddenError} 403 - Password Reset in progress, can't login
     * @throws {NotFoundError} 404 - If user with email not found
     * @throws {ConflictError} 500 - if deletion fails (error as necessary cleanup)
     * @example
     * const userService = useUserService();
     * await userService.deleteUserPwResetData('xyz987');
     */
    public async checkIfPwResetInProgress(userEmail: string): Promise<void> {
        const userResponse =  await this.userRepository.findByEmail(userEmail);
        if (!userResponse) throw new NotFoundError(
            `checkIfPwResetInProgress - User with email: ${userEmail} not found`,
            { location: 'passwordService.checkIfPwResetInProgress', email: userEmail },
            ErrorCode.USER_NOT_FOUND
        );
        
        const isExpired = userResponse.passwordResetData?.expiresAt != null
        && new Date(userResponse.passwordResetData.expiresAt) < new Date();        
        if (isExpired) {
            const deletionResponse = await this.deleteUserPwResetData(userResponse);
            if (deletionResponse?.modifiedCount === 0) throw new ServerError(
                'Users password reset data not deleted',
                { 
                    location: 'passwordService.checkIfPwResetInProgress',
                    details: 'Users passwordResetData delete failed'
                },
                ErrorCode.UPDATE_RESOURCE_FAILED
            )

        }

        const pwResetInProgress = userResponse.passwordResetData != null && isExpired;

        if (pwResetInProgress) throw new ForbiddenError(
            'Password reset already in progress',
            { location: 'passwordService.checkIfPwResetInProgress' },
            ErrorCode.PW_RESET_IN_PROGRESS
        );
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
        return await this.userRepository.updateById(
            userResponse._id, 
            {
                $unset: { passwordResetData: '' },
                $set: { updatedAt: new Date() }
            });
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
        
        const updatedData = { password: hashedPassword, updatedAt: new Date() } as Partial<User>;
        zodValidationWrapper(UpdateByIdSchema, updatedData, 'passwordService.updateUserPassword');
        const updateResponse = await this.userRepository.updateById(ensureObjectId(user._id), { $set: updatedData});
        if (updateResponse && updateResponse.matchedCount === 0) {
            throw new NotFoundError(
                'updateUserPassword - Document Not Found',
                { location: 'passwordService.updateUserPassword' },
                ErrorCode.RESOURCE_NOT_FOUND
            );
        } else if (updateResponse && updateResponse.modifiedCount === 0) {
            throw new ConflictError(
                'updateUserPassword - Document Not Modified',
                { location: 'passwordService.updateUserPassword' },
                ErrorCode.PASSWORD_CHANGE_FAILED
            );
            // TODO 
        }
        return updateResponse;
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
        if (!findUserResponse) throw new NotFoundError(
            'User not found',
            { location: 'passwordService.cachePreviousPassword', userId },
            ErrorCode.RESOURCE_NOT_FOUND
        );

        const previousPwArray = findUserResponse.previousPasswords || [];

        for ( const pw of previousPwArray) {
            const isEqual = await bcrypt.compare(newPassword, pw.hash);
            if (isEqual) throw new ConflictError(
                'Password previously used',
                { location: 'passwordService.cachePreviousPassword' },
                ErrorCode.PW_RECENTLY_USED
            );
        }

        const updatedPwArray = [...previousPwArray];
        if (updatedPwArray.length === 3) {
            previousPwArray.pop();
        }

        updatedPwArray.unshift({
            hash: hashedPassword,
            deprecatedAt: new Date()
        })

        zodValidationWrapper(z.array(PreviousPasswordSchema), updatedPwArray, 'passwordService.cachePreviousPassword');
        const updateResult = await this.userRepository.updateCachedPasswords(findUserResponse._id, updatedPwArray)
        if (updateResult.modifiedCount === 0) throw new ServerError(
            'Failed to update password history',
            { 
                location: 'passwordService.cachePreviousPassword', 
                updatedPwArray,
                details: 'Update Users Previous Password Array failed'
            },
            ErrorCode.UPDATE_USER_FAILED
        );
    }
}