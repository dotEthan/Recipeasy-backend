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
 * @todo is copyDetails need in FE?
 */
// 
export const ShoppingListSchema = z.object({}).strict();  // TODO Import once other schema added

export const PreferencesSchema = z.object({
    personalFilters: z.array(z.string()),
    lightMode: z.boolean().default(true)
}).strict();

export const UserRatingsSchema = z.object({
    recipeId: ObjectIdSchema,
    rating: z.number()
}).strict();

export const CopyDetailsSchema = z.object({
    originalCreatorId: ObjectIdSchema,
    originalRecipeId: ObjectIdSchema,
    copiedAt: z.date(),
    updatedAt: z.date(),
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

export const PreviousPassword = z.object({
    hash: z.string(),
    deprecatedAt: z.date()
}).strict();

export const PasswordResetData = z.object({
    resetInProgress: z.boolean(),
    attempts: z.number(),
    expiresAt: z.date(),
    resetRequestedAt: z.date()
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
    userRatings: UserRatingsSchema.optional(),
    preferences: PreferencesSchema.optional(),
    role: z.string(),
    password: z.string(),
    passwordResetData: PasswordResetData.optional(),
    previousPasswords: z.array(PreviousPassword).optional(),
    createdAt: z.date(),
    updatedAt: z.date()
}).strict();

export const BeCreateUserSchema = BeUserSchema.omit({ _id: true}).strict();

export const FeUserSchema = BeUserSchema.omit({ previousPasswords: true, createdAt: true}).strict();

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

export const CodeSchema = z.object({
    code: z.string()
}).strict();

export const ResetPasswordSchema = z.object({
    email: z.string().email(),
}).strict();

export const FindByIdSchema = z.object({
    _id: z.custom<ObjectId>((val) => {
        return ObjectId.isValid(val);
    }, {
        message: "Find By Id Invalid MongoDB ObjectId"
    })
}).strict();

export const FindByEmailSchema = z.object({
    email: z.string().email(),
}).strict();

export const UpdateUserByIdSchema = z.object({
    user: BeUserSchema
        .omit({ _id: true, createdAt: true })
        .partial()
        .refine(data => Object.keys(data).length > 0, { message: 'Update must contain at least one field'
    })
}).strict();

// Generic, needed or all will be specific due to specific #addToSet mongoDb syntax?
export const UpdateByIdSchema = z.object({
    updatedData: BeUserSchema
        .omit({ _id: true, createdAt: true })
        .partial()
        .refine(data => Object.keys(data).length > 0, { message: 'Update must contain at least one field'
    })
}).strict();

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