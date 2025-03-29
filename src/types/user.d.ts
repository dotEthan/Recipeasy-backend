import 'express';
import { Document } from "mongodb";

import { Recipe } from "./recipe"
import { ShoppingList } from "./shopping-list"

export type User = {
  _id: string;
  uid: string;
  firstName?: string;
  lastName?: string;
  displayName: string;
  email: string;
  password: string;
  verified: boolean;
  recipes?: Recipe[];
  shoppingLists?: ShoppingList[];
  preferences? : UserPreferences;
  createdAt?: Date;
}

export type UserPreferences = {
  personalFilters?: string[];
  lightMode: boolean;
}

export interface UserDocument extends User, Document{};
