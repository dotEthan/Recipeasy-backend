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
exports.BaseRepository = void 0;
const database_1 = require("../../config/database");
const errors_1 = require("../../errors");
const enums_1 = require("../../types/enums");
/**
 * Base Mongodb Related calls
 * @todo - post - Remove any not currently used
 */
// 
class BaseRepository {
    constructor(collectionName) {
        this._collection = null;
        this.collectionName = collectionName;
    }
    get collection() {
        if (!this._collection) {
            const db = database_1.Database.getInstance().getDb();
            this._collection = db.collection(this.collectionName);
        }
        if (!this._collection) {
            const dbError = new errors_1.ServerError('MongDB Collection not found', { location: 'baseRepository.get.collection' }, enums_1.ErrorCode.MONGODB_COLLECTION_NOT_FOUND, false);
            throw dbError;
        }
        return this._collection;
    }
    findOne(filter_1) {
        return __awaiter(this, arguments, void 0, function* (filter, projection = {}) {
            return yield this.collection.findOne(filter, { projection });
        });
    }
    findByIndex(filter) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.collection.find(filter);
        });
    }
    findPaginated(filter, options) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.collection
                .find(filter)
                .sort(options.sort || {})
                .skip(options.skip || 0)
                .limit(options.limit || 0)
                .project(options.projection || {})
                .toArray();
        });
    }
    create(data) {
        return __awaiter(this, void 0, void 0, function* () {
            const now = new Date();
            const insertingDocument = Object.assign(Object.assign({}, data), { createdAt: now, updatedAt: now });
            return yield this.collection.insertOne(insertingDocument);
        });
    }
    findOneAndReplace(filter, updatedData) {
        return __awaiter(this, void 0, void 0, function* () {
            const insertingDocument = Object.assign(Object.assign({}, updatedData), { updatedAt: new Date() });
            return yield this.collection.findOneAndReplace(filter, insertingDocument, { returnDocument: 'after' });
        });
    }
    findOneAndUpdate(filter, updatedData) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.collection.findOneAndUpdate(filter, updatedData, { returnDocument: 'after' });
        });
    }
    // Will merge data over existing
    updateOne(filter, updatedData) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.collection.updateOne(filter, updatedData);
        });
    }
    // Will merge data into existing, no duplicates
    updateByMergeOneNoDupe(filter, updatedData) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.collection.updateOne(filter, updatedData);
        });
    }
    delete(filter) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.collection.deleteOne(filter);
        });
    }
    getTotalDocuments(findByData) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.collection.countDocuments(findByData);
        });
    }
}
exports.BaseRepository = BaseRepository;
