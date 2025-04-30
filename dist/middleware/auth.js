"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isAuthenticated = void 0;
const errors_1 = require("../errors");
const enums_1 = require("../types/enums");
/**
 * isAuthorized Middleware to ensure user is logged in and session active
 * @constructor
 * @param {}
 */
const isAuthenticated = () => (req, res, next) => {
    if (req.isAuthenticated()) {
        next();
        return;
    }
    throw new errors_1.UnauthorizedError('User not Autheticated. Please re-login', { location: 'middleware.auth.isAutheticated' }, enums_1.ErrorCode.USER_NOT_AUTHETICATED);
};
exports.isAuthenticated = isAuthenticated;
