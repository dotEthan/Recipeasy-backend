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
exports.Database = void 0;
const mongodb_1 = require("mongodb");
const dbIndexManager_1 = require("./dbIndexManager");
const retry_1 = require("../util/retry");
const errors_1 = require("../errors");
const enums_1 = require("../types/enums");
class Database {
    constructor() {
        const dbUrl = process.env.MONGODB_URI || 'default';
        this.client = new mongodb_1.MongoClient(dbUrl);
    }
    static getInstance() {
        if (!Database.instance) {
            Database.instance = new Database();
        }
        return Database.instance;
    }
    connect() {
        return __awaiter(this, void 0, void 0, function* () {
            return (0, retry_1.retryFunction)(() => __awaiter(this, void 0, void 0, function* () {
                yield this.client.connect();
                this.db = this.client.db();
            }), {});
        });
    }
    getDb() {
        if (!this.db) {
            const dbError = new errors_1.ServerError('Database Not Initialized, Must Connect() first.', { location: 'database.getDb' }, enums_1.ErrorCode.MONGODB_GET_DB_FAILED, false);
            throw dbError;
        }
        return this.db;
    }
    initializeIndexes() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.db) {
                throw new errors_1.ServerError('Database Not Initialized, Must Connect() first', { location: 'database.getDb' }, enums_1.ErrorCode.MONGODB_INIT_INDICES, false);
            }
            yield dbIndexManager_1.DbIndexManager.initialize(this.db);
        });
    }
    close() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.client.close();
        });
    }
}
exports.Database = Database;
