import { NextFunction, Request, Response } from "express";
import { AppError } from "../util/appError";
import { ZodError } from "zod";
import { MongoError } from "mongodb";

/**
 * Global Error Handler Middleware
 * @todo Refactor all throw new error() to use
 * @param {Error/AppError} - Error thrown 
 * @param {Request, Response, Next} - The usual three from the call being wrapped 
 * @returns {Void} - Nothing, calls res as needed.
 * @example
 * import errorHandler = './errorHandler';
 * app.user(errorHandler);
 */  

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const errorHandler = (error: Error | AppError, req: Request, res: Response, next: NextFunction) => {
    let statusCode: number = 500;
    let message = 'Internal Server Error';
    let errorDetails = {};

    console.log(`name: ${error.name} message: ${error.message} stack: ${error.stack}`);
    console.log('error handler: ');

    if ('statusCode' in error) {
        statusCode = error.statusCode || 500;
        message = error.message;
    } else if (error instanceof ZodError) {
        statusCode = 400;
        message = 'Validation Error';
        errorDetails = error.format();
    } else if (error instanceof MongoError) {
        statusCode = 400;
        message = 'Validation Error';

        if (error.code === 11000) {
            statusCode = 409;
            message = 'Duplicate Key Error';            
        }
        if (error.code === 112) {
            statusCode = 409;
            message = 'Database Write Conflict';            
        }
        if (error.code === 211 || error.code === 11600) {
            statusCode = 409;
            message = 'Database Unreachable (Config or Shutdown)';            
        }
    } else if (error.name === 'UnauthorizedError') {
        statusCode = 401;
        message = 'Authetication Error';
    }

    const isProduction = process.env.NODE_ENV = 'production';
    const resError = {
        status: statusCode,
        message,
        ...(statusCode === 400 && {details: errorDetails}),
        ...((!isProduction && {stack: error.stack}) || {})
    }

    console.log('error handler done: ');
    res.status(statusCode).json({ error: resError });
    return;
}