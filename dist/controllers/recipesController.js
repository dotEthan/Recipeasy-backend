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
exports.RecipeController = void 0;
const cloudinary_1 = require("cloudinary");
const errors_1 = require("../errors");
const enums_1 = require("../types/enums");
const ensureObjectId_1 = require("../util/ensureObjectId");
const recipe_schema_1 = require("../schemas/recipe.schema");
const zod_1 = require("zod");
/**
 * Recipe based req and res handling
 * @todo - post - Double check for unhandled errors
 */
// 
class RecipeController {
    constructor(recipeService) {
        this.recipeService = recipeService;
        this.saveNewRecipe = (req, res) => __awaiter(this, void 0, void 0, function* () {
            var _a;
            const recipe = req.body.recipe;
            const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
            if (!userId)
                throw new errors_1.UnauthorizedError('No user Logged in, please log in and try again', { reqUser: req.user, location: 'recipesController.saveNewRecipe' }, enums_1.ErrorCode.REQ_USER_MISSING);
            if (!recipe)
                throw new errors_1.BadRequestError('Recipe data not found', { recipe, location: 'recipesController.saveNewRecipe' }, enums_1.ErrorCode.MISSING_REQUIRED_BODY_DATA);
            const response = yield this.recipeService.saveNewRecipe(recipe, userId);
            recipe_schema_1.StandardRecipeResponseSchema.parse(response);
            res.status(201).json(response);
        });
        this.getPublicRecipes = (req, res) => __awaiter(this, void 0, void 0, function* () {
            const visibility = req.query.visibility;
            const page = parseInt(req.query.page || '1', 10);
            const limit = parseInt(req.query.limit || '25', 10);
            const skip = (page - 1) * limit;
            const response = yield this.recipeService.getRecipes(visibility, limit, skip);
            if (response === null)
                throw new errors_1.NotFoundError('No public recipes found ', { response, location: 'recipesController.getPublicRecipes' }, enums_1.ErrorCode.NO_PUBLIC_RECIPES_FOUND);
            zod_1.z.array(recipe_schema_1.FeRecipeSchema).parse(response.data);
            res.status(200).json(response === null || response === void 0 ? void 0 : response.data);
        });
        this.updateRecipe = (req, res) => __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            const recipeId = req.params.id;
            const recipe = req.body.recipe;
            if (!recipeId || recipeId !== recipe._id.toString())
                throw new errors_1.BadRequestError('URL Recipe Id does not match Recipe Object ID', { recipeId, recipe, location: 'recipesController.updateRecipe' }, enums_1.ErrorCode.PARAM_ID_NOT_EQUAL_TO_RESOURCE_ID);
            if (!((_a = req.user) === null || _a === void 0 ? void 0 : _a._id))
                throw new errors_1.UnauthorizedError('request userId not found, relogin', { user: req.user, location: 'recipesController.updateRecipe' }, enums_1.ErrorCode.REQ_USER_MISSING);
            const userId = (_b = req.user) === null || _b === void 0 ? void 0 : _b._id;
            const response = yield this.recipeService.updateRecipe(recipe, userId);
            recipe_schema_1.StandardRecipeResponseSchema.parse(response);
            res.status(201).json(response);
        });
        this.deleteRecipe = (req, res) => __awaiter(this, void 0, void 0, function* () {
            var _a;
            const recipeId = (0, ensureObjectId_1.ensureObjectId)(req.params.id);
            const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
            if (!recipeId)
                throw new errors_1.BadRequestError('Recipe id to delete not provided: relogin', { recipeId, location: 'recipesController.deleteRecipe' }, enums_1.ErrorCode.RESOURCE_ID_PARAM_MISSING);
            if (!userId)
                throw new errors_1.UnauthorizedError('User Not Found: relogin', { userId, location: 'recipesController.deleteRecipe' }, enums_1.ErrorCode.REQ_USER_MISSING);
            yield this.recipeService.deleteRecipe(userId, recipeId);
            res.status(204).end();
        });
        this.uploadRecipeImage = (req, res) => __awaiter(this, void 0, void 0, function* () {
            var _a;
            if (!req.file) {
                throw new errors_1.BadRequestError("No file uploaded", { location: 'recipesController.uploadRecipeImage' }, enums_1.ErrorCode.MISSING_REQ_FILE);
            }
            const options = {
                folder: `recipeasy/user_uploads/${(_a = req.user) === null || _a === void 0 ? void 0 : _a._id.toString()}`,
                use_filename: true,
                unique_filename: true,
                overwrite: false,
                transformation: [
                    {
                        height: 350,
                        crop: 'scale',
                        fetch_format: "webp",
                        quality: "auto",
                        effect: "sharpen:30"
                    }
                ],
            };
            const base64File = req.file.buffer.toString('base64');
            const dataURI = `data:${req.file.mimetype};base64,${base64File}`;
            const uploadResult = yield cloudinary_1.v2.uploader.upload(dataURI, options);
            if (!uploadResult.secure_url)
                throw new errors_1.ServerError('Image upload URL missing, try again?', { uploadResult, location: 'recipesController.uploadRecipeImage' }, enums_1.ErrorCode.EXPECTED_DATA_MISSING);
            res.status(201).json({ success: true, url: uploadResult.secure_url });
        });
        this.deleteRecipeImage = (req, res) => __awaiter(this, void 0, void 0, function* () {
            const publicId = req.params.id;
            const imagePublicId = decodeURIComponent(publicId);
            if (!imagePublicId)
                throw new errors_1.BadRequestError('imagePublicId malformed', { publicId, location: 'recipesController.deleteRecipeImage' }, enums_1.ErrorCode.RESOURCE_ID_PARAM_MISSING);
            yield cloudinary_1.v2.uploader.destroy(imagePublicId);
            res.status(204).end();
        });
    }
}
exports.RecipeController = RecipeController;
