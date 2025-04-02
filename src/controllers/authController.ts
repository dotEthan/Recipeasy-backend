import { NextFunction, Request, Response } from "express";
import bcrypt from 'bcryptjs';
import passport, { AuthenticateOptions } from "passport";

import { UserService } from "../services/userService";

import { User } from "../types/user";
import { UnauthorizedError } from "../errors";
import { AuthService } from "../services/authService";
import { ObjectId } from "mongodb";
import { AuthPwResetCodesRepository } from "../repositories/authRespository";

export class AuthController {
    private userService: UserService;
    private authService : AuthService;
    private authPwResetCodesRepository: AuthPwResetCodesRepository;

    constructor(
        userService: UserService, 
        authService: AuthService,
        authPwResetCodesRepository: AuthPwResetCodesRepository
    ) {
        this.authPwResetCodesRepository = authPwResetCodesRepository;
        this.userService = userService;
        this.authService = authService;
        this.register = this.register.bind(this);
        this.login = this.login.bind(this);
        this.logout = this.logout.bind(this);
        this.verifyCode = this.verifyCode.bind(this);
        this.resetPassword = this.resetPassword.bind(this);
        this.validatePasswordToken = this.validatePasswordToken.bind(this);
    }

    
    public async register(req: Request, res: Response): Promise<void> {
        try {
            const {displayName, email, password} = req.body;

            const hashedPassword = await bcrypt.hash(password, 12);
            const userResponse = await this.userService.createNewUser(displayName, email, hashedPassword);

            const userData = {
                email: userResponse.email,
                displayName: userResponse.displayName,
                _id: userResponse._id,
                verified: false,
            }
            req.session.unverifiedUserId = userResponse._id;
            res.status(201).json({ success: true, data: { userData }});

        } catch(error: unknown) {
            // Todo Global Error Handling
            console.log('Register Failed: ', error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            if (errorMessage === 'User already exists') {
                res.status(409).json({ success: false, message: errorMessage});
                return;
            };
            res.status(500).json({success: false, message: errorMessage});
        }

    }
    
    public async login(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const response = await this.authenticateUser(req, res);
            let newEmailVerifyCodeCreated = false;
            if (!response.verified) {
                newEmailVerifyCodeCreated = await this.authService.setAndSendVerificationCode(response.email, response.displayName, response._id)
            }
            
            res.json({
                user: {
                    _id: response._id,
                    email: response.email,
                    verified: response.verified,
                },
                newEmailVerifyCodeCreated,
            });
            await this.authService.logLoginAttempt(req, true);
        } catch(err) {
            const errorMessage = ((err instanceof UnauthorizedError) ? err.message : err) as string;
            await this.authService.logLoginAttempt(req, false, errorMessage);
            next(err);
        }
    }

    public async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
        req.logOut((err) => {
            if (err) return next(err);
            res.clearCookie('recipeasy.sid');

            req.session.destroy((err) => {
                if (err) return next(err);
                return res.json({
                    success: true,
                    message: "User Logged Out"
                });
            });
        })
    }

    public async verifyCode(req: Request, res: Response): Promise<void> {
        try {

            const currentUserId = req.session.unverifiedUserId || req.user?._id;
            if (!currentUserId) throw new Error('User Session Ended, please log in again');

            const userId = new ObjectId(currentUserId);

            const verified = await this.authService.checkVerificationCode(userId, req.body.code);

            if (!verified) {
                console.log('verification failed');
                // TODO 3 retries, update object to track retries
            }

            console.log('was verified: ', verified)
            this.userService.setUserVerified(userId);
            this.authService.deleteVerificationCode(userId);

            res.json({ codeVerfied: verified }); 
        } catch (err) {
            console.log('getVerifCode err', err);
        }
    }

    public async resetPassword(req: Request, res: Response): Promise<void> {
        console.log('resetting started: ', req.body)
        try {
            const email: string = req.body.email;
            console.log('email: ', email);
            const passwordReset = await this.userService.emailUserToken(email);
            console.log('is password reset: ', passwordReset);
            res.json(passwordReset); 
        } catch(error) {
            console.log('reset password error: ', error);
        }
    }

    public async validatePasswordToken(req: Request, res: Response) {
        try {
            const token = req.body.token;
            console.log('validate token: ', token);
            const isValid = await this.authService.validatePasswordToken(token);
            res.json(isValid)
        } catch (error) {
            console.log('validating password token error: ', error);
        }
    }

    private authenticateUser(req: Request, res: Response): Promise<User>  {
        const passportOptions = {
            failureWithError: true
        } as AuthenticateOptions;
        return new Promise((resolve, reject) => {
            passport.authenticate('local', passportOptions, (err: Error, user: User, info: { message: string}) => {
                if (err) {
                    return reject(err);
                }
                if (!user) {
                    return reject(new UnauthorizedError(info.message));
                }

                req.logIn(user, (loginErr: Error | null) => {
                    if (loginErr) {
                        return reject(loginErr);
                    }

                    resolve(user); 
                });
            })(req, res);
        })
    }
    
}
