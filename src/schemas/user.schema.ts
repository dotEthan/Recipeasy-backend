import { ObjectId } from 'mongodb';
import { z } from 'zod';
import { 
    AUTH_PASSWORD_MIN,
    AUTH_DISPLAY_NAME_MIN,
 } from '../constants';
 import { ObjectIdSchema } from "./shared.schema";
import { FeRecipeSchema } from './recipe.schema';


/**
 * Authorization based req and res handling
 * @todo - post - is copyDetails need in FE?
 * @todo - post - Rename and refactor (dupes?)
 * @todo - post - ShoppingListSchema, here or separte (BE - always on user)
 */
// 
export const ShoppingListSchema = z.object({}).strict();

export const PreferencesSchema = z.object({
    personalFilters: z.array(z.string()),
    lightMode: z.boolean().default(true)
}).strict();

export const UserRatingsSchema = z.object({
    recipeId: ObjectIdSchema,
    rating: z.number(),
    timestamp: z.coerce.date(),
}).strict();

export const CopyDetailsSchema = z.object({
    originalCreatorId: ObjectIdSchema,
    originalRecipeId: ObjectIdSchema,
    copiedAt: z.coerce.date(),
    updatedAt: z.coerce.date(),
    modified: z.boolean()
}).strict();

export const UserRecipesIdSchema = z.object({
    id: z.custom<ObjectId>((val) => {
        return ObjectId.isValid(val);
    }, {
        message: "UserRecipe Invalid MongoDB ObjectId"
    }),
    copyDetails: CopyDetailsSchema.optional(),
    alterations: FeRecipeSchema.partial().optional()
}).strict();

export const PreviousPasswordSchema = z.object({
    hash: z.string(),
    deprecatedAt: z.coerce.date()
}).strict();

export const PasswordResetDataSchema = z.object({
    resetInProgress: z.boolean(),
    attempts: z.number(),
    expiresAt: z.coerce.date(),
    resetRequestedAt: z.coerce.date()
}).strict();
  
export const BeUserSchema = z
.object({
    _id:  z.custom<ObjectId>((val) => {
        return ObjectId.isValid(val);
    }, {
        message: "User Invalid MongoDB ObjectId"
    }),
    displayName: z.string().min(AUTH_DISPLAY_NAME_MIN),
    email: z.string().email(),
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    verified: z.boolean().default(false),
    recipes: z.array(UserRecipesIdSchema.optional()),
    shoppingLists: z.array(ShoppingListSchema),
    ratings: z.array(UserRatingsSchema).optional(),
    preferences: PreferencesSchema.optional(),
    role: z.string(),
    password: z.string(),
    passwordResetData: PasswordResetDataSchema.optional(),
    previousPasswords: z.array(PreviousPasswordSchema).optional(),
    createdAt: z.coerce.date(),
    updatedAt: z.coerce.date(),
}).strict();

export const BeCreateUserSchema = BeUserSchema.omit({ _id: true}).strict();

export const FeUserSchema = BeUserSchema.omit({ previousPasswords: true, createdAt: true, password: true }).strict();

export const UpdateFeUserSchema = FeUserSchema.partial().strict();

export const RegisterUserSchema = z.object({
    displayName: z.string().min(1),
    email: z.string().email(),
    password: z.string().min(AUTH_PASSWORD_MIN)
}).strict();

export const LoginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(AUTH_PASSWORD_MIN)
}).strict();

export const LoginResSchema = z.object({
    user: FeUserSchema,
    newEmailVerifyCodeCreated: z.boolean(),
    recipeResponse: z.array(FeRecipeSchema),
    totalRecipes: z.number()
}).strict();

export const ResetFlowSetPasswordSchema = z.object({
    code: z.string(),
    password: z.string().min(AUTH_PASSWORD_MIN)
}).strict();

export const UpdateUserByIdSchema = z.object({
    user: BeUserSchema
        .omit({ _id: true, createdAt: true })
        .partial()
        .refine(data => Object.keys(data).length > 0, { message: 'Update must contain at least one field'
    })
}).strict();

// Generic, needed or all will be specific due to specific #addToSet mongoDb syntax?
export const UpdateByIdSchema = BeUserSchema
  .omit({ _id: true, createdAt: true })
  .partial()
  .refine(data => Object.keys(data).length > 0, { 
    message: 'Update must contain at least one field' 
  });

export const DeleteUserByIdSchema = z.object({
    _id: z.custom<ObjectId>((val) => {
        return ObjectId.isValid(val);
    }, {
        message: "Deleting User Invalid MongoDB ObjectId"
    })
}).strict();

export const FeUpdateUsersRecipesSchema = z.object({
    recipeId: z.custom<ObjectId>((val) => {
        return ObjectId.isValid(val);
    }, {
        message: "Patching User Invalid MongoDB ObjectId"
    }),
    originalUserId: z.custom<ObjectId>((val) => {
        return ObjectId.isValid(val);
    }, {
        message: "Patching User Invalid MongoDB ObjectId"
    })
}).strict();



export const BeUpdateUsersRecipesSchema = z.object({
    id: z.custom<ObjectId>((val) => {
        return ObjectId.isValid(val);
    }, {
        message: "Patching User Invalid MongoDB ObjectId"
    }),
    copyDetails: CopyDetailsSchema
}).strict();


export const StandardUserResponseSchema = z.object({
    success: z.boolean(),
    message: z.string().optional(),
    user: FeUserSchema.optional(),
    error: z.string().optional()
})
export const EmailVerificationSchema = z.object({
    code: z.string(),
    userEmail: z.string().email()
}).strict();