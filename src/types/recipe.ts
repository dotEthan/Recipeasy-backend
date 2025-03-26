export interface Recipe {
  id: string
  creatorId: string
  name: string
  url?: string
  rating?: number
  description?: string
  ingredients: Ingredient[]
  directions: Direction[]
  imgPath?: string
  userRating?: number
  publicRating?: number
  isPrivate: boolean
  mealType?: string[]
  tags: string[]
  cookTime?: string
  prepTime?: string
  nutritionalInfo: NutritionalInfo[]
  isPublicRecipe?: boolean
  notes: string[]
}

export type Ingredient = {
  title?: string
  steps: IngredientStep[]
}

export type IngredientStep = {
  name?: string
  amount?: string
  unit?: string
}

export type Direction = {
  title?: string
  steps: string[]
}

export type NutritionalInfo = {
  type?: string
  amount?: string
}
