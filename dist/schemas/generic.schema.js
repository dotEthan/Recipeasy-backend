"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GenericResponseSchema = exports.UserResponseSchema = exports.RecipeResponseSchema = exports.createSuccessFailSchema = void 0;
const zod_1 = require("zod");
const recipe_schema_1 = require("./recipe.schema");
const user_schema_1 = require("./user.schema");
const createSuccessFailSchema = (dataSchema) => zod_1.z.object({
    success: zod_1.z.boolean(),
    message: zod_1.z.string().optional(),
    data: dataSchema.optional(),
    error: zod_1.z.string().optional()
}).strict();
exports.createSuccessFailSchema = createSuccessFailSchema;
exports.RecipeResponseSchema = (0, exports.createSuccessFailSchema)(recipe_schema_1.FeRecipeSchema);
exports.UserResponseSchema = (0, exports.createSuccessFailSchema)(user_schema_1.FeUserSchema);
exports.GenericResponseSchema = zod_1.z.object({
    success: zod_1.z.boolean()
});
