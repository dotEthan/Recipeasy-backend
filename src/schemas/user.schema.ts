import { ObjectId } from 'mongodb';
import { z } from 'zod';
import { 
    AUTH_PASSWORD_MIN,
    AUTH_DISPLAY_NAME_MIN,
 } from '../constants';
 import { ObjectIdSchema } from "./shared.schema";
import { FeRecipeSchema } from './recipe.schema';


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
    modifications: z.boolean()
}).strict();

export const UserRecipesSchema = z.object({
    id: z.custom<ObjectId>((val) => {
        return ObjectId.isValid(val);
    }, {
        message: "UserRecipe Invalid MongoDB ObjectId"
    }),
    copyDetails: CopyDetailsSchema.optional()
})

export const FeUserSchema = z
  .object({
    _id:  z.custom<ObjectId>((val) => {
        return ObjectId.isValid(val);
    }, {
        message: "FEUser Invalid MongoDB ObjectId"
    }),
    displayName: z.string().min(AUTH_DISPLAY_NAME_MIN),
    email: z.string().email(),
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    password: z.string(),
    verified: z.boolean().default(false),
    recipes: z.array(UserRecipesSchema.optional()),
    shoppingLists: z.array(ShoppingListSchema),
    preferences: PreferencesSchema.optional(),
    role: z.string(),
    createdAt: z.date(),
    updatedAt: z.date(),
    passwordResetInProgress: z.boolean().default(false),
    userRatings: UserRatingsSchema.optional()
  }).strict();

export const UpdateFeUserSchema = FeUserSchema.partial().strict().strict();

export const BeUserSchema = z
.object({
    _id:  z.custom<ObjectId>((val) => {
        return ObjectId.isValid(val);
    }, {
        message: "BeUser Invalid MongoDB ObjectId"
    }),
    displayName: z.string().min(AUTH_DISPLAY_NAME_MIN),
    email: z.string().email(),
    firstName: z.string(),
    lastName: z.string(),
    password: z.string(),
    verified: z.boolean().default(false),
    recipes: z.array(ObjectIdSchema),
    shoppingLists: z.array(ShoppingListSchema),
    preferences: PreferencesSchema.optional(),
    createdAt: z.date(),
    updatedAt: z.date(),
    role: z.string(),
    passwordResetInProgress: z.boolean().default(false)
}).strict();

export const BeCreateUserSchema = BeUserSchema.omit({ _id: true}).strict();

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
    recipeResponse: z.array(FeRecipeSchema)
}).strict();

export const SetPasswordSchema = z.object({
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