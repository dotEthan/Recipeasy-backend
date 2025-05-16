import { NextFunction, Response, Request } from "express";
import { AnyZodObject } from "zod";
import { zodValidationWrapper } from "../util/zodParseWrapper";
/**
 * Validate Middleware to ensure Data matches expected Schema
 * @constructor
 * @param {AnyZodObject} schema - A Zod schema to validate against
 */
export const validateRequestBodyData = (schema: AnyZodObject) => 
  (req: Request, res: Response, next: NextFunction) => {
    try {
      zodValidationWrapper(schema, req.body, 'validateRequestData.validateRequestBodyData');
      next();
    } catch (error) {
      next(error);
    }
};