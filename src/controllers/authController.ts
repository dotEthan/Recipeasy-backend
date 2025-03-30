import { NextFunction, Request, Response } from "express";
import bcrypt from 'bcryptjs';
import passport, { AuthenticateOptions } from "passport";
// import nodemailer from 'nodemailer';

import { UserService } from "../services/userService";

import { User } from "../types/user";
import { UnauthorizedError } from "../errors";
import { AuthService } from "../services/authService";

export class AuthController {
    private userService: UserService;
    private authService : AuthService;

    constructor(userService: UserService, authService: AuthService) {
        this.userService = userService;
        this.authService = authService;
        this.register = this.register.bind(this);
        this.login = this.login.bind(this);
        this.logout = this.logout.bind(this);
    }

    
    public async register(req: Request, res: Response): Promise<void> {
        try {
            const {displayName, email, password} = req.body;

            const hashedPassword = await bcrypt.hash(password, 12);
            const userResponse = await this.userService.createUser(displayName, email, hashedPassword);

            const userData = {
                email: userResponse.email,
                displayName: userResponse.displayName,
                _id: userResponse._id,
                verified: false,
            }
            const verificationSetAndSent = await this.authService.setAndSendVerificationCode(email, displayName,userData._id );
            console.log('email sent: ', verificationSetAndSent)
            res.status(201).json({ success: true, data: { userData, verificationSetAndSent }});

        } catch(error: unknown) {
            // Todo Global Error Handling
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
            res.json({
                _id: response._id,
                email: response.email,
                verified: response.verified
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
            if (!req.user?._id) {
                throw new Error('No User To Verify');
            }
            const verified = await this.authService.checkVerificationCode(req.user?._id, req.body.code);

            res.json({ codeVerfied: verified }); 
        } catch (err) {
            console.log('getVerifCode err', err);
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
