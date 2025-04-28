import { ErrorCode } from "../types/enums";
import { ErrorContext } from "../types/error";

export class AppError extends Error {
  public readonly timestamp: string;
  public readonly errorCode: ErrorCode;
  public readonly context: ErrorContext;
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(
    message: string,
    context: ErrorContext,
    statusCode: number,
    errorCode: ErrorCode = ErrorCode.SERVER_DEFAULT,
    isOperational: boolean = true,
  ) {
    super(message);
    this.errorCode = errorCode;
    this.context = context;
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.timestamp = new Date().toISOString();
    Error.captureStackTrace(this, this.constructor);
  }

  toJSON() {
    return {
      error: this.message,
      errorCode: this.errorCode,
      statusCode: this.statusCode,
      timestamp: this.timestamp,
      ...(process.env.NODE_ENV === 'development' && {
        context: this.context,
        stack: this.stack
      })
    };
  }
}

export class BadRequestError extends AppError {
  constructor(
    message: string = "Bad request Error - No Message", 
    context: ErrorContext = {},
    errorCode: ErrorCode = ErrorCode.BAD_REQUEST_DEFAULT,
    isOperational: boolean = true
  ) {
      super(message, context, 400, errorCode, isOperational);
  }
}

export class UnauthorizedError extends AppError {
  constructor(
    message: string = "Unauthorized Error - No Message", 
    context: ErrorContext = {},
    errorCode: ErrorCode = ErrorCode.UNAUTH_DEFAULT,
    isOperational: boolean = true
  ) {
    super(message, context, 401, errorCode, isOperational);
  }
}

export class ForbiddenError extends AppError {
  constructor(
    message: string = "User Role Forbidden Error - No Message", 
    context: ErrorContext = {},
    errorCode: ErrorCode = ErrorCode.FORBID_DEFAULT,
    isOperational: boolean = true
  ) {
    super(message, context, 403, errorCode, isOperational);
  }
}

export class NotFoundError extends AppError {
  constructor(
    message: string = "Resource Not Found Error - No Message", 
    context: ErrorContext = {},
    errorCode: ErrorCode = ErrorCode.NOT_FOUND_DEFAULT,
    isOperational: boolean = true
  ) {
    super(message, context, 404, errorCode, isOperational);
  }
}

export class ConflictError extends AppError {
  constructor(
    message: string = "Data Conflict Error - No Message", 
    context: ErrorContext = {},
    errorCode: ErrorCode = ErrorCode.CONFLICT_DEFAULT,
    isOperational: boolean = true
  ) {
    super(message, context, 409, errorCode, isOperational);
  }
}

export class ServerError extends AppError {
  constructor(
    message: string = "Internal Server Error - No Message", 
    context: ErrorContext = {},
    errorCode: ErrorCode = ErrorCode.SERVER_DEFAULT,
    isOperational: boolean = true
  ) {
    super(message, context, 500, errorCode, isOperational);
  }
}

export class LogOnlyError extends AppError {
  constructor(
    message: string = "Log Only Error - No Message", 
    context: ErrorContext = {},
    errorCode: ErrorCode = ErrorCode.LOG_ONLY_DEFAULT,
    isOperational: boolean = true
  ) {
    super(message, context, 42, errorCode, isOperational);
  }
}

export class UnknownError extends AppError {
  constructor(
    message: string = "Unknown Error - No Message", 
    context: ErrorContext = {},
    errorCode: ErrorCode = ErrorCode.UNKNONWN_DEFAULT,
    isOperational: boolean = true
  ) {
    super(message, context, 500, errorCode, isOperational);
  }
}