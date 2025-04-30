"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.csrfErrorHandler = exports.csrfProtection = exports.generateCsrfToken = exports.csrfMiddleware = void 0;
const csrf_sync_1 = require("csrf-sync");
const errors_1 = require("../errors");
const enums_1 = require("../types/enums");
const csrfMiddleware = (rotateToken = false) => {
    return (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            // explicit csrf saving as updating issues
            if (!req.session)
                throw new errors_1.UnauthorizedError('session not available, relogin', { location: 'csrf.csrfMiddleware' }, enums_1.ErrorCode.USER_SESSION_NOT_FOUND);
            if (typeof req.session.csrfToken === 'undefined') {
                (0, exports.generateCsrfToken)(req, true);
            }
            csrfSynchronisedProtection(req, res, (err) => __awaiter(void 0, void 0, void 0, function* () {
                if (err) {
                    return (0, exports.csrfErrorHandler)(err, req, res, next);
                }
                if (rotateToken) {
                    const newToken = (0, exports.generateCsrfToken)(req, true);
                    res.header('X-CSRF-Token', newToken);
                }
                next();
            }));
        }
        catch (error) {
            console.log(error);
        }
    });
};
exports.csrfMiddleware = csrfMiddleware;
const { generateToken, csrfSynchronisedProtection } = (0, csrf_sync_1.csrfSync)({
    getTokenFromRequest: (req) => {
        const token = req.headers["x-csrf-token"];
        if (!token) {
            throw new errors_1.ForbiddenError("CSRF token missing from headers", { location: 'csrf.csrfSync ' }, enums_1.ErrorCode.CSRF_MISSING_IN_HEADERS);
        }
        return Array.isArray(token) ? token[0] : token;
    },
    getTokenFromState: (req) => {
        return req.session.csrfToken;
    },
    storeTokenInState: (req, token) => {
        req.session.csrfToken = token;
    }
});
const generateCsrfToken = (req, shouldCreateNew = false) => {
    const token = generateToken(req, shouldCreateNew);
    return token;
};
exports.generateCsrfToken = generateCsrfToken;
exports.csrfProtection = csrfSynchronisedProtection;
const csrfErrorHandler = (error, req, res, next) => {
    const csrfError = new errors_1.ForbiddenError("CSRF token mismatch", { location: "csrfErrorHandler", originalError: error }, enums_1.ErrorCode.CSRF_TOKEN_MISMATCH);
    next(csrfError);
};
exports.csrfErrorHandler = csrfErrorHandler;
