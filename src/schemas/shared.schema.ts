import { ObjectId } from "mongodb";
import { z } from "zod";

export const ObjectIdSchema = z.custom<ObjectId>((val) => {
    return val instanceof ObjectId || ObjectId.isValid(val);
}, {
    message: "Invalid MongoDB ObjectId"
});

export const IsObjectIdSchema = z.object({
    _id: z.custom<ObjectId>((val) => {
        return ObjectId.isValid(val);
    }, {
        message: "isObjectIdSchema Invalid MongoDB ObjectId"
    })
}).strict();

export const ObjectIdSchema2 = z.custom<ObjectId>((val) => {
    // Check if it's an actual ObjectId instance
    return val instanceof ObjectId;
  }, {
    message: "Expected MongoDB ObjectId instance"
  });

export const IsEmailSchema = z.object({
    email: z.string().email()
}).strict();

export const IsStringSchema = z.object({
    email: z.string()
}).strict();

export const StandardResponseSchema = z.object({
    success: z.boolean(),
    message: z.string().optional(),
    data: z.unknown().optional(),
    error: z.string().optional()
})