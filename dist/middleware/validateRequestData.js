"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateRequestBodyData = void 0;
/**
 * Validate Middleware to ensure Data matches expected Schema
 * @constructor
 * @param {AnyZodObject} schema - A Zod schema to validate against
 */
const validateRequestBodyData = (schema) => (req, res, next) => {
    try {
        schema.parse(req.body);
        next();
    }
    catch (error) {
        next(error);
    }
};
exports.validateRequestBodyData = validateRequestBodyData;
