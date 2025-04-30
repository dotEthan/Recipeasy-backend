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
exports.DbIndexManager = void 0;
const retry_1 = require("../util/retry");
class DbIndexManager {
    static initialize(db) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.initialized)
                return;
            try {
                yield this.createRecipeIndexes(db);
                this.initialized = true;
            }
            catch (error) {
                console.error('DB index initialization error: ', error);
            }
        });
    }
    static createRecipeIndexes(db) {
        return __awaiter(this, void 0, void 0, function* () {
            yield (0, retry_1.retryFunction)(() => db.collection('recipes').createIndexes([{
                    key: { visibilty: 1, 'ratings.averageRating': -1 },
                    background: true
                }]), {});
        });
    }
}
exports.DbIndexManager = DbIndexManager;
DbIndexManager.initialized = false;
