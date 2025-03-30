import rateLimit from "express-rate-limit"


const defaultConfig = {
    windowMs: 24 * 60 * 60 * 1000,
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: false,
}

export const registrationLimiter = rateLimit({
    ...defaultConfig,
    max: 5,
    message: 'Too many accounts created from this IP. Please try again tomorrow'
});