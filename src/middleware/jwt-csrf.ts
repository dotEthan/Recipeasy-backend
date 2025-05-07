import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { AppError, ForbiddenError } from '../errors';
import { ErrorCode } from '../types/enums';
import crypto from 'crypto';

const CSRF_SECRET = process.env.CSRF_SECRET || 'your-csrf-secret';

const getClientIdentifier = (req: Request): string => {
  if (req.cookies.clientId) return req.cookies.clientId;
  
  const newId = crypto.randomBytes(16).toString('hex');
  
  req.res?.cookie('clientId', newId, { 
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 365 * 24 * 60 * 60 * 1000 // Persistence = 1yr. 
  });
  
  return newId;
};

export const generateCsrfToken = (req: Request) => {
  const payload = {
    ...(req.user && { userId: req.user._id }),
    clientId: getClientIdentifier(req),
    iat: Date.now()
  };

  return jwt.sign(payload, CSRF_SECRET, { expiresIn: '1h' });
};

export const verifyCsrfToken = (req: Request) => {
  const token = req.headers['x-csrf-token'] as string;
  if (!token) {
    throw new ForbiddenError(
      'CSRF token missing', 
      { location: 'jwt-csrf' }, 
      ErrorCode.CSRF_MISSING_IN_HEADERS
    );
  }
  
  const decoded = jwt.verify(token, CSRF_SECRET) as { 
    userId?: string, 
    clientId: string 
  };

  // Verify client identifier matches
  const currentClientId = getClientIdentifier(req);
  if (decoded.clientId !== currentClientId) {
    throw new ForbiddenError(
      'CSRF token client mismatch',
      { location: 'jwt-crf' },
      ErrorCode.CSRF_TOKEN_MISMATCH
    );
  }

  if (req.user && decoded.userId && decoded.userId !== req.user._id.toString()) {
    throw new ForbiddenError(
      'CSRF token user mismatch',
      { location: 'jwt-csrf' },
      ErrorCode.CSRF_TOKEN_MISMATCH
    );
  }
};

export const jwtCsrfMiddleware = () => (req: Request, res: Response, next: NextFunction) => {
  try {
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
      verifyCsrfToken(req);
    }
    next();
  } catch (error: unknown) {
    if (error instanceof AppError) {
      next(error);
    } else {
      next(new ForbiddenError(
        'CSRF validation failed', 
        { 
          location: 'jwt-csrf', 
          originalError: error instanceof Error ? error : undefined 
        }, 
        ErrorCode.CSRF_TOKEN_MISMATCH
      ));
    }
  }
};