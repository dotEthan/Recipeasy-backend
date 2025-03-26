import { NextFunction, Request, Response } from "express";
import { UserService } from "../services/userService";
import bcrypt from 'bcryptjs';
import passport from "passport";
import { User } from "../types/user";

export class AuthController {
    private userService: UserService;

    constructor(userService: UserService) {
        this.userService = userService;
        this.register = this.register.bind(this);
        this.login = this.login.bind(this);
    }

    
    public async register(req: Request, res: Response): Promise<void> {
        console.log('Registering User')
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
            console.log('Error Creating User: ', error);
            // Todo Look into which errors wont be an instance of error and address here
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            // TODO proper error handling
            if (errorMessage === 'User already exists') {
                res.status(409).json({ success: false, message: errorMessage});
                return;
            };
            res.status(500).json({success: false, message: errorMessage});
        }

    }
    
    public async login(req: Request, res: Response, next: NextFunction): Promise<void> {
        passport.authenticate('local', (err: Error, user: User, info: { message: string}) => {
            if (err) return next(err);
            if (!user) return res.status(401).json({ message: info.message });
            req.logIn(user, (loginErr: Error | null) => {
                if (loginErr) return next(loginErr);
                console.log('user Logged In:', user)
                return res.json({
                    _id: user._id,
                    email: user.email,
                    verified: user.verified
                });
            });

        })(req, res, next);
    }

    // TODO PASSPORT Logout steps
}