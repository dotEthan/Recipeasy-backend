import { BeCreateUserSchema } from "../schemas/user.schema"
import { NewUserNoId } from "../types/user";

export const createNewUserUtility = (displayName:string, email:string, hashedPassword:string): NewUserNoId => {
    const newUser = {
        displayName,
        email,
        password: hashedPassword,
        createdAt: new Date(),
        updatedAt: new Date(),
        verified: false,
        firstName: '',
        lastName: '',
        recipes: [],
        shoppingLists: [],
        preferences: {
            personalFilters: [],
            lightMode: true,
        },
        passwordResetInProgress: false
    };
    BeCreateUserSchema.parse(newUser);
    return newUser
}