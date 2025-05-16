import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';

import { AppError, ServerError, UnauthorizedError, UnknownError } from '../errors';
import { ErrorCode } from '../types/enums';
import { tokenService } from '../services';
import { AccessToken } from '../types/auth';
import { UserRoles } from '../enums';

export const checkAccessToken = async (req: Request, _res: Response, next: NextFunction) => {
    try {
        const authHeader = req.headers.authorization;
        const accessToken = authHeader?.split(' ')[1];
        if (!accessToken) throw new UnauthorizedError('Access token missing in header, relogin', { location: 'checkAccesstoken middleware' }, ErrorCode.HEADER_TOKEN_MISSING)

        const accessSecret = process.env.JWT_ACCESS_SECRET;
        if (!accessSecret) throw new ServerError('Missing JWT_SECRET in Env', { location: 'createToken.ts' }, ErrorCode.UNSET_ENV_VARIABLE);

        let decoded: AccessToken;
        try {
            decoded = jwt.verify(accessToken, accessSecret) as AccessToken;
        } catch (jwtError) {
            if (jwtError instanceof jwt.TokenExpiredError) {
                throw new UnauthorizedError(
                    'Access token expired', 
                    { location: 'checkAccesstoken middleware' }, 
                    ErrorCode.ACCESS_TOKEN_EXPIRED
                );
            } else {
                throw new UnauthorizedError(
                    'Invalid token', 
                    { location: 'checkAccesstoken middleware' }, 
                    ErrorCode.TOKEN_INVALID
                );
            }
        }

        if (!decoded.tokenId) throw new ServerError('RefreshToken Id Missing in AccessToken', { location: 'createToken.ts' }, ErrorCode.TOKEN_MALFORMED);

        // TODO Cache tokenvalidity with Redis
        const storedToken = await tokenService.findRefreshToken(decoded.tokenId);
        
        if (!storedToken) throw new UnauthorizedError('Token already revoked or deleted, relogin', { location: 'checkAccessToken middleware' }, ErrorCode.REFRESH_TOKEN_MISSING);

        if (storedToken.expiresAt < new Date()) {
            tokenService.deleteOldTokenIfExists(decoded.tokenId);
            throw new UnauthorizedError('Refresh Token expired, relogin', { location: 'checkAccessToken middleware' }, ErrorCode.REFRESH_TOKEN_EXPIRED);
        }
        req.user = { _id: decoded.userId, role: decoded.role as UserRoles};
        next();
    } catch (error) {
        if (error instanceof AppError) {
            next(error);
        } else {
            const formattedError = new UnknownError('Error to be handled', { location: 'checkAccessToken Middleware', originalError: error }, ErrorCode.UNHANDLED_ERROR );
            next(formattedError);
        }

    }
};