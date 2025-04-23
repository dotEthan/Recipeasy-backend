import { Recipe } from "../types/recipe";

/**
 * Ensure User's alterations are represented in User Recipes
 * @param { Recipe } publicRecipe - The original Public Recipe object
 * @param { Partial<Recipe> } alterations - Alterations made by User
 * @returns { Recipe } - The combined result for frontEnd User Recipe list
 */
export function mergeAlterations(publicRecipe: Recipe, alterations: Partial<Recipe>): Recipe {
  const mergeData =  { ...publicRecipe, ...alterations };
  return mergeData;
}