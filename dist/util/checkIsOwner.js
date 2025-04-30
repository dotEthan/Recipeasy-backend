"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.assertUserOwnership = assertUserOwnership;
const errors_1 = require("../errors");
const enums_1 = require("../types/enums");
function assertUserOwnership(authenticatedUserId, targetUserId) {
    if (authenticatedUserId !== targetUserId) {
        throw new errors_1.ForbiddenError('User does not own this resource', {
            authenticatedUserId,
            targetUserId,
            location: 'checkIsOwner.asserUserOwnership'
        }, enums_1.ErrorCode.RESOURCE_NOT_USER_OWNED);
    }
}
