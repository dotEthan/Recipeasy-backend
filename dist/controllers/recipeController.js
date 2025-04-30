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
exports.recipeController = void 0;
const error_1 = require("../types/error");
class RecipeController {
    constructor() {
        this.recipes = [];
        this.getAllRecipes = this.getAllRecipes.bind(this);
        this.createRecipe = this.createRecipe.bind(this);
        this.updateRecipe = this.updateRecipe.bind(this);
        this.deleteRecipe = this.deleteRecipe.bind(this);
    }
    getAllRecipes(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                console.log("recipes: ", this.recipes);
                res.status(200).json({ message: "recipes got", recipes: this.recipes });
            }
            catch (err) {
                const message = err instanceof Error ? err.message : "Failed to Get Recipes";
                next(new error_1.HttpError(500, message));
            }
        });
    }
    createRecipe(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            const body = req.body;
            try {
                const newRecipe = {
                    id: "id2",
                    title: body.text,
                };
                this.recipes.push(newRecipe);
                console.log(this.recipes);
                res
                    .status(200)
                    .json({
                    message: "recipe Added: " + newRecipe.id,
                    recipes: this.recipes,
                });
            }
            catch (err) {
                const message = err instanceof Error ? err.message : "Failed to create Recipe";
                next(new error_1.HttpError(500, message));
            }
        });
    }
    updateRecipe(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            const params = req.params;
            const recipeId = params.recipeId;
            const body = req.body;
            console.log("updating");
            try {
                const recipeIndex = this.recipes.findIndex((recipe) => recipe.id === recipeId);
                if (recipeIndex !== -1) {
                    this.recipes[recipeIndex] = {
                        id: this.recipes[recipeIndex].id,
                        title: body.text,
                    };
                    res
                        .status(200)
                        .json({
                        message: "updated Recipe:" + this.recipes,
                        recipes: this.recipes,
                    });
                    return;
                }
                res.status(404).json({ message: "Could not find Recipe to Update" });
            }
            catch (err) {
                const message = err instanceof Error ? err.message : "Failed to update Recipe";
                next(new error_1.HttpError(500, message));
            }
        });
    }
    deleteRecipe(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            const params = req.params;
            try {
                this.recipes = this.recipes.filter((recipe) => recipe.id !== params.recipeId);
                res
                    .status(200)
                    .json({
                    message: "Recipe Deleted",
                    deletedRecipeId: params.recipeId,
                    recipes: this.recipes,
                });
            }
            catch (err) {
                const message = err instanceof Error ? err.message : "Failed to delete Recipes";
                next(new error_1.HttpError(500, message));
            }
        });
    }
}
exports.recipeController = new RecipeController();
