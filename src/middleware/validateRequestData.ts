import { NextFunction, Response, Request } from "express";
import { AnyZodObject } from "zod";
/**
 * Validate Middleware to ensure Data matches expected Schema
 * @constructor
 * @param {AnyZodObject} schema - A Zod schema to validate against
 */
export const validateRequestBodyData = (schema: AnyZodObject) => 
  (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.body);
      next();
    } catch (error) {
      next(error);
    }
};