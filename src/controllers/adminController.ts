import { Request, Response } from "express";
import jwt from 'jsonwebtoken';

import { PasswordService } from "../services/passwordService";
import { ErrorCode, TokenTypes } from "../types/enums";
import { StandardResponseSchema } from "../schemas/shared.schema";
import { ensureObjectId } from "../util/ensureObjectId";
import { BadRequestError, ServerError, UnauthorizedError } from "../errors";
import { UserService } from "../services/userService";
import { EmailVerificationService } from "../services/emailVerificationService";
import { TokenService } from "../services/tokenService";
import { DecodedRefreshToken } from "../types/utiil";
import { zodValidationWrapper } from "../util/zodParseWrapper";

/**
 * Administration based req and res handling
 */

export class AdminController {

    constructor(
        private passwordService: PasswordService, 
        private userService: UserService, 
        private emailVerificationService: EmailVerificationService,
        private tokenService: TokenService
    ) { }

    /**
     * Check and refresh security token
     * @group Security - token mananagement
     * @param {Request} req - request
     * @param {Response} res - response
     * @returns {SuccessResponse} 200 - Verification successful
     * @throws {UnauthorizedError} 401 - Token missing or malformed, mismatched, or user not found
     * @produces application/json
     */
    public refreshAccessToken = async (req: Request, res: Response) => {
        const headerToken = req.cookies['__Host-refreshToken'];
        if (!headerToken) throw new UnauthorizedError('Token missing from header, relogin', { location: 'adminController.refreshAccessToken' }, ErrorCode.TOKEN_MISSING);
        
        const refreshSecret = process.env.JWT_REFRESH_SECRET;
        if (!refreshSecret) throw new ServerError('Missing JWT_SECRET in Env', { location: 'createToken.ts' }, ErrorCode.UNSET_ENV_VARIABLE);

        const decodedToken = jwt.verify(headerToken, refreshSecret) as DecodedRefreshToken;
        if (!decodedToken) throw new UnauthorizedError('Decoded token malformed, relogin', { location: 'adminController.refreshAccessToken' }, ErrorCode.TOKEN_MALFORMED);

        const userId = decodedToken.userId;
        if (!userId) throw new UnauthorizedError('Token missing userId, relogin', { location: 'adminController.refreshAccessToken' }, ErrorCode.TOKEN_MALFORMED);

        const user = await this.userService.findUserById(ensureObjectId(userId));
        if (!user) throw new UnauthorizedError('Token userId invalid, relogin', { location: 'adminController.refreshAccessToken' }, ErrorCode.TOKEN_MALFORMED);

        await this.tokenService.deleteOldTokenIfExists(decodedToken.tokenId);
        const [ accessToken, refreshToken ] = await this.tokenService.createUserTokens(user);
        
        res.cookie('__Host-refreshToken', refreshToken, {
            httpOnly: true,
            secure: true,
            sameSite: 'strict',
            path: '/',
            maxAge: 604800 * 1000
        });
        res.status(201).json({ accessToken });
    }
    
    /**
     * Request to start User password reset flow
     * @group Admin - Password Reset Request
     * @param {string} req.body.email - User's email
     * @param {Response} userId - User's _id
     * @return  {StandardResponse} success, message, data, error - Stardard response for generic calls
     * @throws  {BadRequestError} 400 - If client didn't attach email to req
     */
    public resetPasswordRequest =  async (req: Request, res: Response): Promise<void> => {
        const email: string = req.body.email;
        if (!email) throw new BadRequestError(
            'resetPasswordRequest - email missing from req.body', 
            { body: req.body },
            ErrorCode.MISSING_REQUIRED_BODY_DATA
        );
        const passwordReset = await this.passwordService.startPasswordResetFlow(email);

        zodValidationWrapper(StandardResponseSchema, passwordReset, 'adminController.resetPasswordRequest');
        res.status(201).json(passwordReset); 
    }

    /**
     * Validate if password token provided by FrontEnd.
     * @group Admin - Password Reset Request
     * @param {Request} req.body.token - User's token
     * @return  {StandardResponse} success, message, data, error - Stardard response for generic calls
     * @throws  {BadRequestError} 400 - If client didn't attach code to req
     */
    public validatePasswordToken = async (req: Request, res: Response) => {
        const token = req.body.code;
        if (!token) throw new BadRequestError(
            'resetPasswordRequest - code missing from req.body', 
            { body: req.body, location: "adminController.validatePasswordToken" },
            ErrorCode.MISSING_REQUIRED_BODY_DATA
        );
        const response = await this.passwordService.validatePasswordToken(token, TokenTypes.PASSWORD_RESET);

        zodValidationWrapper(StandardResponseSchema, response, 'adminController.validatePasswordToken');
        res.status(200).json(response);
    }

    /**
     * Reset Password Flow - change password and delete resetPasswordData
     * @group Admin - Password Reset Request
     * @param {Request} req.body.token - User's token
     * @param {Request} req.body.password - User's new password
     * @return  {StandardResponse} success, message, data, error - Stardard response for generic calls
     * @throws  {BadRequestError} 400 - If client didn't attach code or password to req
     */
    public finishPasswordResetRequest = async (req: Request, res: Response) => {
        const { code: token, password } = req.body;
        if (!token || !password) throw new BadRequestError(
            'resetPasswordRequest - code or password missing from req.body', 
            { body: req.body, location: "adminController.finishPasswordResetRequest" },
            ErrorCode.MISSING_REQUIRED_BODY_DATA
        );
        const success = await this.passwordService.passwordResetFinalStep(token, password);

        zodValidationWrapper(StandardResponseSchema, success, 'adminController.finishPasswordResetRequest');
        res.status(201).json({ success });
    }

    /**
     * Check client token for email Verification
     * @todo - post - Retry emails? 
     * @group Admin - Email Verfication Validation
     * @param {string} req.body.code - User's email verification code
     * @param {Response} userId - User's _id
     * @return  {StandardResponse} 200 - success - Should always be true
     * @throws  {BadRequestError} 400 - Code to verify not present
     * @throws  {UnauthorizedError} 401 - no req.user || req.session.unverifiedUserId (new user)
     */
    public verifyCode = async (req: Request, res: Response): Promise<void> => {
        const code = req.body.code as string;
        const userEmail = req.body.userEmail;
        if (!userEmail) throw new BadRequestError(
            'User email missing, relogin',
            { location: 'adminController.verifyCode'},
            ErrorCode.MISSING_REQUIRED_BODY_DATA
        );
        if (!code) throw new BadRequestError(
            'Code not present', 
            { code, userEmail,  location: 'adminController.verifyCode' },
            ErrorCode.MISSING_REQUIRED_BODY_DATA
        )

        const { isVerified, userId } = await this.emailVerificationService.checkVerificationCode(userEmail, code);

        // Get Userid from code data or db call
        if (isVerified) {
            this.userService.setUserVerified(userId);
            this.emailVerificationService.deleteVerificationCode(userId);
        }

        const verifyRes = {success: isVerified};
        zodValidationWrapper(StandardResponseSchema, verifyRes, 'adminController.verifyCode');
        res.status(200).json(verifyRes); 
    }

}