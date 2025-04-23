import { ObjectId, WithId } from "mongodb";
import bcrypt from 'bcryptjs';
import jwt, { JwtPayload } from 'jsonwebtoken';

import { UserRepository } from "../repositories/user/userRepository";
import { EmailService } from "./emailService";

import { UserDocument, UsersRecipeData } from "../types/user";
import { CreatedDataResponse, StandardResponse } from "../types/responses";
import { AuthService } from "./authService";
import { createNewUserUtility } from "../util/createNewuser";
import { BeUpdateUsersRecipesSchema } from "../schemas/user.schema";

/**
 * Handles all user related services
 * @todo Ensure all errors are handled
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
        const savedUserResults =  await this.userRepository.createUser(newUserData);
        if (!savedUserResults) throw Error('No User Created');

        const verificationSetAndSent = await this.authService.setAndSendVerificationCode(email, displayName,savedUserResults._id );
        // TODO error handling? 
        console.log('Verification email sent: ', verificationSetAndSent)
        return savedUserResults;
    }

    public async getUserData(_id: ObjectId): Promise<UserDocument> {    
        const userResponse = await this.userRepository.findById(_id);
        if(!userResponse) throw new Error('User Not Found, relogin');
        return userResponse;
    }

    public async setUserVerified(_id: ObjectId): Promise<StandardResponse> {
        console.log('setting verified userID: ', typeof _id);
        const hasUser = await this.userRepository.findById(_id)
        console.log('setting verified user exists: ', hasUser);
        if (!hasUser) {
            throw new Error('User Not Found, try logging in again');
        }
        console.log('setting user to verified')
        const updateResult = await this.userRepository.updateById(_id, {verified: true});
        if(!updateResult?.acknowledged || updateResult?.modifiedCount === 0) throw new Error('update not successful')
        return {success: true};
    }

    public async emailUserToken(email: string): Promise<StandardResponse> {
        const userId = await this.userRepository.findIdByEmail(email);
        if (!userId) {
            throw Error('User Not Found');
        }

        const userToken = {
            userId,
            type: 'reset-password'
        };

        console.log('process.env.JWQ_SECRET_DEV', process.env.JWQ_SECRET_DEV);
        const secret = (process.env.NODE_ENV !== 'production') ? process.env.JWT_SECRET_PROD : process.env.JWT_SECRET_DEV;

        if (!secret) throw new Error('Env JWT_SECRET_PROD/DEV not set');
        const expiresIn = '1h';

        const resetToken = jwt.sign(userToken, secret, {expiresIn})
        // send email
        const emailSentInfo = await this.emailService.sendEmailToUser('passwordReset', '', email, resetToken)
 
        console.log('password Reset email sent: ', emailSentInfo);
        const emailSent = emailSentInfo.rejected.length === 0 ? true : false;
        return {success: emailSent};
    }

    public async updateUserPassword(password: string, token: string) {
        const secret = (process.env.NODE_ENV !== 'prod') ? process.env.JWT_SECRET_PROD : process.env.JWT_SECRET_DEV;
        if (!secret) throw new Error('Env JWT_SECRET_PROD/DEV not set');

        const hashedPassword = await bcrypt.hash(password, 12);

        const decoded = await jwt.verify(token, secret) as JwtPayload;
        const userId = decoded.userId as string;
        if (!userId) throw new Error('Password token object userId missing');
        console.log('updating userId: ', userId)
        console.log('updating hashedPassword: ', hashedPassword)
        
        const updateResponse = await this.userRepository.updateById(new ObjectId(userId), {password: hashedPassword});
        if (updateResponse && updateResponse.matchedCount === 0) {
            // TODO ERROR Handling
            console.log("usdateUserPassword Document Not Found");
            throw new Error('usdateUserPassword Document Not Found')
        } else if (updateResponse && updateResponse.modifiedCount === 0) {
            console.log("usdateUserPassword Document not modified");
            throw new Error('Document Not Modified')
        }
        return updateResponse;
    }

    
    public async updateUserRecipes(userId: ObjectId, originalUserId: ObjectId, recipeId: ObjectId): Promise<WithId<UserDocument> | null> {
        const dataToAdd = {
            id: recipeId,
            copyDetails: {
                originalCreatorId: originalUserId,
                originalRecipeId: recipeId,
                copiedAt: new Date(),
                updatedAt: new Date(),
                modifications: false
            }
        } as UsersRecipeData
        BeUpdateUsersRecipesSchema.parse(dataToAdd);

        const user = await this.userRepository.findOneAndUpdate({ '_id': userId }, { $addToSet: { recipes: dataToAdd }});
        return user
    }

    public async findUserByEmail(email: string): Promise<WithId<UserDocument> | null> {
        return await this.userRepository.findOne({'email': email})
    }
}