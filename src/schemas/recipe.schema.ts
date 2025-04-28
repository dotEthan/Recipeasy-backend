import { z } from "zod";
import { RECIPE_DESC_MAX, RECIPE_NAME_MIN } from "../constants";
import { ObjectIdSchema } from "./shared.schema";
import { Visibility } from "../types/enums";

export const DurationSchema = z.object({
    value: z.string(),
    unit: z.string() // enum? min|hour|day?
}).strict();

export const NutritionalInfoSchema = z.object({
    name: z.string(),
    amount: z.string()
}).strict();

export const RecipeInfoSchema = z.object({
    mealType: z.array(z.string()).optional(),
    cuisineType: z.string().optional(),
    cookTime: DurationSchema.optional(),
    prepTime: DurationSchema.optional(),
    serviceSize: z.number().optional(),
    nutritionalInfo: z.array(NutritionalInfoSchema).optional()
}).strict();

export const RatingsItemSchema = z.object({
    userId: z.string(),
    rating: z.number(),
    timestamp: z.coerce.date(),
}).strict();

export const RatingsSchema = z.object({
    ratings: z.array(RatingsItemSchema),
    averageRating: z.number(),
    totalRatings: z.number(),
    ratingsSum: z.number(),
}).strict();

export const IngredientsStepSchema = z.object({
    name: z.string().optional(),
    amount: z.string().optional(), // TODO set back to string
    unit: z.string().optional(),
    process: z.string().optional()
}).strict();

export const IngredientsSchema = z.object({
    title: z.string().optional(),
    steps: z.array(IngredientsStepSchema).optional()
}).strict();

export const DirectionsSchema = z.object({
    title: z.string().optional(),
    steps: z.array(z.string()).optional()
}).strict();

export const InternalStateSchema = z.object({
    isDeleted: z.boolean().default(false),
    wasDeletedAt: z.coerce.date(),
    deletedBy:  ObjectIdSchema
})

export const BeRecipeSchema = z
.object({
  _id:  ObjectIdSchema,
  name: z.string().min(RECIPE_NAME_MIN),
  description: z.string().max(RECIPE_DESC_MAX),
  imgPath: z.string(),
  info: RecipeInfoSchema.optional(),
  ratings: RatingsSchema,
  url: z.string().optional(),
  ingredients: z.array(IngredientsSchema),
  directions: z.array(DirectionsSchema),
  visibility: z.nativeEnum(Visibility).default(Visibility.PUBLIC),
  tags: z.array(z.string()),
  notes: z.array(z.string()),
  userId: ObjectIdSchema,
  equipment: z.array(z.string()).optional(),
  internalState: InternalStateSchema.optional(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date()
}).strict(); 

export const FeRecipeSchema = BeRecipeSchema.omit({internalState: true, createdAt: true });

export const NewRecipeSchema = z.object({
    recipe: FeRecipeSchema.omit({_id: true, updatedAt: true})
}).strict();

export const FeUpdateRecipeSchema = z.object({
    recipe: FeRecipeSchema
}).strict();

export const StandardRecipeResponseSchema = z.object({
    success: z.boolean(),
    message: z.string().optional(),
    recipe: FeRecipeSchema.optional(),
    error: z.string().optional()
})