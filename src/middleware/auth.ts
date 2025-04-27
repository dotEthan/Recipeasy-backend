import { NextFunction, Response, Request } from "express";
/**
 * isAuthorized Middleware to ensure user is logged in and session active
 * @todo figure out full middleware checks
 * @constructor
 * @param {}
 */
export const isAuthenticated = () =>  (req: Request, res: Response, next: NextFunction) => {
  if (req.isAuthenticated()) {
    console.log('User Authenticated: ', req.user._id)
    next();
    return;
  }

  res.status(401).json({success: false, message: 'User not Autheticated. Please re-login'});
};

/**
 * hasOwnership Middleware to ensure resource is owned by user
 * @constructor
 * @param {}
 */
export const hasOwnership = () =>  (req: Request, res: Response, next: NextFunction) => {
  if (req.isAuthenticated()) {
    console.log('User Authenticated: ', req.user._id)
    next();
    return;
  }

  res.status(401).json({success: false, message: 'Resource owner not User.'});
};