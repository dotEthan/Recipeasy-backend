import { UserRoles } from "../enums";
import { BeCreateUserSchema } from "../schemas/user.schema"
import { NewUserNoId } from "../types/user";
import { zodValidationWrapper } from "./zodParseWrapper";

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
        role: UserRoles.user
    };
    zodValidationWrapper(BeCreateUserSchema, newUser, 'createNewUser.createNewUserUtility');
    return newUser;
}