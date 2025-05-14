import { Request, Response } from "express";
import passport, { AuthenticateOptions } from "passport";

import { AuthService } from "../services/authService";
import { PasswordService } from "../services/passwordService";
import { sanitizeUser } from "../util/sanitizeUser";
import { TokenService } from "../services/tokenService";

import { FeUser, User } from "../types/user";
import { FeUserSchema, LoginResSchema } from "../schemas/user.schema";
import { BadRequestError, ServerError, UnauthorizedError } from "../errors";
import { ErrorCode } from "../types/enums";

/**
 * Authorization based req and res handling
 * @todo - post - Double check for unhandled errors
 */
// 
export class AuthController {

    constructor(
        private authService: AuthService,
        private passwordService: PasswordService,
        private tokenService: TokenService
    ) { }
    
    /**
     * Register new user
     * @group Authorization - Create User
     * @param {string} req.body.displayName - User's Displayed Name
     * @param {string} req.body.email.required - User's email
     * @param {string} req.body.password.required - User's password
     * @return {StandardResponse} success: boolean, data: userResponse
     * @throws {BadRequestError} 400 - req.body missing displayName, email, or password
     * @throws {ZodError} 401 - Validation failed
     */
    
    public register = async (req: Request, res: Response): Promise<void> => {
        const {displayName, email, password} = req.body;
        if (!displayName || !email || !password) throw new BadRequestError(
            'register - req.body missing required data', 
            { body: req.body },
            ErrorCode.RESOURCE_ID_PARAM_MISSING
        )

        const registeredUser = await this.authService.registerNewUser(displayName, email, password);

        // for email validation
        req.session.unverifiedUserId = registeredUser._id;

        FeUserSchema.parse(registeredUser)
        res.status(201).json({success: true, data: registeredUser});
    }
    
    /**
     * Log User In
     * @todo - post - 3 failed attempts triggers password reset required
     * @group Authorization - Create session
     * @param {string} req.body.email - User's email
     * @param {string} req.body.password - User's password
     * @return  {LoginResponse} user: User, newEmailVerifyCodeCreated: boolean, recipeResponse: Recipe[], totalRecipes: number
     * @throws {BadRequestError} 400 - req.body missing email
     * @throws {ZodError} 401 - Validation failed
     */
    public login = async (req: Request, res: Response): Promise<void> => {
        const { email, password } = req.body;
        if (!email || ! password) throw new BadRequestError(
            'register - req.body missing required data', 
            { body: req.body },
            ErrorCode.MISSING_REQUIRED_BODY_DATA
        )

        await this.passwordService.checkIfPwResetInProgress(email);


        const authenticatedUser = await this.authenticateUser(req, res);
        const autheticatedSantizedUser = sanitizeUser(authenticatedUser) as FeUser;
        
        const responseData = await this.authService.userLogin(autheticatedSantizedUser);

        const [ accessToken, refreshToken ] = await this.tokenService.createUserTokens(autheticatedSantizedUser);

        res.cookie('__Host-refreshToken', refreshToken, {
            httpOnly: true,
            secure: true,
            sameSite: 'lax',
            path: '/',
            maxAge: 604800 * 1000
        });

        LoginResSchema.parse(responseData);
        res.status(200).json({...responseData, accessToken });

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
            sameSite: 'lax'
        });

        res.clearCookie('__Host-refreshToken', {
            httpOnly: true,
            secure: true,
            sameSite: 'strict',
            path: '/'
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
     * @throws {ZodError} 401 - Validation failed
     */
    public checkSession = (req: Request, res: Response) => {
        const user = req.user ? sanitizeUser(req.user) : undefined;
        if (req.isAuthenticated() && user) {
            FeUserSchema.parse(user)
            res.status(200).json({ success: true, user });
        } else {
            throw new UnauthorizedError(
                'User session not found', 
                { location: 'authController.checkSession' }, 
                ErrorCode.REQ_USER_MISSING
            );
        }
    }

    /**
     * Passport's authenticate User
     * @group Authorization - Autheticates User
     * @return  {StandardUserResponse} success, message, data, error - Stardard response for generic calls
     * @throws {ZodError} 401 - Validation failed
     * @throws {PassportErrors} 401 - Validation failed
     */
    private authenticateUser = (req: Request, res: Response): Promise<User> => {
        const passportOptions = {
            failureWithError: true
        } as AuthenticateOptions;

        return new Promise((resolve, reject) => {
            passport.authenticate('local', passportOptions, (error: Error, user: User, info: { message: string}) => {
                if (error) {
                    return reject(new ServerError(
                        'authenticateUsererror', 
                        { location: 'authController.authenticateUser' }, 
                        ErrorCode.PASSPORT_FAILED
                    ));
                }
                if (!user) {
                    return reject(new UnauthorizedError(
                        info.message, 
                        { location: 'authController.authenticateUser' }, 
                        ErrorCode.PASSPORT_UNAUTH
                    ));
                }

                req.logIn(user, (loginError: Error | null) => {
                    if (loginError) {
                        return reject(loginError);
                    }

                    resolve(user); 
                });
            })(req, res);
        })
    }
    
}
