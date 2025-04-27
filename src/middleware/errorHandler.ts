import { NextFunction, Request, Response } from "express";
import jwt from 'jsonwebtoken';
import { AppError } from "../errors";
import { ZodError } from "zod";
import { MongoError } from "mongodb";
import { UnauthorizedError } from "../errors";

/**
 * Global Error Handler Middleware
 * @todo Refactor all throw new error() to use
 * @todo log login attempts and more
 * @param {Error/AppError} - Error thrown 
 * @param {Request, Response, Next} - The usual three from the call being wrapped 
 * @returns {Void} - Nothing, calls res as needed.
 * @example
 * import errorHandler = './errorHandler';
 * app.user(errorHandler);
 */  

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const errorHandler = (error: unknown, req: Request, res: Response, next: NextFunction) => {
    let statusCode: number = 500;
    let message = 'Internal Server Error';
    let errorDetails = {};

    // console.log(`name: ${error.name} message: ${error.message} stack: ${error.stack}`);
    console.log('error handler: ', error);

    if (error instanceof AppError) {
        statusCode = error.statusCode;
        message = error.message;
    } else if (error instanceof UnauthorizedError) {
        statusCode = 401;
        message = 'Validation Error';
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
    } else if (error instanceof jwt.JsonWebTokenError) {
        statusCode = 401;
        message = 'Invalid Token'
    } else if (error instanceof jwt.TokenExpiredError) {
        statusCode = 401;
        message = 'Password reset token has expired';
    } else {
        console.log('Unhandled error type', error);
    }

    // TODO Get the error.stack working for
    // const isProduction = process.env.NODE_ENV = 'production';
    // const stack = (error.stack) ? {} : {};
    const resError = {
        status: statusCode,
        message,
        ...(statusCode === 400 && {details: errorDetails}),
       stack: {}
    }

    console.log('error handler done: ');
    res.status(statusCode).json({ error: resError });
    return;
}