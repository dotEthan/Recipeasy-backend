import { NextFunction, Request, Response } from "express";
import { AppError, BadRequestError, ServerError, UnknownError } from "../errors";
import { ErrorCode } from "../types/enums";
import { ZodError } from "zod";
import { MongoServerError } from "mongodb";

// eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
export const catchAsyncError = (fn: Function) => {
    return (req: Request, res: Response, next: NextFunction) => {
        Promise.resolve(fn(req, res, next)).catch((error: unknown) => {
            
            if (error instanceof AppError) {
                return next(error);
            }

            if (error instanceof ZodError) {
                const validationError = new BadRequestError(
                    `Bow Before Zod! Validation Error: ${error.message}`, 
                    { 
                        location: 'catchAsyncError', 
                        originalError: error,
                    }, 
                    ErrorCode.ZOD_VALIDATION_ERR
                );

                return next(validationError);
            }

            if(error instanceof MongoServerError) {
                let newError;
                if (error.code === 8000) {
                    newError = new ServerError(
                        'Database req malformed or missing values', 
                        { location: 'catchAsyncError', originalError: error },
                        ErrorCode.MONGODB_CALL_FAILED,
                    );
                } else {
                    newError = new ServerError(
                        'Unknonwn Error Thrown', 
                        { location: 'catchAsyncError', originalError: error },
                        ErrorCode.UNHANDLED_ERROR,
                    );
                }
                return next(newError);
            }

            if(error instanceof Error) {
                const unknownError = new UnknownError(
                    'Unknonwn Error Thrown', 
                    { location: 'catchAsyncError', originalError: error },
                    ErrorCode.UNHANDLED_ERROR
                );
                return next(unknownError);
            }

            next(new UnknownError(
                `non-error based rejection: ${String(error)}`,
                { location: 'catchAsyncError', originalError: { error } },
                ErrorCode.UNHANDLED_NON_ERROR_REJECTION
            ));
        });
        
    }
}