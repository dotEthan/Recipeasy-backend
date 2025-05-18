import { NextFunction, Request, Response } from "express";
import { UserRoles } from "../enums";
import { BadRequestError, ForbiddenError } from "../errors";
import { ErrorCode } from "../types/enums";
import { RECIPE_FILE_MAX_SIZE } from "../constants";

/**
 * Validate Image Upload Data
 * @param {Request, Response, Next} - The usual three from the call being wrapped 
 * @returns {Void} - Nothing, calls res as needed.
 * @example
 * import validateImageUpload = './validateImageUpload';
 * app.user(validateImageUpload);
 */  
export const validateImageUpload = (req: Request, res: Response, next: NextFunction): void => {


    if (req.user?.role === UserRoles.testMode) throw new ForbiddenError(
        'User role not allowed to upload',
        { location: 'validateImageUpload.validateImageUpload', role: req.user.role},
        ErrorCode.USER_ROLE_FORBIDDEN
    )

    if (req.file && req.file?.size > RECIPE_FILE_MAX_SIZE) throw new BadRequestError(
        'File size too large. 5mb limit',
        { location: 'validateImageUpload.validateImageUpload', fileSize: req.file?.size },
        ErrorCode.FILE_TOO_LARGE
    )

    next();
}