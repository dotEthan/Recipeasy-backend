import { Request } from "express";
import crypto from 'crypto';

// Removed for now, maybe add later once user personal data is stored for "Pro" mode (paid)
export const getUserFingerprint = (req: Request): string => {
    return crypto
        .createHash('sha256')
        .update(
            `${req.headers['user-agent'] || ''}` +
            `${req.headers['accept'] || ''}` +
            `${req.headers['accept-language'] || ''}` +
            `${req.headers['accept-encoding'] || ''}` +
            `${req.ip?.split('.').slice(0, 3).join('.')}`
        )
        .digest('hex');
}