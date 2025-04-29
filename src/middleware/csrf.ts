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
        const token = generateCsrfToken(req, true);
        // Important: Make sure session is saved synchronously before proceeding
        // await new Promise<void>((resolve, reject) => {
        //   req.session.save((err) => {
        //     if (err) reject(err);
        //     else resolve();
        //   });
        // });
        console.log('Initialized new CSRF token:', token);
      }

      csrfSynchronisedProtection(req, res, async (err) => {
        if (err) {
          console.error('CSRF validation error:', err);
          return csrfErrorHandler(err, req, res, next);
        }

        console.log('rotateToken: ', rotateToken);

        if (rotateToken) {
          console.log('Old token:', req.session.csrfToken);
          // delete req.session.csrfToken; 
          const newToken = generateCsrfToken(req, true);
          console.log('New token:', req.session.csrfToken); // Should differ
          res.header('X-CSRF-Token', newToken);
          // TODO probably not needed, testing csrf-sync, try removing it... 
          await new Promise<void>((resolve, reject) => {
            req.session.save((error) => (error) ? reject(error) : resolve()); // Force save after rotation
          });
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
    console.log('Received token:', token);
    console.log('Session token:', req.session.csrfToken);
    if (!token) {
      throw new ForbiddenError(
        "CSRF token missing from headers",
        { location: 'csrf.csrfSync '},
        ErrorCode.CSRF_MISSING_IN_HEADERS
      );
    }
    console.log('csrf token: ', token)
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
  console.log('generated token: ', token)
  return token;
};

export const csrfProtection = csrfSynchronisedProtection;

export const csrfErrorHandler = (
  error: CsurfErrorType,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.log('Session ID at error time:', req.sessionID);
  console.log('CSRF Token in session at error time:', req.session.csrfToken);
  
  const csrfError = new ForbiddenError(
    "CSRF token mismatch",
    { location: "csrfErrorHandler", originalError: error },
    ErrorCode.CSRF_TOKEN_MISMATCH
  );
  next(csrfError);
};