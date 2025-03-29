import { NextFunction, Request, Response } from "express";
import bcrypt from 'bcryptjs';
import passport, { AuthenticateOptions } from "passport";

import { UserService } from "../services/userService";

import { User } from "../types/user";
import { UnauthorizedError } from "../errors";

export class AuthController {
    private userService: UserService;

    constructor(userService: UserService) {
        this.userService = userService;
        this.register = this.register.bind(this);
        this.login = this.login.bind(this);
    }

    
    public async register(req: Request, res: Response): Promise<void> {
        try {
            const {displayName, email, password} = req.body;

            const hashedPassword = await bcrypt.hash(password, 12);
            const response = await this.userService.createUser(displayName, email, hashedPassword);

            const userData = {
                email: response.email,
                displayName: response.displayName,
                _id: response._id,
                verified: false,
            }
            res.status(201).json({ success: true, data: userData });

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
            await this.userService.logLoginAttempt(req, true);
        } catch(err) {
            const errorMessage = ((err instanceof UnauthorizedError) ? err.message : err) as string;
            await this.userService.logLoginAttempt(req, false, errorMessage);
            next(err);
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

}
// TODO RIP OUT PASSPORT.