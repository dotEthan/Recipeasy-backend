import 'express';
import { Document, ObjectId } from "mongodb";

import { ShoppingList } from "./shopping-list"
import { UserRoles } from '../enums';

export type FeUser = Omit<User, 'updatedAt', 'createdAt', 'previousPasswords'>;

export type User = {
  _id: ObjectId;
  firstName?: string;
  lastName?: string;
  displayName: string;
  email: string;
  password: string;
  verified: boolean;
  recipes?: UsersRecipeData[];
  shoppingLists?: ShoppingList[];
  preferences? : UserPreferences;
  ratings?: UserRatings;
  passwordResetData?: PasswordResetData;
  previousPasswords?: PreviousPasssword[];
  role: UserRoles;
  createdAt?: Date;
  updateAt?: Date;
}

export type NewUserNoId = Omit<User, '_id'>;

export type UserPreferences = {
  personalFilters?: string[];
  lightMode: boolean;
}

export type UserRatings = {
  recipeId: ObjectId;
  rating: number;
  timestamp: Date;
}

export type UsersRecipeData = {
  id: ObjectId;
  copyDetails?: CopyDetails;
  alterations?: Partial<Recipe>;
}

export type CopyDetails = {
  originalCreatorId: ObjectId;
  originalRecipeId: ObjectId;
  copiedAt: Date;
  updatedAt?: Date;
  modified: boolean; // TODO Should be 'modified'
}

export type PasswordResetData = {
  resetInProgress: boolean;
  resetRequestedAt: Date;
  attempts: number;
  expiresAt: Date;
}

export type PreviousPasssword = {
  hash: string;
  deprecatedAt: Date;
}

export interface UserDocument extends User, Document{};

export type MongoDbUserProjection = Partial<Record<keyof UserDocument, 0 | 1 | boolean>>;