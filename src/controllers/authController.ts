import { Request, Response } from "express";
import passport, { AuthenticateOptions } from "passport";
import jwt from 'jsonwebtoken';

import { AuthService } from "../services/authService";
import { PasswordService } from "../services/passwordService";
import { sanitizeUser } from "../util/sanitizeUser";
import { TokenService } from "../services/tokenService";

import { FeUser, User } from "../types/user";
import { FeUserSchema, LoginResSchema } from "../schemas/user.schema";
import { BadRequestError, ServerError, UnauthorizedError } from "../errors";
import { ErrorCode } from "../types/enums";
import { ensureObjectId } from "../util/ensureObjectId";
import { DecodedRefreshToken } from "../types/utiil";
import { zodValidationWrapper } from "../util/zodParseWrapper";

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
            ErrorCode.ID_PARAM_MISSING
        )

        const registeredUser = await this.authService.registerNewUser(displayName, email.toLowerCase(), password);

        zodValidationWrapper(FeUserSchema, registeredUser, 'authController.register');
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
            { 
                body: req.body,
                details: 'Email or password missing'
            },
            ErrorCode.REQ_BODY_DATA_MISSING
        );

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

        zodValidationWrapper(LoginResSchema, responseData, 'authController.login');
        res.status(200).json({...responseData, accessToken });

        await this.authService.logLoginAttempt(req, ensureObjectId(responseData.user._id), true);
    }

    /**
     * User Log out
     * @group User Session - Ends Session
     * @return  {StandardResponse} success, message, data, error - Stardard response for generic calls
     * @throws {BadRequestError} 400 - User Already logged out
     */
    public logUserOut = async (req: Request, res: Response) => {

        // delete refresh-token from DB
        await new Promise<void>((resolve, reject) => {
            req.logOut((error) => {
                if (error) return reject(error);
                resolve();
            });
        });
        
        const refreshToken = req.cookies['__Host-refreshToken'];
        
        if (!refreshToken) throw new UnauthorizedError('Token missing from header, relogin', { location: 'adminController.refreshAccessToken' }, ErrorCode.TOKEN_MISSING);
        
        const refreshSecret = process.env.JWT_REFRESH_SECRET;
        if (!refreshSecret) throw new ServerError(
            'Missing JWT_SECRET in Env', 
            { 
                location: 'createToken.ts',
                details: 'JWT_SECRET missing'
            }, 
            ErrorCode.ENV_VAR_MISSING);

        const decodedToken = jwt.verify(refreshToken, refreshSecret) as DecodedRefreshToken;
        if (!refreshToken) throw new BadRequestError('User Already Logged Out', { location: 'authController.logUserOut' }, ErrorCode.USER_ALREADY_LOGGED_OUT);

        this.tokenService.deleteOldTokenIfExists(decodedToken.tokenId);

        // Leaving in case sessions come back with social media logins
        // res.clearCookie('recipeasy.sid', {
        //     httpOnly: true,
        //     secure: process.env.NODE_ENV === 'production',
        //     sameSite: 'lax'
        // });

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
     * Passport's authenticate User
     * @group Authorization - Autheticates User
     * @return  {StandardUserResponse} success, message, data, error - Stardard response for generic calls
     * @throws {ZodError} 401 - Validation failed
     * @throws {PassportErrors} 401 - Validation failed
     */
    private authenticateUser = (req: Request, res: Response): Promise<User> => {
        const passportOptions = {
            session: false,
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

                resolve(user); 
            })(req, res);
        })
    }
    
}
