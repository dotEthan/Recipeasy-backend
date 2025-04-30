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
const baseRepository_1 = require("./baseRepository");
const user_schema_1 = require("../schemas/user.schema");
class UserRepository extends baseRepository_1.BaseRepository {
    constructor() {
        super('users');
    }
    createUser(data) {
        return __awaiter(this, void 0, void 0, function* () {
            user_schema_1.BeCreateUserSchema.parse(data);
            return yield this.create(data);
        });
    }
    findById(_id) {
        return __awaiter(this, void 0, void 0, function* () {
            user_schema_1.FindByIdSchema.parse({ _id });
            return yield this.findOne({ _id });
        });
    }
    ;
    findByEmail(email) {
        return __awaiter(this, void 0, void 0, function* () {
            user_schema_1.FindByEmailSchema.parse({ email });
            return yield this.findOne({ email });
        });
    }
    ;
    findIdByEmail(email) {
        return __awaiter(this, void 0, void 0, function* () {
            user_schema_1.FindByEmailSchema.parse({ email });
            const user = yield this.findOne({ email });
            return user === null || user === void 0 ? void 0 : user._id;
        });
    }
    ;
    // Move schema.parse to service functions 
    updateById(_id, updatedData) {
        return __awaiter(this, void 0, void 0, function* () {
            user_schema_1.UpdateByIdSchema.parse({ _id, updatedData });
            return yield this.updateOne({ _id }, updatedData);
        });
    }
    ;
    // No Dupes
    updateRecipeIdArrayByIdNoDupes(_id, updatedData) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log('going in: ', updatedData);
            return yield this.updateOneByMergeNoDupe({ _id }, updatedData);
        });
    }
    ;
    // For Admin Dashboard
    deleteUser(_id) {
        return __awaiter(this, void 0, void 0, function* () {
            user_schema_1.DeleteUserByIdSchema.parse({ _id });
            return yield this.delete({ _id });
        });
    }
}
exports.UserRepository = UserRepository;
