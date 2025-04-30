"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mergeAlterations = mergeAlterations;
/**
 * Ensure User's alterations are represented in User Recipes
 * @param { Recipe } publicRecipe - The original Public Recipe object
 * @param { Partial<Recipe> } alterations - Alterations made by User
 * @returns { Recipe } - The combined result for frontEnd User Recipe list
 */
function mergeAlterations(publicRecipe, alterations) {
    const mergeData = Object.assign(Object.assign({}, publicRecipe), alterations);
    return mergeData;
}
