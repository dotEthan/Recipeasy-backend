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
Object.defineProperty(exports, "__esModule", { value: true });
exports.RecipesRepository = void 0;
const recipe_schema_1 = require("../schemas/recipe.schema");
const baseRepository_1 = require("./baseRepository");
class RecipesRepository extends baseRepository_1.BaseRepository {
    constructor() {
        super('recipes');
    }
    createRecipes(recipes) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log('creating reciperepo');
            recipe_schema_1.FeSavedRecipeArray.parse({ recipes });
            const recipeResponse = yield this.createMany(recipes);
            console.log('recipes return: ', recipeResponse);
            return recipeResponse;
        });
    }
    paginatedFindByIndex(filterBy, options) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log('data: ', filterBy);
            const cursor = yield this.findByIndex(filterBy);
            if (!cursor)
                throw new Error('Query Failed');
            const sort = typeof options.sort === 'object' && 'field' in options.sort
                ? { [options.sort.field]: options.sort.direction }
                : options.sort;
            if (!sort)
                throw new Error('Sorting Requires Options');
            const response = cursor === null || cursor === void 0 ? void 0 : cursor.sort(sort).toArray();
            return response;
        });
    }
}
exports.RecipesRepository = RecipesRepository;
