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
const database_1 = require("../config/database");
class BaseRepository {
    constructor(collectionName) {
        const db = database_1.Database.getInstance().getDb();
        this.collection = db.collection(collectionName);
    }
    findOne(findByData) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log('finding one: ', findByData);
            return yield this.collection.findOne(findByData);
        });
    }
    findByIndex(findByData) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log('finding one: ', findByData);
            return this.collection.find(findByData);
        });
    }
    create(data) {
        return __awaiter(this, void 0, void 0, function* () {
            const now = new Date();
            const insertingDocument = Object.assign(Object.assign({}, data), { createdAt: now, updatedAt: now });
            const response = yield this.collection.insertOne(insertingDocument);
            console.log('create respponse: ', response);
            return Object.assign(Object.assign({}, insertingDocument), { _id: response.insertedId });
        });
    }
    createMany(data) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log('saving many');
            const now = new Date();
            const insertingDocuments = data.map(item => (Object.assign(Object.assign({}, item), { createdAt: now, updatedAt: now })));
            return yield this.collection.insertMany(insertingDocuments);
        });
    }
    // Will merge data over existing
    updateOne(filter, updatedData) {
        return __awaiter(this, void 0, void 0, function* () {
            const insertingDocument = Object.assign(Object.assign({}, updatedData), { updatedAt: new Date() });
            const response = yield this.collection.updateOne(filter, { $set: insertingDocument });
            console.log(response);
            return response;
        });
    }
    // Will merge data into existing, no duplicates
    updateOneByMergeNoDupe(filter, updatedData) {
        return __awaiter(this, void 0, void 0, function* () {
            const response = yield this.collection.updateOne(filter, updatedData);
            console.log(response);
            return response;
        });
    }
    // Will merge data into existing, allows duplicates
    updateByMergeOne(filter, updatedData) {
        return __awaiter(this, void 0, void 0, function* () {
            const insertingDocument = Object.assign(Object.assign({}, updatedData), { updatedAt: new Date() });
            const response = yield this.collection.updateOne(filter, insertingDocument);
            console.log(response);
            return response;
        });
    }
    // TODO Do properly.
    delete(toDeleteData) {
        return __awaiter(this, void 0, void 0, function* () {
            const response = yield this.collection.deleteOne(toDeleteData._id);
            console.log(response);
            return response;
        });
    }
    getTotalDocuments(findByData) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.collection.countDocuments(findByData);
        });
    }
}
exports.BaseRepository = BaseRepository;
