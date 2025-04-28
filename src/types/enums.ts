export enum Visibility {
    PUBLIC = 'public',
    PRIVATE = 'private'
}

/**
 * Token Types in case more tokens required in the future
 * - Example: `401:CREDENTIALS` → Show a login form.  
 */
export enum TokenTypes {
    PASSWORD_RESET = 'reset-password'
}

/**
 * Error codes follow the format: `HTTP_STATUS:SHORT_KEY`  
 * - Used by frontend to handle errors consistently.  
 * - Example: `401:CREDENTIALS` → Show a login form.  
 */
export enum ErrorCode {
    // Bad Request
    BAD_REQUEST_DEFAULT = "400:BAD_REQ",
    MULTER_FILE_FILTER_TYPES = "400:FILE_TYPES_INVALID",
    ZOD_VALIDATION_ERR = "400:ZOD_VALIDATION_ERR",

    // UnAuth
    UNAUTH_DEFAULT = "401:DEFAULT_UNAUTH",
    PASSPORT_UNAUTH = "401:BAD_CREDENTIALS",

    // Forbidden
    FORBID_DEFAULT = "403:DEFAUL_FORBID",

    // Not Found
    NOT_FOUND_DEFAULT = "404:DEFAUL_NOT_FOUND",

    // Conflict
    CONFLICT_DEFAULT = "409:DEFAUL_CONFLICT",

    // Internal Server
    SERVER_DEFAULT = "500:DEFAULT_SERVER",
    PASSPORT_FAILED = "500:PASSPORT_ERROR",
    SESSION_CREATE_FAILED = "500:SESSION_CREATE_FAILED",
    MONGODB_COLLECTION_NOT_FOUND = "500:MONGODB_COLLECTION_NOT_FOUND",
    MONGODB_GET_DB_FAILED = "500:MONGODB_GET_DB_FAILED",
    MONGODB_INIT_INDICES = "500:MONGODB_INIT_INDEXES_FAILED",

    // Log Only
    LOG_ONLY_DEFAULT = "42:DEFAUL_LOG_ONLY",

    // Unknown
    UNKNONWN_DEFAULT = "??:DEFAUL_UNKNOWN",
    UNHANDLED_ERROR = "??:UNHANDLED_ERROR",
    UNHANDLED_NON_ERROR_REJECTION = "??:UNHANDLED_REJECTION",
}