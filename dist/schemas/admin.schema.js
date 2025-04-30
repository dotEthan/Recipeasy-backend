"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeleteVerificationCodeSchema = exports.GetVerificationCodeSchema = exports.updatePasswordSchema = exports.createVerificationCodeSchema = exports.SaveLoginAttemptDataSchema = void 0;
const mongodb_1 = require("mongodb");
const zod_1 = require("zod");
const shared_schema_1 = require("./shared.schema");
exports.SaveLoginAttemptDataSchema = zod_1.z.object({
    userId: zod_1.z.custom((val) => {
        return mongodb_1.ObjectId.isValid(val);
    }, {
        message: "Save LoginAttempt Invalid MongoDB ObjectId"
    }),
    ipAddress: zod_1.z.string(),
    userAgent: zod_1.z.string(),
    timestamp: zod_1.z.date(),
    success: zod_1.z.boolean(),
    errorMessage: zod_1.z.string(),
}).strict();
exports.createVerificationCodeSchema = zod_1.z.object({
    userId: shared_schema_1.ObjectIdSchema,
    code: zod_1.z.string(),
    createdAt: zod_1.z.date(),
    updatedAt: zod_1.z.date()
}).strict();
exports.updatePasswordSchema = zod_1.z.object({
    password: zod_1.z.string()
});
//---
// TODO - post - Both are isObjectIdSchema dupe?
exports.GetVerificationCodeSchema = zod_1.z.object({
    _id: shared_schema_1.ObjectIdSchema,
}).strict();
exports.DeleteVerificationCodeSchema = zod_1.z.object({
    _id: shared_schema_1.ObjectIdSchema
}).strict();
