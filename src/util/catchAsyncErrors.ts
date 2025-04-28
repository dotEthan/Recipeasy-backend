import { NextFunction, Request, Response } from "express";
import { AppError, BadRequestError, UnknownError } from "../errors";
import { ErrorCode } from "../types/enums";
import { ZodError } from "zod";

// eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
export const catchAsyncError = (fn: Function) => {
    return (req: Request, res: Response, next: NextFunction) => {
        Promise.resolve(fn(req, res, next)).catch((error: unknown) => {
            
            if (error instanceof AppError) {
                next(error);
            }

            if (error instanceof ZodError) {
                const validationError = new BadRequestError(
                    'Bow before Zod! Validation failed', 
                    { 
                        location: 'catchAsyncError', 
                        originalError: error,
                    }, 
                    ErrorCode.ZOD_VALIDATION_ERR
                );

                return next(validationError);
            }

            if(error instanceof Error) {
                const unknownError = new UnknownError(
                    'Unknonwn Error Thrown', 
                    { location: 'catchAsyncError', originalError: error },
                    ErrorCode.UNHANDLED_ERROR
                );
                next(unknownError);
            }

            next(new UnknownError(
                `non-error based rejection: ${String(error)}`,
                { location: 'catchAsyncError', originalError: { error } },
                ErrorCode.UNHANDLED_NON_ERROR_REJECTION
            ));
        });
        
    }
}