"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateRequestBody = void 0;
const validateRequestBody = (req, res, next) => {
    const body = req.body;
    console.log('validating body', body);
    if (!body || typeof body !== 'object' || Object.keys(body).length === 0) {
        res.status(400).json({
            success: false,
            message: 'Invalid or empty request body'
        });
        return;
    }
    console.log('body OK', body);
    next();
};
exports.validateRequestBody = validateRequestBody;
