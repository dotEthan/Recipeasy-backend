import { Request, Response, NextFunction } from 'express';

export const validateRequestBody = (
    req: Request, 
    res: Response, 
    next: NextFunction
): void => {
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