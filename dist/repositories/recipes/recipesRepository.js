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
const shared_schema_1 = require("../../schemas/shared.schema");
const baseRepository_1 = require("../base/baseRepository");
/**
 * Recipes Collection specific Mongodb Related calls
 * @todo - post - refactor with coming calls - Generic VS Specific
 */
// 
class RecipesRepository extends baseRepository_1.BaseRepository {
    constructor() {
        super('recipes');
    }
    createRecipe(recipe) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.create(recipe);
        });
    }
    updateRecipe(filter, recipe) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.findOneAndReplace(filter, recipe);
        });
    }
    updateRecipeObject(filter, updatedData) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.updateOne(filter, { $set: Object.assign({}, updatedData) });
        });
    }
    paginatedFindByIndex(filterBy, options) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.findPaginated(filterBy, options);
        });
    }
    findById(_id) {
        return __awaiter(this, void 0, void 0, function* () {
            shared_schema_1.IsObjectIdSchema.parse({ _id });
            return yield this.findOne({ _id }, { createdAt: 0, internalData: 0 });
        });
    }
    ;
}
exports.RecipesRepository = RecipesRepository;
