"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const errors_1 = require("../errors");
const zod_1 = require("zod");
const mongodb_1 = require("mongodb");
const enums_1 = require("../types/enums");
/**
 * Global Error Handler Middleware
 * @todo - post - Refactor all throw new error() to use
 * @todo - post - handle MongoDB erorr codes
 * @todo - post - log login attempts and more
 * @todo - post - Error Stack implementation in development
 * @param {Error/AppError} - Error thrown
 * @param {Request, Response, Next} - The usual three from the call being wrapped
 * @returns {Void} - Nothing, calls res as needed.
 * @example
 * import errorHandler = './errorHandler';
 * app.user(errorHandler);
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const errorHandler = (error, req, res, next) => {
    var _a;
    let statusCode = 500;
    let message = 'Internal Server Error';
    let errorDetails = {};
    let errorCode = enums_1.ErrorCode.SERVER_DEFAULT;
    // console.log(`name: ${error.name} message: ${error.message} stack: ${error.stack}`);
    console.error('Error Handler error: ', error);
    if (error instanceof errors_1.AppError) {
        statusCode = error.statusCode;
        errorCode = (_a = error.errorCode) !== null && _a !== void 0 ? _a : enums_1.ErrorCode.SERVER_DEFAULT;
        message = error.message;
    }
    else if (error instanceof zod_1.ZodError) {
        statusCode = 400;
        message = 'Validation Error';
        errorDetails = error.format();
    }
    else if (error instanceof mongodb_1.MongoError) {
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
    }
    else if (error instanceof jsonwebtoken_1.default.JsonWebTokenError) {
        statusCode = 401;
        message = 'Invalid Token';
    }
    else if (error instanceof jsonwebtoken_1.default.TokenExpiredError) {
        statusCode = 401;
        message = 'Password reset token has expired';
    }
    else {
        console.error('Unhandled error type', error);
    }
    // TODO Get the error.stack working for
    // const isProduction = process.env.NODE_ENV = 'production';
    // const stack = (error.stack) ? {} : {};
    const resError = Object.assign(Object.assign({ status: statusCode, message,
        errorCode }, (statusCode === 400 && { details: errorDetails })), { stack: {} });
    res.status(statusCode).json({ error: resError });
    return;
};
exports.errorHandler = errorHandler;
