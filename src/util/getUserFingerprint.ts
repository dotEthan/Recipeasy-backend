import { Request } from "express";
import crypto from 'crypto';


export const getUserFingerprint = (req: Request): string => {
    return crypto
        .createHash('sha256')
        .update(`${req.headers['user-agent']}${req.ip}${req.headers['accept-language']}`)
        .digest('hex');
}