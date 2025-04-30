"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UnknownError = exports.LogOnlyError = exports.ServerError = exports.ConflictError = exports.NotFoundError = exports.ForbiddenError = exports.UnauthorizedError = exports.BadRequestError = exports.AppError = void 0;
const enums_1 = require("../types/enums");
class AppError extends Error {
    constructor(message, context, statusCode, errorCode = enums_1.ErrorCode.SERVER_DEFAULT, isOperational = true) {
        super(message);
        this.errorCode = errorCode;
        this.context = context;
        this.statusCode = statusCode;
        this.isOperational = isOperational;
        this.timestamp = new Date().toISOString();
        Error.captureStackTrace(this, this.constructor);
    }
    toJSON() {
        return Object.assign({ error: this.message, errorCode: this.errorCode, statusCode: this.statusCode, timestamp: this.timestamp }, (process.env.NODE_ENV === 'development' && {
            context: this.context,
            stack: this.stack
        }));
    }
}
exports.AppError = AppError;
class BadRequestError extends AppError {
    constructor(message = "Bad request Error - No Message", context = {}, errorCode = enums_1.ErrorCode.BAD_REQUEST_DEFAULT, isOperational = true) {
        super(message, context, 400, errorCode, isOperational);
    }
}
exports.BadRequestError = BadRequestError;
class UnauthorizedError extends AppError {
    constructor(message = "Unauthorized Error - No Message", context = {}, errorCode = enums_1.ErrorCode.UNAUTH_DEFAULT, isOperational = true) {
        super(message, context, 401, errorCode, isOperational);
    }
}
exports.UnauthorizedError = UnauthorizedError;
class ForbiddenError extends AppError {
    constructor(message = "User Role Forbidden Error - No Message", context = {}, errorCode = enums_1.ErrorCode.FORBID_DEFAULT, isOperational = true) {
        super(message, context, 403, errorCode, isOperational);
    }
}
exports.ForbiddenError = ForbiddenError;
class NotFoundError extends AppError {
    constructor(message = "Resource Not Found Error - No Message", context = {}, errorCode = enums_1.ErrorCode.NOT_FOUND_DEFAULT, isOperational = true) {
        super(message, context, 404, errorCode, isOperational);
    }
}
exports.NotFoundError = NotFoundError;
class ConflictError extends AppError {
    constructor(message = "Data Conflict Error - No Message", context = {}, errorCode = enums_1.ErrorCode.CONFLICT_DEFAULT, isOperational = true) {
        super(message, context, 409, errorCode, isOperational);
    }
}
exports.ConflictError = ConflictError;
class ServerError extends AppError {
    constructor(message = "Internal Server Error - No Message", context = {}, errorCode = enums_1.ErrorCode.SERVER_DEFAULT, isOperational = true) {
        super(message, context, 500, errorCode, isOperational);
    }
}
exports.ServerError = ServerError;
class LogOnlyError extends AppError {
    constructor(message = "Log Only Error - No Message", context = {}, errorCode = enums_1.ErrorCode.LOG_ONLY_DEFAULT, isOperational = true) {
        super(message, context, 42, errorCode, isOperational);
    }
}
exports.LogOnlyError = LogOnlyError;
class UnknownError extends AppError {
    constructor(message = "Unknown Error - No Message", context = {}, errorCode = enums_1.ErrorCode.UNKNONWN_DEFAULT, isOperational = true) {
        super(message, context, 500, errorCode, isOperational);
    }
}
exports.UnknownError = UnknownError;
