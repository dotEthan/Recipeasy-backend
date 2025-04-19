import { NextFunction, Request, Response } from "express";

// eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
export const catchAsyncError = (fn: Function) => {
    return (req: Request, res: Response, next: NextFunction) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    }
}