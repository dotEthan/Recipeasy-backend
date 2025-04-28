import { NextFunction, Response, Request } from "express";
import { UnauthorizedError } from "../errors";
import { ErrorCode } from "../types/enums";
/**
 * isAuthorized Middleware to ensure user is logged in and session active
 * @todo figure out full middleware checks
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

/**
 * hasOwnership Middleware to ensure resource is owned by user
 * @todo create
 * @constructor
 * @param {}
 */
export const hasOwnership = () =>  (req: Request, res: Response, next: NextFunction) => {
  if (req.isAuthenticated()) {
    next();
    return;
  }

  throw new UnauthorizedError(
    'Altered resource not owned by user. Please re-login',
    { location: 'middleware.auth.hasOwnership' },
    ErrorCode.RESOURCE_NOT_USER_OWNED
  );
};