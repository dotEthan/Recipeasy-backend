import { NextFunction, Response, Request } from "express";
import { ForbiddenError } from "../errors";
import { ErrorCode } from "../types/enums";

export const checkSecurityHeaders = (req: Request, res: Response, next: NextFunction) => {
  res.set({
    'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Content-Security-Policy': "default-src 'self'",
    'Referrer-Policy': 'strict-origin-when-cross-origin'
  });

  // Request validation (for production)
  if (process.env.NODE_ENV === 'production') {
    if (!req.secure) {
      return next(new ForbiddenError(
        'SSL required',
        { location: 'securityHeaders middleware' },
        ErrorCode.INSECURE_CONNECTION
      ));
    }
  }
  
  next();
};