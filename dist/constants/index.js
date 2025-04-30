"use strict";
/**
 * CONSTANTS for app use
 * @todo - post - Refactor to find others
 * @todo - post - RECIPE_DESC_MAX - Good balance for recipe descriptions (250char?)
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PW_RESET_TOKEN_TTL = exports.RETRY_MIN_DELAY = exports.RETRY_MAX_ATTEMPTS = exports.RECIPE_FILE_MAX_SIZE = exports.RECIPE_DESC_MAX = exports.RECIPE_NAME_MIN = exports.AUTH_PHONE_REGEX = exports.AUTH_DISPLAY_NAME_MIN = exports.AUTH_PASSWORD_MIN = exports.RECIPEASY_PW_RESET_URL = void 0;
exports.RECIPEASY_PW_RESET_URL = 'https://localhost:5173/reset-password';
// Auth Validation Constants
exports.AUTH_PASSWORD_MIN = 8;
exports.AUTH_DISPLAY_NAME_MIN = 1;
// Admin Validation
exports.AUTH_PHONE_REGEX = /^\d+$/;
// Recipe Validation
exports.RECIPE_NAME_MIN = 3;
exports.RECIPE_DESC_MAX = 500;
exports.RECIPE_FILE_MAX_SIZE = 5 * 1024 * 1024; // 5mb
// Retry and debounce
exports.RETRY_MAX_ATTEMPTS = 3;
exports.RETRY_MIN_DELAY = 5000;
// TTL tokens
exports.PW_RESET_TOKEN_TTL = 3600000;
