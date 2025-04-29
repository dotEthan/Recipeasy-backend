
    /**
     * Sanitize user object for front end consumption
     * @group Utilities - Data Sanitizing
     * @param { User } user - User object
     * @returns { FeUser } safeUser - Santized User data
     * @returns { null } - If no user data provided
     * @example
     * import { sanitizeUser } from './sanitizeUser';
     * const cleanUser = santizeUser(user);
     */

import { FeUser, User } from "../types/user";

export const sanitizeUser = (user: User): FeUser => {
    if (!user) return null;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, previousPasswords, createdAt, ...safeUser } = user;
    return safeUser;
  };