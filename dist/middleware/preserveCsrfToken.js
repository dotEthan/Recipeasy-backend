"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.preserveCsrfToken = void 0;
/**
 * Saves and restores exisitng CSRF token when passportjs recreates session
 * @function preserveCsrfToken
 * @param { Request } request - request
 * @param { Response } response - response
 * @returns original session.save
 * @example
 * router.post(
 *  "/login",
 *  preserveCsrfToken,
 *  csrfMiddleware(true),
 *  validateRequestBodyData(LoginSchema),
 *  catchAsyncError(authController.login
 * );
 */
const preserveCsrfToken = (req, res, next) => {
    const originalCsrfToken = req.session.csrfToken;
    const originalSessionSave = req.session.save.bind(req.session);
    req.session.save = function (callback) {
        console.log('!!!!!!!!!!session saving');
        if (!this.csrfToken && originalCsrfToken) {
            this.csrfToken = originalCsrfToken;
        }
        return originalSessionSave(callback);
    };
    console.log('######## inside: ', originalCsrfToken);
    next();
};
exports.preserveCsrfToken = preserveCsrfToken;
