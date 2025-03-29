import csurf from 'csurf';
import { Request, Response, NextFunction } from 'express';
import { CsurfErrorType } from '../types/error';

export const csrfProtection = csurf({ cookie: true });

// TODO figure out err real type or build in /types once 
export const csrfErrorHandler = (err: CsurfErrorType, req: Request, res: Response, next: NextFunction) => {
    console.log('csrf protection HO!', JSON.stringify(err))
  if (err.code !== 'EBADCSRFTOKEN') return next(err);

  // Handle CSRF token errors
  res.status(403).json({ 
    error: 'CSRF token mismatch',
    message: 'Form has been tampered with'
  });
};