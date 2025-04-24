import { z } from "zod";
import { FeRecipeSchema } from "./recipe.schema";
import { FeUserSchema } from "./user.schema";

export const createSuccessFailSchema = <T extends z.ZodTypeAny>(dataSchema: T) => 
    z.object({
      success: z.boolean(),
      message: z.string().optional(),
      data: dataSchema.optional(),
      error: z.string().optional()
    }).strict();

  
export const RecipeResponseSchema = createSuccessFailSchema(FeRecipeSchema);
export const UserResponseSchema = createSuccessFailSchema(FeUserSchema);

export const GenericResponseSchema = z.object({
    success: z.boolean()
})
