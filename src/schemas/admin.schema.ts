import { ObjectId } from 'mongodb';
import { z } from 'zod';
import { ObjectIdSchema } from './shared.schema';

export const SaveLoginAttemptDataSchema = z.object({
    userId: z.custom<ObjectId>((val) => {
        return ObjectId.isValid(val);
    }, {
        message: "Save LoginAttempt Invalid MongoDB ObjectId"
    }),
    ipAddress: z.string(),
    userAgent: z.string(),
    timestamp: z.date(),
    success: z.boolean(),
    errorMessage: z.string(),
}).strict();

export const createVerificationCodeSchema = z.object({
    userId: ObjectIdSchema,
    code: z.string(),
    createdAt:z.date(),
    updatedAt: z.date()
}).strict();

export const updatePasswordSchema = z.object({
    password: z.string()
})


//---


// TODO - post - Both are isObjectIdSchema dupe?
export const GetVerificationCodeSchema = z.object({
    _id: ObjectIdSchema,
}).strict();

export const DeleteVerificationCodeSchema = z.object({
    _id: ObjectIdSchema
}).strict();