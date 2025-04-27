import { Request, Response } from "express";

import { PasswordService } from "../services/passwordService";
import { TokenTypes } from "../types/enums";
import { StandardResponseSchema } from "../schemas/shared.schema";
import { ensureObjectId } from "../util/ensureObjectId";
import { BadRequestError, ForbiddenError, UnauthorizedError } from "../errors";
import { UserService } from "../services/userService";
import { EmailVerificationService } from "../services/emailVerificationService";

/**
 * Administration based req and res handling
 */

export class AdminController {

    constructor(private passwordService: PasswordService, private userService: UserService, private emailVerificationService: EmailVerificationService) { }

    /**
     * Gets Csurf token for user
     * @group Security - user tracking
     * @param {VerifyCodeRequest} request.body.required - Code and user identifier
     * @returns {SuccessResponse} 200 - Verification successful
     * @produces application/json
     */
    public getCsurf = (req: Request, res: Response) => {
        const csrfToken = req.csrfToken();
        res.header('X-CSRF-Token', csrfToken); 
        res.status(200).json({success: true});
    }
    
    /**
     * Request to start User password reset flow
     * @group Security - Bot repellant
     * @param {string} req.body.email - User's email
     * @param {Response} userId - User's _id
     * @return  {StandardResponse} success, message, data, error - Stardard response for generic calls
     * @throws  {ServerError} If email fails to send
     */
    public resetPasswordRequest =  async (req: Request, res: Response): Promise<void> => {
        const email: string = req.body.email;
        const passwordReset = await this.passwordService.startPasswordResetFlow(email);

        StandardResponseSchema.parse(passwordReset);
        res.status(201).json(passwordReset); 
    }

    /**
     * Validate if password token provided by FrontEnd.
     * @group Security - Bot repellant
     * @param {Request} req.body.token - User's token
     * @return  {StandardResponse} success, message, data, error - Stardard response for generic calls
     */
    public validatePasswordToken = async (req: Request, res: Response) => {
        const token = req.body.code;
        const response = await this.passwordService.validatePasswordToken(token, TokenTypes.PasswordReset);

        StandardResponseSchema.parse(response);
        res.status(200).json(response);
    }

    /**
     * Reset Password Flow - change password and delete resetPasswordData
     * @todo thin this out. Move logic to services
     * @group Security - Bot repellant
     * @param {Request} req.body.token - User's token
     * @param {Request} req.body.password - User's new password
     * @return  {StandardResponse} success, message, data, error - Stardard response for generic calls
     */
    public finishPasswordResetRequest = async (req: Request, res: Response) => {
        const { code: token, newPassword } = req.body;
        const success = await this.passwordService.passwordResetFinalStep(token, newPassword);

        StandardResponseSchema.parse(success);
        res.status(201).json({ success });
    }

    /**
     * Check client token for email Verification
     * @todo 3 strikes you're out
     * @group Authorization - Email Verfication Validation
     * @param {string} req.body.code - User's email verification code
     * @param {Response} userId - User's _id
     * @return  {StandardResponse} 200 - success - Should always be true
     * @throws  {BadRequestError} 400 - Code to verify not present
     * @throws  {UnauthorizedError} 401 - no req.user || req.session.unverifiedUserId (new user)
     * @throws  {ForbiddenError} 403 - Code verification failed
     */
    public verifyCode = async (req: Request, res: Response): Promise<void> => {
        const code = req.body.code as string;
        const currentUserId = req.session.unverifiedUserId || req.user?._id;
        if (!currentUserId) throw new UnauthorizedError('User Session Ended, please log in again');
        if (!code) throw new BadRequestError('verifyCode - Code not present', { code, currentUserId})

        const userId = ensureObjectId(currentUserId);
        const verified = await this.emailVerificationService.checkVerificationCode(userId, code);
        if (!verified) {
            throw new ForbiddenError('Code Verification Failed', { code, userId });
        }

        this.userService.setUserVerified(userId);
        this.emailVerificationService.deleteVerificationCode(userId);

        const verifyRes = {success: verified};
        StandardResponseSchema.parse(verifyRes);
        res.status(200).json(verifyRes); 
    }

}