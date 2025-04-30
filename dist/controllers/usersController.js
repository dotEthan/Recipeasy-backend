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
exports.UserController = void 0;
const user_schema_1 = require("../schemas/user.schema");
const errors_1 = require("../errors");
const ensureObjectId_1 = require("../util/ensureObjectId");
const recipe_schema_1 = require("../schemas/recipe.schema");
const zod_1 = require("zod");
const enums_1 = require("../types/enums");
/**
 * User based req and res handling
 * @todo - post - Error Handling
 */
// 
class UserController {
    constructor(userService, recipeService) {
        this.userService = userService;
        this.recipeService = recipeService;
        this.getUsersData = (req, res) => __awaiter(this, void 0, void 0, function* () {
            const userId = req.params.id;
            if (!userId)
                throw new errors_1.BadRequestError('UserId missing from request', { location: 'usersController.getUsersData', reqParams: req.params }, enums_1.ErrorCode.RESOURCE_ID_PARAM_MISSING);
            const freshUser = yield this.userService.getUserData((0, ensureObjectId_1.ensureObjectId)(userId));
            let userRecipes = [];
            let totalRecipes = 0;
            if (freshUser.recipes && freshUser.recipes.length > 0) {
                const paginatedResponse = yield this.recipeService.getUsersRecipes(freshUser);
                userRecipes = paginatedResponse.data;
                totalRecipes = paginatedResponse.totalDocs;
            }
            user_schema_1.FeUserSchema.parse(freshUser);
            zod_1.z.array(recipe_schema_1.FeRecipeSchema).parse(userRecipes);
            res.status(200).json({ user: freshUser, userRecipes, totalRecipes });
        });
        this.updateUserRecipes = (req, res) => __awaiter(this, void 0, void 0, function* () {
            const currentUserId = (0, ensureObjectId_1.ensureObjectId)(req.params.id);
            if (!currentUserId)
                throw new errors_1.BadRequestError('User Id Param not valid', { currentUserId, location: 'usersController.updateUserRecipes' }, enums_1.ErrorCode.RESOURCE_ID_PARAM_MISSING);
            const toBeAddedRecipeId = (0, ensureObjectId_1.ensureObjectId)(req.body.recipeId);
            const originalUserId = (0, ensureObjectId_1.ensureObjectId)(req.body.originalUserId);
            const updatedUserResponse = yield this.userService.updateUserRecipes(currentUserId, originalUserId, toBeAddedRecipeId);
            user_schema_1.FeUserSchema.parse(updatedUserResponse);
            res.status(201).json({ success: true, user: updatedUserResponse });
        });
    }
}
exports.UserController = UserController;
