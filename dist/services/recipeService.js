"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RecipeService = void 0;
const enums_1 = require("../types/enums");
const errors_1 = require("../errors");
const ensureObjectId_1 = require("../util/ensureObjectId");
const mergeAlterations_1 = require("../util/mergeAlterations");
const recipe_schema_1 = require("../schemas/recipe.schema");
const shared_schema_1 = require("../schemas/shared.schema");
const user_schema_1 = require("../schemas/user.schema");
/**
 * Handles all recipe related services
 * @todo - post - Ensure all errors are handled
 * @todo - post - Add logging
 */
// 
class RecipeService {
    constructor(recipesRepository, userRepository) {
        this.recipesRepository = recipesRepository;
        this.userRepository = userRepository;
    }
    /**
     * Saves New Recipe
     * @group Recipe Management - Saving
     * @param {Recipe} recipe - Recipe to be saved
     * @param {ObjectId} userId - userId
     * @return {StandardRecipeResponse} - succes, message, recipe, error
     * @throws {ServerError} 500 - if the create recipe fails
     * @example
     * const recipeService = useRecipeService();
     * await recipeService.saveRecipe(req, false, errorMessage);
     */
    saveNewRecipe(recipe, userId) {
        return __awaiter(this, void 0, void 0, function* () {
            let success = false;
            recipe_schema_1.NewRecipeSchema.parse({ recipe });
            const recipeSaveResponse = yield this.recipesRepository.createRecipe(recipe);
            if (!recipeSaveResponse.acknowledged || !recipeSaveResponse.insertedId)
                throw new errors_1.ServerError('Create recipe failed', { recipe, recipeSaveResponse, location: 'recipeService.saveRecipe' }, enums_1.ErrorCode.MONGODB_RESOURCE_CREATE_FAILED);
            const savedRecipe = yield this.recipesRepository.findById(recipeSaveResponse.insertedId);
            if (savedRecipe === null)
                throw new errors_1.ServerError('Find Saved recipe by insertedId failed', {
                    savedRecipe,
                    insertedId: recipeSaveResponse.insertedId,
                    location: 'recipeService.saveRecipe'
                }, enums_1.ErrorCode.MONGODB_RESOURCE_FINDBYID_FAILED);
            const userUpdateRes = yield this.userRepository.addToUsersRecipesArray(userId, { id: (0, ensureObjectId_1.ensureObjectId)(recipeSaveResponse.insertedId) });
            if ((userUpdateRes === null || userUpdateRes === void 0 ? void 0 : userUpdateRes.modifiedCount) && (userUpdateRes === null || userUpdateRes === void 0 ? void 0 : userUpdateRes.modifiedCount) > 0)
                success = true;
            return { success, recipe: savedRecipe };
        });
    }
    /**
     * Get Recipes with queries
     * @group Recipe Management - retrieval
     * @todo - post - Ensure 'get' stays one step ahead? eg: get 50 first time, then 25 per.
     * @todo - post - remove Users own recipes? or leave as little 'Oh that's mine' moments
     * @todo - post - Generic query args?
     * @todo - post - make 'sort' options in getRecipes
     * @param {Visibility} public Status - 'public'/'private'
     * @param {number} limit - recipes per page
     * @param {number} skip - Start new results after N recipes
     * @return {PaginateResponse} - succes, message, recipe, error
     * @example
     * const recipeService = useRecipeService();
     * await recipeService.getRecipes(Visibility.PUBLIC, 25, 75);
     */
    getRecipes(visibility, limit, skip) {
        return __awaiter(this, void 0, void 0, function* () {
            const query = {
                "internalData.isDeleted": { $ne: true }
            };
            if (visibility) {
                query.visibility = visibility;
            }
            const [recipes, total] = yield Promise.all([
                this.recipesRepository.paginatedFindByIndex(query, {
                    skip,
                    limit,
                    projection: {
                        createdAt: 0,
                        internalData: 0
                    }
                }),
                this.recipesRepository.getTotalDocuments(query)
            ]);
            return { totalDocs: total, data: recipes };
        });
    }
    /**
     * Update Existing Recipes
     * @group Recipe Management - Updating
     * @param {Recipe} recipe - Updated Recipe
     * @param {number} userId - User's _id
     * @return {StandardRecipeResponse} - Success status and updated Recipe
     * @example
     * const recipeService = useRecipeService();
     * await recipeService.updateRecipe(recipe, ObjectId('1234abcd'));
     */
    updateRecipe(recipe, userId) {
        return __awaiter(this, void 0, void 0, function* () {
            const recipeCreatorId = (0, ensureObjectId_1.ensureObjectId)(recipe.userId);
            const recipeId = (0, ensureObjectId_1.ensureObjectId)(recipe._id);
            const userIsCreator = recipeCreatorId.equals(userId);
            const originalRecipe = yield this.recipesRepository.findById(recipeId);
            if (!originalRecipe)
                throw new errors_1.ServerError('updateRecipe- Cannot find original recipe', { originalRecipe, recipeId }, enums_1.ErrorCode.MONGODB_RESOURCE_FINDBYID_FAILED);
            let recipeResponse;
            if (userIsCreator) {
                recipe_schema_1.FeUpdateRecipeSchema.parse({ recipe });
                shared_schema_1.IsObjectIdSchema.parse({ _id: recipeId });
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                const { _id } = recipe, recipeNoId = __rest(recipe, ["_id"]);
                const recipeSaveResponse = yield this.recipesRepository.updateRecipe({ _id: recipeId }, recipeNoId);
                if (recipeSaveResponse === null)
                    throw new errors_1.ServerError('Updating recipe failed: recipe does not exist', { recipeId, recipe }, enums_1.ErrorCode.MONGODB_RESOURCE_UPDATE_FAILED);
                recipeResponse = recipeSaveResponse;
            }
            else {
                const alterations = this.findRecipeAlterations(originalRecipe, recipe);
                recipe_schema_1.PartialRecipeSchema.parse(alterations);
                const updateResponse = yield this.userRepository.updateAlterationsOnUserRecipes(userId, recipeId, alterations);
                if (updateResponse == null)
                    throw new errors_1.ServerError('updateRecipe - Updating User.recipes.alterations failed', { userId, recipeId, alterations }, enums_1.ErrorCode.MONGODB_RESOURCE_UPDATE_FAILED);
                if (updateResponse.matchedCount === 0)
                    throw new errors_1.BadRequestError('updateRecipe - No user matched userId', { userId }, enums_1.ErrorCode.NO_USER_WITH_ID);
                if (updateResponse.modifiedCount === 0)
                    throw new errors_1.ServerError('updateRecipe - Did not update alterations object', { userId, recipeId, alterations }, enums_1.ErrorCode.MONGODB_RESOURCE_UPDATE_FAILED);
                recipeResponse = (0, mergeAlterations_1.mergeAlterations)(originalRecipe, alterations);
            }
            return { success: true, recipe: recipeResponse };
        });
    }
    /**
     * Get User's personal recipes with queries
     * @group Recipe Management - retrieval
     * @param {User} user - User to get recipes for
     * @return {PaginateResponse} - userRecipes set up for pagination
     * @example
     * const recipeService = useRecipeService();
     * await recipeService.getUsersRecipes(currentUser);
     */
    getUsersRecipes(user) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c;
            const recipeIdArray = (_a = user.recipes) === null || _a === void 0 ? void 0 : _a.map((item) => (0, ensureObjectId_1.ensureObjectId)(item.id));
            const query = { _id: { $in: recipeIdArray } };
            const [recipes, total] = yield Promise.all([
                this.recipesRepository.paginatedFindByIndex(query, {
                    skip: 0,
                    limit: 50,
                    projection: {
                        createdAt: 0,
                        internalData: 0
                    }
                }),
                this.recipesRepository.getTotalDocuments(query)
            ]);
            const userRecipesMap = new Map((_c = (_b = user.recipes) === null || _b === void 0 ? void 0 : _b.map(item => [item.id.toString(), item])) !== null && _c !== void 0 ? _c : []);
            const mergedRecipes = recipes.map(recipe => {
                const userRecipe = userRecipesMap.get(recipe._id.toString());
                return (0, mergeAlterations_1.mergeAlterations)(recipe, userRecipe === null || userRecipe === void 0 ? void 0 : userRecipe.alterations);
            });
            return { totalDocs: total, data: mergedRecipes };
        });
    }
    /**
     * Delete Recipe
     * @group Recipe Management - deletion
     * @param {ObjectId} userId - Id of user requesting Deletion
     * @param {ObjectId} recipeId - Id of recipe to delete
     * @returns {ErrorResponse} 400 - Validation Error
     * @throws {BadRequestError} 400 - If Zod schema Parsing fails
     * @throws {ServerError} 500 - if recipe deletion or user update fail
     * @example
     * const recipeService = useRecipeService();
     * await recipeService.deleteRecipe(ObjectId('1234abcd'), ObjectId('9876zyxw'));
     */
    deleteRecipe(userId, recipeId) {
        return __awaiter(this, void 0, void 0, function* () {
            const thisRecipe = yield this.recipesRepository.findById(recipeId);
            if (!thisRecipe)
                throw new errors_1.NotFoundError('Deletion Failed: Recipe Not Found', { location: "recipeService.deleteRecipe" }, enums_1.ErrorCode.RESOURCE_TO_DELETE_NOT_FOUND);
            const recipesOwnersId = (0, ensureObjectId_1.ensureObjectId)(thisRecipe.userId);
            let updateRecipeResponse;
            if (recipesOwnersId.equals(userId)) {
                const internalState = {
                    isDeleted: true,
                    wasDeletedAt: new Date(),
                    deletedBy: userId
                };
                recipe_schema_1.InternalStateSchema.parse(internalState);
                updateRecipeResponse = yield this.recipesRepository.updateRecipeObject({ _id: recipeId }, { internalState });
            }
            if (updateRecipeResponse &&
                (!updateRecipeResponse.acknowledged ||
                    updateRecipeResponse.modifiedCount === 0))
                throw new errors_1.ServerError('Deletion Failed: Recipe deletion failed', { recipeId, location: 'recipeService.deleteRecipe', }, enums_1.ErrorCode.MONGODB_RESOURCE_UPDATE_FAILED);
            const usersRecipesId = { id: recipeId };
            user_schema_1.UserRecipesIdSchema.parse(usersRecipesId);
            const updateUserResponse = yield this.userRepository.removeFromUserRecipeArray(userId, usersRecipesId);
            if (!updateUserResponse.acknowledged ||
                updateUserResponse.modifiedCount === 0)
                throw new errors_1.ServerError('Deletion Failed: Updating User Recipe array failed', { userId, location: 'recipeService.deleteRecipe', }, enums_1.ErrorCode.MONGODB_RESOURCE_UPDATE_FAILED);
            return { success: true };
        });
    }
    /**
     * Compares and returns all changes to updateRecipe compared to originalRecipe
     * @group Recipe Management - retrieval
     * @param {Recipe} originalRecipe - original recipe
     * @param {Recipe} updatedRecipe - updated Recipe
     * @return {Partial<Recipe>} - a object filled with all altered values
     * @example
     * await this.findRecipeAlterations(oldRecipe, updateRecipe);
     */
    findRecipeAlterations(originalRecipe, updatedRecipe) {
        const changes = {};
        for (const key in updatedRecipe) {
            if (key === '_id')
                continue;
            const typedKey = key;
            const originalValue = originalRecipe[typedKey];
            const updatedValue = updatedRecipe[typedKey];
            if (JSON.stringify(originalValue) !== JSON.stringify(updatedValue)) {
                // @ts-expect-error - Partial<Recipe> assignment is safe after JSON comparison
                changes[typedKey] = updatedValue;
            }
        }
        return changes;
    }
}
exports.RecipeService = RecipeService;
