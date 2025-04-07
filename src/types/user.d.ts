import 'express';
import { Document, ObjectId } from "mongodb";

import { ShoppingList } from "./shopping-list"

export type User = {
  _id: ObjectId;
  firstName?: string;
  lastName?: string;
  displayName: string;
  email: string;
  password: string;
  verified: boolean;
  recipes?: ObjectId[];
  shoppingLists?: ShoppingList[];
  preferences? : UserPreferences;
  ratings?: UserRatings;
  passwordResetInProgress: boolean;
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

export interface UserDocument extends User, Document{};
