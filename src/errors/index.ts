export class AppError extends Error {

  constructor(
    message: string,
    public readonly context: unknown,
    public readonly statusCode: number,
    public readonly isOperational: boolean = true,
  ) {
    super(message);
    Error.captureStackTrace(this, this.constructor);
  }
}
export class BadRequestError extends AppError {
  constructor(
    message: string = "Bad request Error - No Message", 
    context: unknown = null,
    isOperational: boolean = true
  ) {
      super(message, context, 400, isOperational);
  }
}

export class UnauthorizedError extends AppError {
  constructor(
    message: string = "Unauthorized Error - No Message", 
    context: unknown = null,
    isOperational: boolean = true
  ) {
    super(message, context, 401, isOperational);
  }
}

export class ForbiddenError extends AppError {
  constructor(
    message: string = "User Role Forbidden Error - No Message", 
    context: unknown = null,
    isOperational: boolean = true
  ) {
    super(message, context, 403, isOperational);
  }
}

export class NotFoundError extends AppError {
  constructor(
    message: string = "Resource Not Found Error - No Message", 
    context: unknown = null,
    isOperational: boolean = true
  ) {
    super(message, context, 404, isOperational);
  }
}

export class ConflictError extends AppError {
  constructor(
    message: string = "Data Conflict Error - No Message", 
    context: unknown = null,
    isOperational: boolean = true
  ) {
    super(message, context, 409, isOperational);
  }
}

export class ServerError extends AppError {
  constructor(
    message: string = "Internal Server Error - No Message", 
    context: unknown = null,
    isOperational: boolean = true
  ) {
    super(message, context, 500, isOperational);
  }
}

export class LogOnlyError extends AppError {
  constructor(
    message: string = "Log Only Error - No Message", 
    context: unknown = null,
    isOperational: boolean = true
  ) {
    super(message, context, 418, isOperational);
  }
}