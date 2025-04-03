import { ObjectId } from 'mongodb';
import { z } from 'zod';
import { 
    AUTH_PASSWORD_MIN,
    AUTH_DISPLAY_NAME_MIN,
 } from '../constants';


export const ShoppingListSchema = z.object({});  // TODO Import once other schema added

export const PreferencesSchema = z.object({
    personalFilters: z.array(z.string()),
    lightMode: z.boolean().default(true)
});

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
    recipes: z.array(z.string()),
    shoppingLists: z.array(ShoppingListSchema),
    preferences: PreferencesSchema.optional(),
    createdAt: z.date()
  })
  .strict();

export const UpdateFeUserSchema = FeUserSchema.partial();

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
    recipes: z.array(z.string()),
    shoppingLists: z.array(ShoppingListSchema),
    preferences: PreferencesSchema.optional(),
    createdAt: z.date(),
    passwordResetInProgress: z.boolean().default(false)
});

export const BeCreateUserSchema = BeUserSchema.omit({ _id: true});

export const RegisterUserSchema = z.object({
    displayName: z.string().min(1),
    email: z.string().email(),
    password: z.string().min(AUTH_PASSWORD_MIN)
})

export const LoginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(AUTH_PASSWORD_MIN)
})

export const SetPasswordSchema = z.object({
    email: z.string().email(),
    password: z.string().min(AUTH_PASSWORD_MIN)
})

export const CodeSchema = z.object({
    code: z.string()
})

export const ResetPasswordSchema = z.object({
    email: z.string().email(),
})

export const FindByIdSchema = z.object({
    _id: z.custom<ObjectId>((val) => {
        return ObjectId.isValid(val);
    }, {
        message: "Find By Id Invalid MongoDB ObjectId"
    })
});

export const FindByEmailSchema = z.object({
    email: z.string().email(),
});

export const UpdateByIdSchema = z.object({
    _id: z.custom<ObjectId>((val) => {
        return ObjectId.isValid(val);
    }, {
        message: "Updating User Invalid MongoDB ObjectId"
    }),
    updatedData: BeUserSchema
        .omit({ _id: true, createdAt: true })
        .partial()
        .refine(data => Object.keys(data).length > 0, { message: 'Update must contain at least one field'
    })
});

export const DeleteUserByIdSchema = z.object({
    _id: z.custom<ObjectId>((val) => {
        return ObjectId.isValid(val);
    }, {
        message: "Deleting User Invalid MongoDB ObjectId"
    })
});