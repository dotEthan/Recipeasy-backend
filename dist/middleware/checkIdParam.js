"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkIdParam = void 0;
const errors_1 = require("../errors");
const enums_1 = require("../types/enums");
/**
 * checkIdParam Middleware to ensure routes that need :id, has it
 * @constructor
 * @param {}
 */
const checkIdParam = () => (req, res, next) => {
    if (!req.params.id ||
        // NOTE: req.params.id will at times pick up the word previous to :id when the :id is missing
        // more testing needed to confirm exact behaviour
        req.params.id === "image" ||
        req.params.id === 'recipes' ||
        req.params.id === 'users') {
        throw new errors_1.BadRequestError('Client must supply resource ID for this route', { location: 'checkIdParam req middleware' }, enums_1.ErrorCode.RESOURCE_ID_PARAM_MISSING);
    }
    next();
};
exports.checkIdParam = checkIdParam;
