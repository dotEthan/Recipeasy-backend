"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PartialRecipeSchema = exports.StandardRecipeResponseSchema = exports.FeUpdateRecipeSchema = exports.NewRecipeSchema = exports.FeRecipeSchema = exports.BeRecipeSchema = exports.InternalStateSchema = exports.DirectionsSchema = exports.IngredientsSchema = exports.IngredientsStepSchema = exports.RatingsSchema = exports.RatingsItemSchema = exports.RecipeInfoSchema = exports.NutritionalInfoSchema = exports.DurationSchema = void 0;
const zod_1 = require("zod");
const constants_1 = require("../constants");
const shared_schema_1 = require("./shared.schema");
const enums_1 = require("../types/enums");
exports.DurationSchema = zod_1.z.object({
    value: zod_1.z.string(),
    unit: zod_1.z.string() // enum? min|hour|day?
}).strict();
exports.NutritionalInfoSchema = zod_1.z.object({
    name: zod_1.z.string(),
    amount: zod_1.z.string()
}).strict();
exports.RecipeInfoSchema = zod_1.z.object({
    mealType: zod_1.z.array(zod_1.z.string()).optional(),
    cuisineType: zod_1.z.string().optional(),
    cookTime: exports.DurationSchema.optional(),
    prepTime: exports.DurationSchema.optional(),
    serviceSize: zod_1.z.number().optional(),
    nutritionalInfo: zod_1.z.array(exports.NutritionalInfoSchema).optional()
}).strict();
exports.RatingsItemSchema = zod_1.z.object({
    userId: zod_1.z.string(),
    rating: zod_1.z.number(),
    timestamp: zod_1.z.coerce.date(),
}).strict();
exports.RatingsSchema = zod_1.z.object({
    ratings: zod_1.z.array(exports.RatingsItemSchema),
    averageRating: zod_1.z.number(),
    totalRatings: zod_1.z.number(),
    ratingsSum: zod_1.z.number(),
}).strict();
exports.IngredientsStepSchema = zod_1.z.object({
    name: zod_1.z.string().optional(),
    amount: zod_1.z.string().optional(),
    unit: zod_1.z.string().optional(),
    process: zod_1.z.string().optional()
}).strict();
exports.IngredientsSchema = zod_1.z.object({
    title: zod_1.z.string().optional(),
    steps: zod_1.z.array(exports.IngredientsStepSchema).optional()
}).strict();
exports.DirectionsSchema = zod_1.z.object({
    title: zod_1.z.string().optional(),
    steps: zod_1.z.array(zod_1.z.string()).optional()
}).strict();
exports.InternalStateSchema = zod_1.z.object({
    isDeleted: zod_1.z.boolean().default(false),
    wasDeletedAt: zod_1.z.coerce.date(),
    deletedBy: shared_schema_1.ObjectIdSchema
}).strict();
exports.BeRecipeSchema = zod_1.z
    .object({
    _id: shared_schema_1.ObjectIdSchema,
    name: zod_1.z.string().min(constants_1.RECIPE_NAME_MIN),
    description: zod_1.z.string().max(constants_1.RECIPE_DESC_MAX),
    imgPath: zod_1.z.string(),
    info: exports.RecipeInfoSchema.optional(),
    ratings: exports.RatingsSchema,
    url: zod_1.z.string().optional(),
    ingredients: zod_1.z.array(exports.IngredientsSchema),
    directions: zod_1.z.array(exports.DirectionsSchema),
    visibility: zod_1.z.nativeEnum(enums_1.Visibility).default(enums_1.Visibility.PUBLIC),
    tags: zod_1.z.array(zod_1.z.string()),
    notes: zod_1.z.array(zod_1.z.string()),
    userId: shared_schema_1.ObjectIdSchema,
    equipment: zod_1.z.array(zod_1.z.string()).optional(),
    internalState: exports.InternalStateSchema.optional(),
    createdAt: zod_1.z.coerce.date(),
    updatedAt: zod_1.z.coerce.date()
}).strict();
exports.FeRecipeSchema = exports.BeRecipeSchema.omit({ internalState: true, createdAt: true }).strict();
exports.NewRecipeSchema = zod_1.z.object({
    recipe: exports.FeRecipeSchema.omit({ _id: true, updatedAt: true })
}).strict();
exports.FeUpdateRecipeSchema = zod_1.z.object({
    recipe: exports.FeRecipeSchema
}).strict();
exports.StandardRecipeResponseSchema = zod_1.z.object({
    success: zod_1.z.boolean(),
    message: zod_1.z.string().optional(),
    recipe: exports.FeRecipeSchema.optional(),
    error: zod_1.z.string().optional()
}).strict();
exports.PartialRecipeSchema = exports.BeRecipeSchema.partial().strict();
