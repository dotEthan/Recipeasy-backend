import { ObjectId, UpdateResult } from "mongodb";
import bcrypt from 'bcryptjs';
import jwt, { JwtPayload } from 'jsonwebtoken';

import { UserRepository } from "../repositories/userRepository";
import { EmailService } from "./emailService";

import { NewUserNoId, UserDocument } from "../types/user";
import { CreatedDataResponse, StandardResponse } from "../types/responses";
import { AuthService } from "./authService";
import { createNewUserUtility } from "../util";

export class UserService {
    private userRepository: UserRepository;
    private emailService: EmailService;
    private authService: AuthService;

    constructor(userRepository: UserRepository, emailService: EmailService, AuthService: AuthService) {
        this.userRepository = userRepository;
        this.emailService = emailService;
        this.authService = AuthService;
    }

    async createNewUser(displayName: string, email: string, hashedPassword: string): Promise<CreatedDataResponse<UserDocument>> {
        console.log('createNewUser about to save')
        const newUserData = createNewUserUtility(displayName, email, hashedPassword);
        console.log('createNewUser about to save')
        const savedUserResults =  await this.saveUser(newUserData);
        if (!savedUserResults) throw Error('No User Created');

        const verificationSetAndSent = await this.authService.setAndSendVerificationCode(email, displayName,savedUserResults._id );
        console.log('email sent: ', verificationSetAndSent)
        return savedUserResults;
    }

    private async saveUser(newUserData: NewUserNoId): Promise<CreatedDataResponse<UserDocument>> {
        const hasUser = await this.userRepository.findOne({'email': newUserData.email})
        if (hasUser) {
            throw new Error('Email already in use');
        }

        console.log('Created User: ', newUserData);
        return this.userRepository.createUser(newUserData);
    }

    async setUserVerified(_id: ObjectId): Promise<StandardResponse> {
        console.log('setting verified userID: ', typeof _id);
        const hasUser = await this.userRepository.findById(_id)
        console.log('setting verified user exists: ', hasUser);
        if (!hasUser) {
            throw new Error('User Not Found, try logging in again');
        }
        console.log('setting user to verified')
        const updateResult: UpdateResult = await this.userRepository.updateOne({"_id": _id}, {verified: true});
        if(!updateResult.acknowledged || updateResult.modifiedCount === 0) throw new Error('update not successful')
        return {success: true};
    }

    async emailUserToken(email: string): Promise<StandardResponse> {
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

    async updateUserPassword(password: string, token: string) {
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
}