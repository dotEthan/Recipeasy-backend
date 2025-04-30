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
exports.UserRepository = void 0;
const baseRepository_1 = require("../base/baseRepository");
const shared_schema_1 = require("../../schemas/shared.schema");
/**
 * 'users' Collection specific Mongodb Related calls
 * @todo - post - replace id/email with filter: Filter
 */
// 
class UserRepository extends baseRepository_1.BaseRepository {
    constructor() {
        super('users');
    }
    createUser(data) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.create(data);
        });
    }
    findById(_id, addedProjection) {
        return __awaiter(this, void 0, void 0, function* () {
            shared_schema_1.IsObjectIdSchema.parse({ _id });
            const defaultProjection = { createdAt: 0, previousPasswords: 0, password: 0 };
            const projection = addedProjection !== null && addedProjection !== void 0 ? addedProjection : defaultProjection;
            const findResult = yield this.findOne({ _id }, projection);
            return findResult ? findResult : null;
        });
    }
    ;
    findPartialById(_id, addedProjection) {
        return __awaiter(this, void 0, void 0, function* () {
            shared_schema_1.IsObjectIdSchema.parse({ _id });
            const defaultProjection = { createdAt: 0, previousPasswords: 0, password: 0 };
            const projection = addedProjection !== null && addedProjection !== void 0 ? addedProjection : defaultProjection;
            return yield this.findOne({ _id }, projection);
        });
    }
    ;
    findByEmail(email, addedProjection) {
        return __awaiter(this, void 0, void 0, function* () {
            shared_schema_1.IsEmailSchema.parse({ email });
            const defaultProjection = { createdAt: 0, previousPasswords: 0, password: 0 };
            const projection = addedProjection !== null && addedProjection !== void 0 ? addedProjection : defaultProjection;
            return yield this.findOne({ email }, projection);
        });
    }
    ;
    findByEmailWithInternals(email) {
        return __awaiter(this, void 0, void 0, function* () {
            shared_schema_1.IsEmailSchema.parse({ email });
            return yield this.findOne({ email });
        });
    }
    ;
    findIdByEmail(email, addedProjection) {
        return __awaiter(this, void 0, void 0, function* () {
            shared_schema_1.IsEmailSchema.parse({ email });
            const defaultProjection = { createdAt: 0, previousPasswords: 0, password: 0 };
            const projection = addedProjection !== null && addedProjection !== void 0 ? addedProjection : defaultProjection;
            const user = yield this.findOne({ email }, projection);
            return user === null || user === void 0 ? void 0 : user._id;
        });
    }
    ;
    updateById(_id, update) {
        return __awaiter(this, void 0, void 0, function* () {
            shared_schema_1.IsObjectIdSchema.parse({ _id });
            return yield this.updateOne({ _id }, update);
        });
    }
    ;
    updateCachedPasswords(_id, cachedPasswordArray) {
        return __awaiter(this, void 0, void 0, function* () {
            shared_schema_1.IsObjectIdSchema.parse({ _id });
            return yield this.updateOne({ _id }, { $set: {
                    previousPasswords: cachedPasswordArray,
                    updatedAt: new Date()
                } });
        });
    }
    // No Dupes
    // TODO - post - combine these three? updateUserObject
    addToUsersRecipesArray(_id, usersRecipesObject) {
        return __awaiter(this, void 0, void 0, function* () {
            shared_schema_1.IsObjectIdSchema.parse({ _id });
            return yield this.updateByMergeOneNoDupe({ _id }, {
                $addToSet: { recipes: usersRecipesObject },
                $set: { updatedAt: new Date() }
            });
        });
    }
    ;
    // No Dupes
    updateAlterationsOnUserRecipes(_id, recipeId, alterations) {
        return __awaiter(this, void 0, void 0, function* () {
            shared_schema_1.IsObjectIdSchema.parse({ _id });
            shared_schema_1.IsObjectIdSchema.parse({ _id: recipeId });
            return yield this.updateOne({
                _id,
                "recipes.id": recipeId
            }, {
                $set: {
                    "recipes.$.alterations": alterations,
                    "recipes.$.copyDetails.modified": true,
                    "updatedAt": new Date()
                }
            });
        });
    }
    ;
    removeFromUserRecipeArray(_id, dataToRemove) {
        return __awaiter(this, void 0, void 0, function* () {
            shared_schema_1.IsObjectIdSchema.parse({ _id });
            return yield this.updateOne({ _id }, {
                $pull: { recipes: dataToRemove },
                $set: { updatedAt: new Date() }
            });
        });
    }
    // For Admin Dashboard
    deleteUser(_id) {
        return __awaiter(this, void 0, void 0, function* () {
            shared_schema_1.IsObjectIdSchema.parse({ _id });
            return yield this.delete({ _id });
        });
    }
}
exports.UserRepository = UserRepository;
