"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StandardUserResponseSchema = exports.BeUpdateUsersRecipesSchema = exports.FeUpdateUsersRecipesSchema = exports.DeleteUserByIdSchema = exports.UpdateByIdSchema = exports.UpdateUserByIdSchema = exports.ResetFlowSetPasswordSchema = exports.LoginResSchema = exports.LoginSchema = exports.RegisterUserSchema = exports.UpdateFeUserSchema = exports.FeUserSchema = exports.BeCreateUserSchema = exports.BeUserSchema = exports.PasswordResetDataSchema = exports.PreviousPasswordSchema = exports.UserRecipesIdSchema = exports.CopyDetailsSchema = exports.UserRatingsSchema = exports.PreferencesSchema = exports.ShoppingListSchema = void 0;
const mongodb_1 = require("mongodb");
const zod_1 = require("zod");
const constants_1 = require("../constants");
const shared_schema_1 = require("./shared.schema");
const recipe_schema_1 = require("./recipe.schema");
/**
 * Authorization based req and res handling
 * @todo - post - is copyDetails need in FE?
 * @todo - post - Rename and refactor (dupes?)
 * @todo - post - ShoppingListSchema, here or separte (BE - always on user)
 */
// 
exports.ShoppingListSchema = zod_1.z.object({}).strict();
exports.PreferencesSchema = zod_1.z.object({
    personalFilters: zod_1.z.array(zod_1.z.string()),
    lightMode: zod_1.z.boolean().default(true)
}).strict();
exports.UserRatingsSchema = zod_1.z.object({
    recipeId: shared_schema_1.ObjectIdSchema,
    rating: zod_1.z.number()
}).strict();
exports.CopyDetailsSchema = zod_1.z.object({
    originalCreatorId: shared_schema_1.ObjectIdSchema,
    originalRecipeId: shared_schema_1.ObjectIdSchema,
    copiedAt: zod_1.z.coerce.date(),
    updatedAt: zod_1.z.coerce.date(),
    modified: zod_1.z.boolean()
}).strict();
exports.UserRecipesIdSchema = zod_1.z.object({
    id: zod_1.z.custom((val) => {
        return mongodb_1.ObjectId.isValid(val);
    }, {
        message: "UserRecipe Invalid MongoDB ObjectId"
    }),
    copyDetails: exports.CopyDetailsSchema.optional(),
    alterations: recipe_schema_1.FeRecipeSchema.partial().optional()
}).strict();
exports.PreviousPasswordSchema = zod_1.z.object({
    hash: zod_1.z.string(),
    deprecatedAt: zod_1.z.coerce.date()
}).strict();
exports.PasswordResetDataSchema = zod_1.z.object({
    resetInProgress: zod_1.z.boolean(),
    attempts: zod_1.z.number(),
    expiresAt: zod_1.z.coerce.date(),
    resetRequestedAt: zod_1.z.coerce.date()
}).strict();
exports.BeUserSchema = zod_1.z
    .object({
    _id: zod_1.z.custom((val) => {
        return mongodb_1.ObjectId.isValid(val);
    }, {
        message: "User Invalid MongoDB ObjectId"
    }),
    displayName: zod_1.z.string().min(constants_1.AUTH_DISPLAY_NAME_MIN),
    email: zod_1.z.string().email(),
    firstName: zod_1.z.string().optional(),
    lastName: zod_1.z.string().optional(),
    verified: zod_1.z.boolean().default(false),
    recipes: zod_1.z.array(exports.UserRecipesIdSchema.optional()),
    shoppingLists: zod_1.z.array(exports.ShoppingListSchema),
    userRatings: exports.UserRatingsSchema.optional(),
    preferences: exports.PreferencesSchema.optional(),
    role: zod_1.z.string(),
    password: zod_1.z.string(),
    passwordResetData: exports.PasswordResetDataSchema.optional(),
    previousPasswords: zod_1.z.array(exports.PreviousPasswordSchema).optional(),
    createdAt: zod_1.z.coerce.date(),
    updatedAt: zod_1.z.coerce.date()
}).strict();
exports.BeCreateUserSchema = exports.BeUserSchema.omit({ _id: true }).strict();
exports.FeUserSchema = exports.BeUserSchema.omit({ previousPasswords: true, createdAt: true, password: true }).strict();
exports.UpdateFeUserSchema = exports.FeUserSchema.partial().strict();
exports.RegisterUserSchema = zod_1.z.object({
    displayName: zod_1.z.string().min(1),
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(constants_1.AUTH_PASSWORD_MIN)
}).strict();
exports.LoginSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(constants_1.AUTH_PASSWORD_MIN)
}).strict();
exports.LoginResSchema = zod_1.z.object({
    user: exports.FeUserSchema,
    newEmailVerifyCodeCreated: zod_1.z.boolean(),
    recipeResponse: zod_1.z.array(recipe_schema_1.FeRecipeSchema),
    totalRecipes: zod_1.z.number()
}).strict();
exports.ResetFlowSetPasswordSchema = zod_1.z.object({
    code: zod_1.z.string(),
    password: zod_1.z.string().min(constants_1.AUTH_PASSWORD_MIN)
}).strict();
exports.UpdateUserByIdSchema = zod_1.z.object({
    user: exports.BeUserSchema
        .omit({ _id: true, createdAt: true })
        .partial()
        .refine(data => Object.keys(data).length > 0, { message: 'Update must contain at least one field'
    })
}).strict();
// Generic, needed or all will be specific due to specific #addToSet mongoDb syntax?
exports.UpdateByIdSchema = zod_1.z.object({
    updatedData: exports.BeUserSchema
        .omit({ _id: true, createdAt: true })
        .partial()
        .refine(data => Object.keys(data).length > 0, { message: 'Update must contain at least one field'
    })
}).strict();
exports.DeleteUserByIdSchema = zod_1.z.object({
    _id: zod_1.z.custom((val) => {
        return mongodb_1.ObjectId.isValid(val);
    }, {
        message: "Deleting User Invalid MongoDB ObjectId"
    })
}).strict();
exports.FeUpdateUsersRecipesSchema = zod_1.z.object({
    recipeId: zod_1.z.custom((val) => {
        return mongodb_1.ObjectId.isValid(val);
    }, {
        message: "Patching User Invalid MongoDB ObjectId"
    }),
    originalUserId: zod_1.z.custom((val) => {
        return mongodb_1.ObjectId.isValid(val);
    }, {
        message: "Patching User Invalid MongoDB ObjectId"
    })
}).strict();
exports.BeUpdateUsersRecipesSchema = zod_1.z.object({
    id: zod_1.z.custom((val) => {
        return mongodb_1.ObjectId.isValid(val);
    }, {
        message: "Patching User Invalid MongoDB ObjectId"
    }),
    copyDetails: exports.CopyDetailsSchema
}).strict();
exports.StandardUserResponseSchema = zod_1.z.object({
    success: zod_1.z.boolean(),
    message: zod_1.z.string().optional(),
    user: exports.FeUserSchema.optional(),
    error: zod_1.z.string().optional()
});
