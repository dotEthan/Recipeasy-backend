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
exports.UserService = void 0;
const createNewuser_1 = require("../util/createNewuser");
const user_schema_1 = require("../schemas/user.schema");
const errors_1 = require("../errors");
const shared_schema_1 = require("../schemas/shared.schema");
const ensureObjectId_1 = require("../util/ensureObjectId");
const enums_1 = require("../types/enums");
/**
 * Handles all user related services
 * @todo - post - previousPasswords hash TLL = 1yr for hash
 * @todo - post - Ensure all errors are handled
 * @todo - post - Add logging
 */
// 
class UserService {
    constructor(userRepository, emailVerificationService) {
        this.userRepository = userRepository;
        this.emailVerificationService = emailVerificationService;
    }
    createNewUser(displayName, email, hashedPassword) {
        return __awaiter(this, void 0, void 0, function* () {
            const newUserData = (0, createNewuser_1.createNewUserUtility)(displayName, email, hashedPassword);
            user_schema_1.BeCreateUserSchema.parse(newUserData);
            const creationResult = yield this.userRepository.createUser(newUserData);
            if (!creationResult.acknowledged || !creationResult.insertedId)
                throw new errors_1.ServerError('Create new user failed', { newUserData, location: 'userService.createNewUser' }, enums_1.ErrorCode.MONGODB_RESOURCE_CREATE_FAILED);
            const userId = (0, ensureObjectId_1.ensureObjectId)(creationResult.insertedId);
            const user = yield this.userRepository.findById(userId);
            if (!user)
                throw new errors_1.NotFoundError(`Newly created user not found`, { createdUserId: userId, location: 'userService.createNewUser' }, enums_1.ErrorCode.NO_USER_WITH_ID);
            const verificationSetAndSent = yield this.emailVerificationService.setAndSendVerificationCode(email, displayName, user._id);
            if (!verificationSetAndSent.success)
                throw new errors_1.ServerError(`Verificatin Code not set or sent`, { location: 'userService.createNewUser' }, enums_1.ErrorCode.OPERATION_FAILED);
            return user;
        });
    }
    getUserData(_id) {
        return __awaiter(this, void 0, void 0, function* () {
            const userResponse = yield this.userRepository.findById(_id);
            if (!userResponse)
                throw new errors_1.NotFoundError(`User Not Found relogin`, { userId: _id, location: 'userService.getUserData' }, enums_1.ErrorCode.NO_USER_WITH_ID);
            return userResponse;
        });
    }
    setUserVerified(_id) {
        return __awaiter(this, void 0, void 0, function* () {
            const hasUser = yield this.userRepository.findById(_id);
            if (!hasUser)
                throw new errors_1.NotFoundError(`User Not Found, relogin`, { _id, location: 'userService.setUserVerified' }, enums_1.ErrorCode.NO_USER_WITH_ID);
            const updatedData = { verified: true, updatedAt: new Date() };
            user_schema_1.UpdateByIdSchema.parse({ updatedData });
            const updateResult = yield this.userRepository.updateById(_id, { $set: updatedData });
            if (!(updateResult === null || updateResult === void 0 ? void 0 : updateResult.acknowledged) || (updateResult === null || updateResult === void 0 ? void 0 : updateResult.modifiedCount) === 0)
                throw new errors_1.ServerError('update not successful', { _id, updatedData, location: 'userService.setUserVerified' }, enums_1.ErrorCode.MONGODB_RESOURCE_UPDATE_FAILED);
            return { success: (updateResult.modifiedCount > 0) };
        });
    }
    /**
     * Adds recipeID to user.recipes array when user adds a public recipe to their personal list.
     * @group User Data - updating data
     * @param {ObjectId} userId - user's id
     * @param {ObjectId} originalUserId - User's id that created the recipe
     * @param {ObjectId} recipeId - added recipe's id
     * @return {WithId<UserDocument> | null>} - if User update successful, the user document
     * @example
     * const userService = useUserService();
     * await userService.findUserById('test@test.com');
     */
    updateUserRecipes(userId, originalUserId, recipeId) {
        return __awaiter(this, void 0, void 0, function* () {
            const dataToAdd = {
                id: recipeId,
                copyDetails: {
                    originalCreatorId: (0, ensureObjectId_1.ensureObjectId)(originalUserId),
                    originalRecipeId: (0, ensureObjectId_1.ensureObjectId)(recipeId),
                    copiedAt: new Date(),
                    updatedAt: new Date(),
                    modified: false
                }
            };
            user_schema_1.BeUpdateUsersRecipesSchema.parse(dataToAdd);
            shared_schema_1.IsObjectIdSchema.parse(userId);
            const user = yield this.userRepository.findOneAndUpdate({ _id: userId }, { $addToSet: { recipes: dataToAdd }, $set: { updatedAt: new Date() } });
            if (!user)
                throw new errors_1.ServerError('Update User Failed', { userId, dataToAdd, location: 'userService.updateUserRecipes' }, enums_1.ErrorCode.MONGODB_RESOURCE_UPDATE_FAILED);
            return user;
        });
    }
    /**
     * Returns user based on inputed email
     * @group User Data - retrieval
     * @param {string} email - user's email
     * @return {WithId<UserDocument> | null>} - if User found, the user document
     * @example
     * const userService = useUserService();
     * await userService.findUserById('test@test.com');
     */
    findUserByEmail(email) {
        return __awaiter(this, void 0, void 0, function* () {
            shared_schema_1.IsEmailSchema.parse({ email });
            return yield this.userRepository.findOne({ 'email': email });
        });
    }
    /**
     * Returns user based on inputed id
     * @group User Data - retrieval
     * @param {ObjectId} _id - user's id
     * @return {WithId<UserDocument> | null>} - if User found, the user document
     * @example
     * const userService = useUserService();
     * await userService.findUserById('12332132');
     */
    findUserById(_id) {
        return __awaiter(this, void 0, void 0, function* () {
            shared_schema_1.IsObjectIdSchema.parse({ _id });
            return yield this.userRepository.findOne({ _id });
        });
    }
}
exports.UserService = UserService;
