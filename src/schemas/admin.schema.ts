import { ObjectId } from 'mongodb';
import { z } from 'zod';
import { ObjectIdSchema } from './generic.schema';

// TODO this or the one in SaveLoginAttemptDataSchema


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
    userId: z.custom<ObjectId>((val) => {
        return ObjectId.isValid(val);
    }, {
        message: "Create VerificationCode Invalid MongoDB ObjectId"
    }),
    code: z.string(),
    createdAt:z.date()
}).strict();

export const FindVerificationCode = z.object({
    _id: ObjectIdSchema,
}).strict();

export const DeleteVerificationCode = z.object({
    _id: z.custom<ObjectId>((val) => {
        return ObjectId.isValid(val);
    }, {
        message: "Delete VerificationCode Invalid MongoDB ObjectId"
    }),
}).strict();