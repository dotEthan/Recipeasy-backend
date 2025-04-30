import { NextFunction, Response, Request } from "express";
import { UnauthorizedError } from "../errors";
import { ErrorCode } from "../types/enums";
/**
 * isAuthorized Middleware to ensure user is logged in and session active
 * @constructor
 * @param {}
 */
export const isAuthenticated = () =>  (req: Request, res: Response, next: NextFunction) => {
  if (req.isAuthenticated()) {
    next();
    return;
  }

  throw new UnauthorizedError(
    'User not Autheticated. Please re-login',
    { location: 'middleware.auth.isAutheticated'},
    ErrorCode.USER_NOT_AUTHETICATED
  )
};
