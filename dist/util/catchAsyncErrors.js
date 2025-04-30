"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.catchAsyncError = void 0;
const errors_1 = require("../errors");
const enums_1 = require("../types/enums");
const zod_1 = require("zod");
const mongodb_1 = require("mongodb");
// eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
const catchAsyncError = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch((error) => {
            if (error instanceof errors_1.AppError) {
                return next(error);
            }
            if (error instanceof zod_1.ZodError) {
                const validationError = new errors_1.BadRequestError(`Bow Before Zod! Validation Error: ${error.message}`, {
                    location: 'catchAsyncError',
                    originalError: error,
                }, enums_1.ErrorCode.ZOD_VALIDATION_ERR);
                return next(validationError);
            }
            if (error instanceof mongodb_1.MongoServerError) {
                let newError;
                if (error.code === 8000) {
                    newError = new errors_1.ServerError('Database req malformed or missing values', { location: 'catchAsyncError', originalError: error }, enums_1.ErrorCode.MONGODB_CALL_FAILED);
                }
                else {
                    newError = new errors_1.ServerError('Unknonwn Error Thrown', { location: 'catchAsyncError', originalError: error }, enums_1.ErrorCode.UNHANDLED_ERROR);
                }
                return next(newError);
            }
            if (error instanceof Error) {
                const unknownError = new errors_1.UnknownError('Unknonwn Error Thrown', { location: 'catchAsyncError', originalError: error }, enums_1.ErrorCode.UNHANDLED_ERROR);
                return next(unknownError);
            }
            next(new errors_1.UnknownError(`non-error based rejection: ${String(error)}`, { location: 'catchAsyncError', originalError: { error } }, enums_1.ErrorCode.UNHANDLED_NON_ERROR_REJECTION));
        });
    };
};
exports.catchAsyncError = catchAsyncError;
