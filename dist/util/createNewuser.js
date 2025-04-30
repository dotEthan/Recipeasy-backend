"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createNewUserUtility = void 0;
const enums_1 = require("../enums");
const user_schema_1 = require("../schemas/user.schema");
const createNewUserUtility = (displayName, email, hashedPassword) => {
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
        role: enums_1.UserRoles.user
    };
    user_schema_1.BeCreateUserSchema.parse(newUser);
    return newUser;
};
exports.createNewUserUtility = createNewUserUtility;
