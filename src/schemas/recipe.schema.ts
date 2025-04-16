import { z } from "zod";
import { RECIPE_DESC_MAX, RECIPE_NAME_MIN } from "../constants";
import { ObjectIdSchema } from "./shared.schema";

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
    timestamp: z.date()
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
    wasDeletedAt: z.date()
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
  visibility: z.string().default('public'), // Enum
  tags: z.array(z.string()),
  notes: z.array(z.string()),
  userId: ObjectIdSchema,
  equipment: z.array(z.string()).optional(),
  internalState: InternalStateSchema.optional()
}).strict(); 

export const FeRecipeSchema = BeRecipeSchema.omit({internalState: true});

export const FeSavedRecipeArray = z.object({
    recipes: z.array(FeRecipeSchema.omit({_id: true}))
}).strict();

export const FeSavedRecipe = z.object({
    recipe: FeRecipeSchema.omit({_id: true})
}).strict();

export const FeUpdateRecipe = z.object({
    recipe: FeRecipeSchema
}).strict();