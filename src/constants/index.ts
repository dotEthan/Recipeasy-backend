
/**
 * CONSTANTS for app use
 * @todo - post - Refactor to find others
 * @todo - post - RECIPE_DESC_MAX - Good balance for recipe descriptions (250char?)
 */

export const RECIPEASY_PW_RESET_URL = 'https://localhost:5173/reset-password';

// Auth Validation Constants
export const AUTH_PASSWORD_MIN = 8;
export const AUTH_DISPLAY_NAME_MIN = 1;

// Admin Validation
export const AUTH_PHONE_REGEX= /^\d+$/;

// Recipe Validation
export const RECIPE_NAME_MIN = 3;
export const RECIPE_DESC_MAX = 500;
export const RECIPE_FILE_MAX_SIZE = 5 * 1024 * 1024; // 5mb

// Retry and debounce
export const RETRY_MAX_ATTEMPTS = 3;
export const RETRY_MIN_DELAY = 5000;

// TTL tokens
export const PW_RESET_TOKEN_TTL = 3600000

