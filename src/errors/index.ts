export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}
export class BadRequestError extends AppError {
  constructor(message: string = "Bad request Error - No Message") {
      super(message, 400);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = "Unauthorized Error - No Message") {
      super(message, 401);
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = "Forbidden - No Message") {
    super(message, 403);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = "Not Found - No Message") {
    super(message, 404);
  }
}

export class ConflictError extends AppError {
  constructor(message: string = "Conflict - No Message") {
    super(message, 409);
  }
}

export class ServerError extends AppError {
  constructor(message: string = "Server Error - No Message") {
    super(message, 500);
  }
}