import { NextFunction, Request, Response } from "express";
import { UserRoles } from "../enums";
import { ForbiddenError, UnauthorizedError } from "../errors";
import { ErrorCode } from "../types/enums";

/**
 * Validate Image Upload Data
 * @todo Get file.size working once req has file
 * @param {Request, Response, Next} - The usual three from the call being wrapped 
 * @returns {Void} - Nothing, calls res as needed.
 * @example
 * import validateImageUpload = './validateImageUpload';
 * app.user(validateImageUpload);
 */  
export const validateImageUpload = (req: Request, res: Response, next: NextFunction): void => {

    if (!req.isAuthenticated()) throw new UnauthorizedError(
        'User not autheticated, relogin',
        { location: 'validateImageUpload.validateImageUpload', autheticated: req.isAuthenticated },
        ErrorCode.USER_NOT_AUTHETICATED
    )

    if (req.user?.role === UserRoles.testMode) throw new ForbiddenError(
        'User role not allowed to upload',
        { location: 'validateImageUpload.validateImageUpload', role: req.user.role},
        ErrorCode.USER_ROLE_FORBIDDEN
    )

    next();
}