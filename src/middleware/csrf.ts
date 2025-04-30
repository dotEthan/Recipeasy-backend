import { csrfSync } from 'csrf-sync'; 
// import csurf from 'csurf';
import { Request, Response, NextFunction } from 'express';

import { CsurfErrorType } from '../types/error';
import { ForbiddenError, UnauthorizedError } from '../errors';
import { ErrorCode } from '../types/enums';

// export const csrfProtection = csurf({ cookie: true });
 
// export const csrfErrorHandler = (error: CsurfErrorType, req: Request, res: Response, next: NextFunction) => {

//   const csrfError = new ForbiddenError(
//     'CSRF token Mismatch',
//     { location: 'csrfErrorHandler', originalError: error },
//     ErrorCode.CSRF_TOKEN_MISMATCH
//   );
//   next(csrfError);

// };

///////////// csrf-sync not working, session failing after first request, change to new or fix
///////////// csrf-sync not working, session failing after first request, change to new or fix
///////////// csrf-sync not working, session failing after first request, change to new or fix
///////////// csrf-sync not working, session failing after first request, change to new or fix
///////////// csrf-sync not working, session failing after first request, change to new or fix
///////////// csrf-sync not working, session failing after first request, change to new or fix
///////////// csrf-sync not working, session failing after first request, change to new or fix
///////////// csrf-sync not working, session failing after first request, change to new or fix
///////////// csrf-sync not working, session failing after first request, change to new or fix
///////////// csrf-sync not working, session failing after first request, change to new or fix
///////////// csrf-sync not working, session failing after first request, change to new or fix

type CsrfSyncedToken = string | undefined | null;

export const csrfMiddleware = (rotateToken: boolean = false) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // explicit csrf saving as updating issues
      if (!req.session) throw new UnauthorizedError(
        'session not available, relogin',
        {location: 'csrf.csrfMiddleware'},
        ErrorCode.USER_SESSION_NOT_FOUND
      )

      if (typeof req.session.csrfToken === 'undefined') {
        generateCsrfToken(req, true);
      }

      csrfSynchronisedProtection(req, res, async (err) => {
        if (err) {
          return csrfErrorHandler(err, req, res, next);
        }

        if (rotateToken) {
          const newToken = generateCsrfToken(req, true);
          res.header('X-CSRF-Token', newToken);
        }
        
        next();
      });
    } catch (error) {
      console.log(error);
    } 
  };
};

const { generateToken, csrfSynchronisedProtection } = csrfSync({
  getTokenFromRequest: (req: Request): string => {
    
    const token = req.headers["x-csrf-token"];
    if (!token) {
      throw new ForbiddenError(
        "CSRF token missing from headers",
        { location: 'csrf.csrfSync '},
        ErrorCode.CSRF_MISSING_IN_HEADERS
      );
    }
    return Array.isArray(token) ? token[0] : token;
  },

  getTokenFromState: (req: Request): CsrfSyncedToken => {
    return req.session.csrfToken;
  },
  storeTokenInState: (req: Request, token: CsrfSyncedToken): void => {
    req.session.csrfToken = token;
  }
});

export const generateCsrfToken = (req: Request, shouldCreateNew: boolean = false) => {
  const token = generateToken(req, shouldCreateNew);
  return token;
};

export const csrfProtection = csrfSynchronisedProtection;

export const csrfErrorHandler = (
  error: CsurfErrorType,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  
  const csrfError = new ForbiddenError(
    "CSRF token mismatch",
    { location: "csrfErrorHandler", originalError: error },
    ErrorCode.CSRF_TOKEN_MISMATCH
  );
  next(csrfError);
};