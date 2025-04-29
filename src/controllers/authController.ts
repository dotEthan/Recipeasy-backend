import { Request, Response } from "express";
import passport, { AuthenticateOptions } from "passport";

import { AuthService } from "../services/authService";
import { PasswordService } from "../services/passwordService";

import { User } from "../types/user";
import { FeUserSchema, LoginResSchema } from "../schemas/user.schema";
import { BadRequestError, ServerError, UnauthorizedError } from "../errors";
import { ErrorCode } from "../types/enums";
import { sanitizeUser } from "../util/sanitizeUser";

/**
 * Authorization based req and res handling
 * @todo Error Handling
 */
// 
export class AuthController {

    constructor(
        private authService: AuthService,
        private passwordService: PasswordService
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
     * @todo 3 strikes you're out
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

        const csrfToken = req.session.csrfToken;
        console.log('CSRF token before authentication:', csrfToken);

        const authenticatedUser = await this.authenticateUser(req, res);
        const autheticatedSantizedUser = sanitizeUser(authenticatedUser);
        
        console.log('Restoring CSRF token after session regeneration');
        req.session.csrfToken = csrfToken;
        
        // Force save the session with the restored token
        await new Promise<void>((resolve, reject) => {
            req.session.save((err) => {
                if (err) {
                    console.error('Failed to save session with restored CSRF token:', err);
                    reject(err);
                } else {
                    console.log('Session saved with restored CSRF token: ', req.session.csrfToken);
                    resolve();
                }
            });
        });
        const responseData = await this.authService.userLogin(autheticatedSantizedUser);


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

        const csrfToken = req.session.csrfToken;
        console.log('CSRF token before logout:', csrfToken);
        
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

        // still needed?
        res.clearCookie('XSRF-TOKEN', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict'
        });
        
        // regenerating to maintain csrfToken
        await new Promise<void>((resolve, reject) => {
            req.session.regenerate((error) => {
                if (error) return reject(error);
                
                req.session.csrfToken = csrfToken;
                
                req.session.save((saveErr) => {
                    if (saveErr) return reject(saveErr);
                    resolve();
                });
            });
        });
        req.session.csrfToken = csrfToken;

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
                console.log('authenticating: ', error)
                if (error) {
                    return reject(new ServerError('authenticateUsererror', { location: 'authController.authenticateUser' }, ErrorCode.PASSPORT_FAILED));
                }
                if (!user) {
                    return reject(new UnauthorizedError(info.message, { location: 'authController.authenticateUser' }, ErrorCode.PASSPORT_UNAUTH));
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
