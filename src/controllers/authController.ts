import { Request, Response } from "express";
import passport, { AuthenticateOptions } from "passport";

import { AuthService } from "../services/authService";
import { PasswordService } from "../services/passwordService";
import { RecipeService } from "../services/recipeService";
import { UserService } from "../services/userService";

import { User } from "../types/user";
import { FeUserSchema, LoginResSchema } from "../schemas/user.schema";
import { BadRequestError, UnauthorizedError } from "../errors";

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
        private passwordService: PasswordService
    ) { }
    
    /**
     * Register new user
     * @group Authorization - Create User
     * @param {string} req.body.displayName - User's Displayed Name
     * @param {string} req.body.email.required - User's email
     * @param {string} req.body.password.required - User's password
     * @throws {LogOnlyError} 400 - missing user data
     * @return  {StandardResponse} success: boolean, data: userResponse
     */
    
    public register = async (req: Request, res: Response): Promise<void> => {
        const {displayName, email, password} = req.body;
        if (!email || !password) throw new BadRequestError('Missing email or password', { email, password })

        const registeredUser = await this.authService.registerNewUser(displayName, email, password);

        req.session.unverifiedUserId = registeredUser._id;

        FeUserSchema.parse(registeredUser)
        res.status(201).json({success: true, data: registeredUser});
    }
    
    /**
     * Log User In
     * @todo 3 strikes you're out
     * @group Authorization - Create session
     * @param {string} req.body.email - User's email
     * @param {string} req.body.password - User's password
     * @return  {LoginResponse} user: User, newEmailVerifyCodeCreated: boolean, recipeResponse: Recipe[], totalRecipes: number
     */
    public login = async (req: Request, res: Response): Promise<void> => {
        const email = req.body.email;
        await this.passwordService.checkIfPwResetInProgress(email);

        const authenticatedUser = await this.authenticateUser(req, res);
        const responseData = await this.authService.userLogin(authenticatedUser);


        LoginResSchema.parse(responseData);
        res.status(200).json(responseData);

        await this.authService.logLoginAttempt(req, true);
    }

    /**
     * User Log out
     * @group User Session - Ends Session
     * @return  {StandardResponse} success, message, data, error - Stardard response for generic calls
     */
    public logUserOut = async (req: Request, res: Response) => {
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
    }

    /**
     * Checks if user session active on page reload
     * @group User Session - Checks Session
     * @return  {StandardUserResponse} success, message, data, error - Stardard response for generic calls
     */
    public checkSession = (req: Request, res: Response) => {
        if (req.isAuthenticated()) {
            const user = req.user;
            console.log('session check')
            FeUserSchema.parse(user)
            res.status(200).json({ success: true, user });
        } else {
            res.status(401).json({success: false, message: 'User Not Autheticated'})
        }
    }

    private authenticateUser = (req: Request, res: Response): Promise<User> => {
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
