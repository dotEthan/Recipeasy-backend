import csurf from 'csurf';
import { Request, Response, NextFunction } from 'express';
import { CsurfErrorType } from '../types/error';
import { ForbiddenError } from '../errors';
import { ErrorCode } from '../types/enums';

export const csrfProtection = csurf({ cookie: true });
 
export const csrfErrorHandler = (error: CsurfErrorType, req: Request, res: Response, next: NextFunction) => {

  const csrfError = new ForbiddenError(
    'CSRF token Mismatch',
    { location: 'csrfErrorHandler', originalError: error },
    ErrorCode.CSRF_TOKEN_MISMATCH
  );
  next(csrfError);

};