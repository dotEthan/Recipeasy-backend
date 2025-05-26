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
  visibility: string;
  tags: string[];
  notes: string[];
  userId: ObjectId;
  equipment?: string[];
  internalState: InternalState;
  updatedAt: Date;
  createdAt: Date;
}

export type FeRecipe = Omit<Recipe, 'createdAt'>;
export type FeRecipeOmitId = Omit<Recipe, '_id'>;

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
  userId: ObjectId; 
  rating: number; 
  timestamp: Date; 
}

export type MetaDetails = {
  createdAt: Date;
  updatedAt: Date;
}

export type InternalState = {
    isDeleted: boolean;
    wasDeletedAt: Date;
    deletedBy:  ObjectId;
}