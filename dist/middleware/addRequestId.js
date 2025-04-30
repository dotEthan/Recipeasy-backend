"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addRequestId = void 0;
const uuid_1 = require("uuid");
const addRequestId = (req, _res, next) => {
    req.requestId = (0, uuid_1.v4)();
    next();
};
exports.addRequestId = addRequestId;
