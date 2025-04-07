import { Document, ObjectId } from "mongodb"

export interface RecipeDocument extends Recipe, Document{};

export type Recipe = {
  _id: ObjectId;
  name: string;
  description?: string;
  imgPath?: string;
  info: RecipeInfo;
  ratings?: RecipeRatings[];
  url?: string;
  ingredients: Ingredient[];
  directions: Direction[];
  visibility: 'public' | 'private';
  tags: string[];
  notes: string[];
  userId: ObjectId;
  originalCreatorId?: ObjectId,
  copyDetails?: CopyDetails,
  metaData?: MetaDetails
}

export type RecipeInfo = {
  mealType?: string[];
  cuisineType?: string;
  cookTime?: Duration;
  prepTime?: Duration;
  servingSize?: string;
  nutritionalInfo: NutritionalInfo[];
}

type Duration = {
  value: number;
  unit: 'minutes' | 'hours' | 'days';
};

export type Ingredient = {
  title?: string;
  steps: IngredientStep[];
}

export type IngredientStep = {
  name?: string;
  amount?: string;
  unit?: string;
  process?: string;
}

export type Direction = {
  title?: string;
  steps: string[];
}

export type NutritionalInfo = {
  name?: string;
  amount?: string;
}

export type RecipeRatings = { 
  ratings: RatingItem[];
  averageRating: number;
  totalRatings: number;
  ratingsSum: number;
}

export type RatingItem = {
  userId: string; 
  rating: number; 
  timestamp: Date; 
}

export type CopyDetails = {
  originalRecipeId?: ObjectId,
  copiedAt?: Date,
  modifications?: boolean
}
export type MetaDetails = {
  createdAt: Date;
  updatedAt: Date;
}