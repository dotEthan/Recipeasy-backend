"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateImageUpload = void 0;
const enums_1 = require("../enums");
const errors_1 = require("../errors");
const enums_2 = require("../types/enums");
const constants_1 = require("../constants");
/**
 * Validate Image Upload Data
 * @param {Request, Response, Next} - The usual three from the call being wrapped
 * @returns {Void} - Nothing, calls res as needed.
 * @example
 * import validateImageUpload = './validateImageUpload';
 * app.user(validateImageUpload);
 */
const validateImageUpload = (req, res, next) => {
    var _a, _b, _c;
    if (!req.isAuthenticated())
        throw new errors_1.UnauthorizedError('User not autheticated, relogin', { location: 'validateImageUpload.validateImageUpload', autheticated: req.isAuthenticated }, enums_2.ErrorCode.USER_NOT_AUTHETICATED);
    if (((_a = req.user) === null || _a === void 0 ? void 0 : _a.role) === enums_1.UserRoles.testMode)
        throw new errors_1.ForbiddenError('User role not allowed to upload', { location: 'validateImageUpload.validateImageUpload', role: req.user.role }, enums_2.ErrorCode.USER_ROLE_FORBIDDEN);
    if (req.file && ((_b = req.file) === null || _b === void 0 ? void 0 : _b.size) > constants_1.RECIPE_FILE_MAX_SIZE)
        throw new errors_1.BadRequestError('File size too large. 5mb limit', { location: 'validateImageUpload.validateImageUpload', fileSize: (_c = req.file) === null || _c === void 0 ? void 0 : _c.size }, enums_2.ErrorCode.FILE_SIZE_TOO_LARGE);
    next();
};
exports.validateImageUpload = validateImageUpload;
