import { NextFunction, Request, Response } from "express";

/**
 * checkIdParam Middleware to ensure routes that need :id, has it
 * @constructor
 * @param {}
 */
export const checkIdParam = () =>  (req: Request, res: Response, next: NextFunction): void => {
    console.log('checking params: ', req.params.id);
    if (
        !req.params.id ||
        // NOTE: req.params.id will at times pick up the word previous to :id when the :id is missing
        // more testing needed to confirm exact behaviour
         req.params.id === "image" ||
         req.params.id === 'recipes' ||
         req.params.id === 'users' 
    ) {
        res.status(400).json({ error: "Invalid image ID" });
        return;
    }
    next();
};