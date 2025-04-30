import { Request, Response } from "express";

import { PasswordService } from "../services/passwordService";
import { ErrorCode, TokenTypes } from "../types/enums";
import { StandardResponseSchema } from "../schemas/shared.schema";
import { ensureObjectId } from "../util/ensureObjectId";
import { BadRequestError, UnauthorizedError } from "../errors";
import { UserService } from "../services/userService";
import { EmailVerificationService } from "../services/emailVerificationService";
import { generateCsrfToken } from "../middleware/csrf";

/**
 * Administration based req and res handling
 */

export class AdminController {

    constructor(private passwordService: PasswordService, private userService: UserService, private emailVerificationService: EmailVerificationService) { }

  
    /**
     * Health Check for Render hosting
     * @group Security - Health Check
     * @returns {status} 200 - Healthy
     */
    public healthCheck = (req: Request, res: Response) => { res.sendStatus(200); }

    /**
     * Gets csrf-async token for user
     * @group Security - session tracking
     * @param {VerifyCodeRequest} request.body.required - Code and user identifier
     * @returns {SuccessResponse} 200 - Verification successful
     * @produces application/json
     */
    public getCsurf = (req: Request, res: Response) => {
        const token = generateCsrfToken(req);
        res.header("X-CSRF-Token", token);
        res.json({ token });
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

        StandardResponseSchema.parse(passwordReset);
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

        StandardResponseSchema.parse(response);
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

        StandardResponseSchema.parse(success);
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
        const currentUserId = req.session.unverifiedUserId || req.user?._id;
        if (!currentUserId) throw new UnauthorizedError(
            'User Session Ended, please log in again',
            { location: 'adminController.verifyCode'},
            ErrorCode.USER_SESSION_NOT_FOUND
        );
        if (!code) throw new BadRequestError(
            'verifyCode - Code not present', 
            { code, currentUserId,  location: 'adminController.verifyCode' },
            ErrorCode.MISSING_REQUIRED_BODY_DATA
        )

        const userId = ensureObjectId(currentUserId);
        const verified = await this.emailVerificationService.checkVerificationCode(userId, code);

        if (verified) {
            this.userService.setUserVerified(userId);
            this.emailVerificationService.deleteVerificationCode(userId);
        }

        const verifyRes = {success: verified};
        StandardResponseSchema.parse(verifyRes);
        res.status(200).json(verifyRes); 
    }

}