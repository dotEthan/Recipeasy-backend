import csurf from 'csurf';
import { Request, Response, NextFunction } from 'express';
import { CsurfError } from '../types/error';

export const csrfProtection = csurf({ cookie: true });

// TODO figure out err real type or build in /types once 
export const csrfErrorHandler = (err: CsurfError, req: Request, res: Response, next: NextFunction) => {
    console.log('csrf protection HO!', JSON.stringify(err))
  if (err.code !== 'EBADCSRFTOKEN') return next(err);

  // Handle CSRF token errors
  res.status(403).json({ 
    error: 'CSRF token mismatch',
    message: 'Form has been tampered with'
  });
};