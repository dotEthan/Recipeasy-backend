"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StandardResponseSchema = exports.IsCodeSchema = exports.IsEmailSchema = exports.IsObjectIdSchema = exports.ObjectIdSchema = void 0;
const mongodb_1 = require("mongodb");
const zod_1 = require("zod");
exports.ObjectIdSchema = zod_1.z.custom((val) => {
    return val instanceof mongodb_1.ObjectId || mongodb_1.ObjectId.isValid(val);
}, {
    message: "Invalid MongoDB ObjectId"
});
exports.IsObjectIdSchema = zod_1.z.object({
    _id: zod_1.z.custom((val) => {
        return mongodb_1.ObjectId.isValid(val);
    }, {
        message: "isObjectIdSchema Invalid MongoDB ObjectId"
    })
}).strict();
exports.IsEmailSchema = zod_1.z.object({
    email: zod_1.z.string().email()
}).strict();
exports.IsCodeSchema = zod_1.z.object({
    code: zod_1.z.string()
}).strict();
exports.StandardResponseSchema = zod_1.z.object({
    success: zod_1.z.boolean(),
    message: zod_1.z.string().optional(),
    data: zod_1.z.unknown().optional(),
    error: zod_1.z.string().optional()
});
