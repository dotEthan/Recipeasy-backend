import { NextFunction, Request, Response } from "express";
import bcrypt from 'bcryptjs';
import passport, { AuthenticateOptions } from "passport";

import { UserService } from "../services/userService";

import { User } from "../types/user";
import { UnauthorizedError } from "../errors";
import { AuthService } from "../services/authService";
import { WithId } from "mongodb";
import { FeUserSchema, LoginResSchema } from "../schemas/user.schema";
import { GenericResponseSchema } from "../schemas/generic.schema";
import { RecipeService } from "../services/recipeService";
import { RecipeDocument } from "../types/recipe";
import { AppError } from "../util/appError";
import { LoginResponse, PaginateResponse } from "../types/responses";
import { ensureObjectId } from "../util/ensureObjectId";

/**
 * Authorization based req and res handling
 * @todo BOW TO ZOD PARSING!
 * @todo console.logs
 * @todo Error Handling
 */
// 
export class AuthController {

    constructor(
        private userService: UserService, 
        private authService: AuthService,
        private recipeService: RecipeService,
    ) { }

    
    public register = async (req: Request, res: Response): Promise<void> => {
        try {
            const {displayName, email, password} = req.body;

            const hashedPassword = await bcrypt.hash(password, 12);
            const emailInUse = await this.userService.findUserByEmail(email);
            if(emailInUse) throw new AppError('Email already in use', 409);
            const userResponse = await this.userService.createNewUser(displayName, email, hashedPassword);

            req.session.unverifiedUserId = userResponse._id;
            console.log('Registered User: ', userResponse);
            FeUserSchema.parse(userResponse)
            res.status(201).json({success: true, data: userResponse});

        } catch(error: unknown) {
            console.log('Register Failed: ', error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            if (errorMessage === 'User already exists') {
                res.status(409).json({ success: false, message: errorMessage});
                return;
            };
            res.status(500).json({success: false, message: errorMessage});
        }

    }
    
    public login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            console.log('logging in')
            const autheticateResponse = await this.authenticateUser(req, res);
            console.log('authenticatedid: ', autheticateResponse._id)

            let newEmailVerifyCodeCreated = false;
            if (!autheticateResponse.verified) {
                console.log('autheticated but not verified');

                //TODO check if already exists and within TTL.
                const codeExists = await this.authService.getVerificationCode(autheticateResponse._id);
                if (codeExists === null) {
                    console.log('no code exists, resending')
                    newEmailVerifyCodeCreated = await this.authService.setAndSendVerificationCode(autheticateResponse.email, autheticateResponse.displayName, autheticateResponse._id)
                }
            }
            console.log('user Data Finished ');

            let recipeResponse = [] as WithId<RecipeDocument>[];
            let totalRecipes = 0;
            if (autheticateResponse.recipes) {
                const paginatedResponse: PaginateResponse = await this.recipeService.getUsersRecipes(autheticateResponse);
                recipeResponse = paginatedResponse.data;
                totalRecipes = paginatedResponse.totalDocs;
            }
            const responseData = {
                user: autheticateResponse,
                newEmailVerifyCodeCreated,
                recipeResponse,
                totalRecipes: totalRecipes
            } as LoginResponse;
            // console.log('final return: ', recipeResponse[0]);
            LoginResSchema.parse(responseData);
            res.status(200).json(responseData);

            console.log('logging attempt')
            await this.authService.logLoginAttempt(req, true);
        } catch(err) {
            const errorMessage = ((err instanceof UnauthorizedError) ? err.message : err) as string;
            await this.authService.logLoginAttempt(req, false, errorMessage);
            next(err);
        }
    }

    public verifyCode = async (req: Request, res: Response): Promise<void> => {
        try {
            console.log('verifying Code')
            const currentUserId = req.session.unverifiedUserId || req.user?._id;
            if (!currentUserId) throw new AppError('User Session Ended, please log in again', 401);
            console.log(currentUserId)

            const userId = ensureObjectId(currentUserId);
           const code = req.body.code as string;
            console.log('code: ', userId);
            const verified = await this.authService.checkVerificationCode(userId, code);
            if (!verified) {
                console.log('verification failed');
                throw new AppError('Not Verified', 401);
                // throw new AppError('Token expired, revoked, already used', 404);
            }

            console.log('was verified: ', verified)
            this.userService.setUserVerified(userId);
            this.authService.deleteVerificationCode(userId);

            const verifyRes = {success: verified};
            GenericResponseSchema.parse(verifyRes);
            res.status(200).json(verifyRes); 
        } catch (err) {
            console.log('getVerifCode err', err);
        }
    }

    public resetPasswordRequest =  async (req: Request, res: Response): Promise<void> => {
        console.log('resetting started: ', req.body)
        try {
            const email: string = req.body.email;
            console.log('email: ', email);
            const passwordReset = await this.userService.emailUserToken(email);
            if (!passwordReset.success) throw new AppError('Password Reset Request failed to send, retry?', 500);
            console.log('is password reset: ', passwordReset);
            GenericResponseSchema.parse(passwordReset)
            res.status(201).json(passwordReset); 
        } catch(error) {
            console.log('reset password error: ', error);
        }
    }

    public validatePasswordToken = async (req: Request, res: Response) => {
        try {
            const token = req.body.code;
            console.log('validate token: ', token);
            const isValid = await this.authService.validatePasswordToken(token);
            GenericResponseSchema.parse(isValid)
            res.status(200).json(isValid)
        } catch (error) {
            console.log('validating password token error: ', error);
        }
    }

    public logUserOut = async (req: Request, res: Response) => {    
      try {
        await new Promise<void>((resolve, reject) => {
            req.logOut((error) => {
                if (error) return reject(error);
                resolve();
            });
        });

        res.clearCookie('recipeasy.sid', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict'
        });

        res.clearCookie('XSRF-TOKEN', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict'
        });
        
        await new Promise<void>((resolve, reject) => {
            req.session.destroy((error) => {
                if (error) return reject(error);
                resolve();
            });
        });

        res.status(200).json({
            success: true,
            message: "User logged out successfully"
        });

      } catch (error) {
        console.log('User log out error:', error);
        throw new AppError('Failed to complete logout process', 500);
      }
    }

    private authenticateUser = (req: Request, res: Response): Promise<User> => {
        const passportOptions = {
            failureWithError: true
        } as AuthenticateOptions;
        return new Promise((resolve, reject) => {
            passport.authenticate('local', passportOptions, (err: Error, user: User, info: { message: string}) => {
                if (err) {
                    console.log('authenticate user err: ', err);
                    return reject(err);
                }
                if (!user) {
                    console.log('authenticate user nouser err: ');
                    return reject(new UnauthorizedError(info.message));
                }

                req.logIn(user, (loginErr: Error | null) => {
                    if (loginErr) {
                        console.log('authenticate user req.logIn err: ', loginErr);
                        return reject(loginErr);
                    }

                    console.log('login: ', user)
                    resolve(user); 
                });
            })(req, res);
        })
    }
    
}
