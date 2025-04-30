"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.apiLimiter = exports.registrationLimiter = void 0;
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const defaultConfig = {
    windowMs: 24 * 60 * 60 * 1000, // 24 hours
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: false,
};
exports.registrationLimiter = (0, express_rate_limit_1.default)(Object.assign(Object.assign({}, defaultConfig), { max: 5, message: 'Too many accounts created from this IP. Please try again tomorrow' }));
exports.apiLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,
});
