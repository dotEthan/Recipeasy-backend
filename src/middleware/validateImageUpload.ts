import { NextFunction, Request, Response } from "express";
import { UserRoles } from "../enums";

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

    if (!req.isAuthenticated()) res.status(401).json('User not logged in');

    if (req.user?.role === UserRoles.testMode) res.status(403).json('User not allowed to upload');

    console.log('fileSize: ', req.file?.size);

    console.log('image upload Validated');
    next();
}