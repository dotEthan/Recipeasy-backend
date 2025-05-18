import rateLimit from "express-rate-limit"
import { RateLimitError } from "../errors";
import { ErrorCode } from "../types/enums";


const defaultConfig = {
    windowMs: 24 * 60 * 60 * 1000, // 24 hours
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: false,
}

export const registrationLimiter = rateLimit({
    ...defaultConfig,
    max: 5,
    handler: () => {
        throw new RateLimitError(
            "Too many registration requests",
            { 
                location: 'rateLimiters.registrationLimiter',
                details: 'Too many requests, max 5'
            },
            ErrorCode.RATE_LIMITED
        )
    },
});

export const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,
    handler: () => {
        throw new RateLimitError(
            "Too many API requests",
            { 
                location: 'rateLimiters.registrationLimiter',
                details: 'Too many requests, max 100'
            },
            ErrorCode.RATE_LIMITED
        )
    },
});