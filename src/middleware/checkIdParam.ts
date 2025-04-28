import { NextFunction, Request, Response } from "express";
import { BadRequestError } from "../errors";
import { ErrorCode } from "../types/enums";

/**
 * checkIdParam Middleware to ensure routes that need :id, has it
 * @constructor
 * @param {}
 */
export const checkIdParam = () =>  (req: Request, res: Response, next: NextFunction): void => {
    if (
        !req.params.id ||
        // NOTE: req.params.id will at times pick up the word previous to :id when the :id is missing
        // more testing needed to confirm exact behaviour
         req.params.id === "image" ||
         req.params.id === 'recipes' ||
         req.params.id === 'users' 
    ) {
        throw new BadRequestError(
            'Client must supply resource ID for this route',
            { location: 'checkIdParam req middleware' },
            ErrorCode.RESOURCE_ID_PARAM_MISSING
        )
    }
    next();
};