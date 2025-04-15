import 'express';
import { Document, ObjectId } from "mongodb";

import { ShoppingList } from "./shopping-list"
import { UserRoles } from '../enums';

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
  passwordResetInProgress: boolean;
  role: UserRoles;
  createdAt?: Date;
}

export type NewUserNoId = Omit<User, '_id'>;

export type UserPreferences = {
  personalFilters?: string[];
  lightMode: boolean;
}

export type UserRatings = {
  recipeId: ObjectId,
  rating: number,
  timestamp: Date
}

export type UsersRecipeData = {
  id: ObjectId;
  copyDetails?: CopyDetails,
}

export type CopyDetails = {
  originalCreatorId: ObjectId,
  originalRecipeId: ObjectId,
  copiedAt: Date,
  updatedAt?: Date,
  modifications: boolean
}

export interface UserDocument extends User, Document{};
