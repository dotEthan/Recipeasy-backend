import crypto from 'crypto';
import jwt from 'jsonwebtoken';

import { AuthTokenRepository } from "../repositories/auth/authRepository";
import { FeUser } from "../types/user";
import { 
    BadRequestError, 
    LogOnlyError, 
    ServerError
} from '../errors';
import { ErrorCode } from '../types/enums';
import { WithId } from 'mongodb';
import { RefreshTokenDocument } from '../types/auth';

/**
 * Handles all Authorization related services
 * @todo - post - Ensure all errors are handled
 */
// 

export class TokenService {

    constructor(
        private authTokenRepository: AuthTokenRepository
    ) {}

    /**
     * Create and save security tokens
     * @group Security - Token management
     * @param {string} user - Current user
     * @throws {ServerError} 500 - Saving hased token to DB failed
     * @example
     * await this.tokenService.createUserTokens(user);
     */  
    public async createUserTokens(user: FeUser): Promise<string[]> {
        const refreshTokenId = crypto.randomBytes(16).toString('hex');
        const accessPayload = {
            userId: user._id,
            role: user.role,
            tokenId: refreshTokenId,
            iat: Math.floor(Date.now() / 1000)
        };
        const refreshPayload = {
            userId: user._id,
            tokenId: refreshTokenId,
            iat: Math.floor(Date.now() / 1000)
        };

        const [ accessToken, refreshToken] = this.createTokens(accessPayload, refreshPayload);

        const refreshTokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
        
        const insertTokenResponse = await this.authTokenRepository.createRefreshToken({
            userId: user._id,
            tokenHash: refreshTokenHash,
            tokenId: refreshPayload.tokenId,
            createdAt: new Date(),
            expiresAt: new Date(Date.now() + 604800 * 1000)
        });

        if (!insertTokenResponse) throw new ServerError(
            'Saving refresh token to DB failed', 
            { 
                location: 'authController.login',
                details: 'Refresh Token Create failed'
            },
            ErrorCode.CREATE_RESOURCE_FAILED
        )


        return [accessToken, refreshToken];
    }

    /**
     * Find and delete old security token
     * @group Security - Token management
     * @param {string} tokenId - Token id to delete
     * @throws {UnauthorizedError} 401 - Token not found
     * @example
     * await this.tokenService.deleteOldTokenIfExists("12324");
     */  
    public async deleteOldTokenIfExists(tokenId: string): Promise<void> {
        console.log('tokenId: ', tokenId)
        if (!tokenId) throw new BadRequestError('Decoded refreshToken malformed', { location: 'tokenService.deleteOldTokenIfExists' }, ErrorCode.TOKEN_TO_DELETE_MALFORMED);
        const deletedToken = await this.authTokenRepository.findAndDeleteToken(tokenId);

        console.log('tokenId: ', tokenId)
        if (!deletedToken) throw new LogOnlyError(
            'Token already revoked or deleted', 
            { location: 'tokenService.deleteOldToken' },
            ErrorCode.NON_BREAKING_DELETE_FAILED);
    }

    /**
     * Find and delete old security token
     * @group Security - Token management
     * @param {string} tokenId - Token id to delete
     * @throws {UnauthorizedError} 401 - Token not found
     * @example
     * await this.tokenService.deleteOldTokenIfExists("12324");
     */  
    public async findRefreshToken(tokenId: string): Promise<WithId<RefreshTokenDocument> | null> {
        return await this.authTokenRepository.findOne({ tokenId: tokenId });
    }

    /**
     * Create security tokens
     * @group Security - Token management
     * @param {object} accessPayload - payload for accessToken
     * @param {object} refreshToken - payload for refreshToken
     * @throws {ServerError} 500 - missing JWT_SECRET value in .env file
     * @example
     * await this.tokenService.createUserTokens(user);
     */  
    private createTokens = (accessPayload: object, refreshPayload: object): string[] => {
        const accessSecret = process.env.JWT_ACCESS_SECRET;
        const refreshSecret = process.env.JWT_REFRESH_SECRET;
    
        if (!accessSecret || !refreshSecret) throw new ServerError(
            'Missing JWT_SECRET in Env', 
            { 
                location: 'createToken.ts',
                details: 'JWT_SECRET missing'
            }, 
            ErrorCode.ENV_VAR_MISSING);
        
        const accessToken = jwt.sign(accessPayload, accessSecret, { expiresIn: 1800 });
        const refreshToken = jwt.sign(refreshPayload, refreshSecret, { expiresIn: 604800 });
    
        return [accessToken, refreshToken];
    }
}