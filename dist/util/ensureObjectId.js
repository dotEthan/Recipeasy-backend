"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ensureObjectId = ensureObjectId;
const mongodb_1 = require("mongodb");
/**
 * Ensure values that should be an ObjectId, are.
 * @param id - The ID (either string or ObjectId)
 * @returns ObjectId
 */
function ensureObjectId(id) {
    return typeof id === 'string' ? new mongodb_1.ObjectId(id) : id;
}
