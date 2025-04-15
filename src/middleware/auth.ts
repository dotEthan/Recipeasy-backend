import { NextFunction, Response, Request } from "express";
/**
 * isAuthorized Middleware to ensure only those who should have access, do
 * @constructor
 * @param {}
 */
export const isAuthenticated = () =>  (req: Request, res: Response, next: NextFunction) => {
  if (req.isAuthenticated()) {
    console.log('User Autheticated: ', req.user._id)
    next();
    return;
  }

  res.status(401).json({success: false, message: 'User not Autheticated. Please re-login'});
};