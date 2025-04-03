import { NextFunction, Response, Request } from "express";
import { AnyZodObject, ZodError } from "zod";
/**
 * Validate Middleware to ensure Data matches expected Schema
 * @constructor
 * @param {AnyZodObject} schema - A Zod schema to validate against
 */
export const validateRequestBodyData = (schema: AnyZodObject) => 
  (req: Request, res: Response, next: NextFunction) => {
    try {
      console.log('validating response by Schema')
      schema.parse(req.body);
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        console.log("Kneel Before Zod Error!")
        res.status(400).json({
          message: 'Validation failed',
          errors: err.format(),
        });
      }
      next(err);
    }
};