"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const users_1 = __importDefault(require("./users"));
const admin_1 = __importDefault(require("./admin"));
const recipes_1 = __importDefault(require("./recipes"));
const auth_1 = __importDefault(require("./auth"));
const router = (0, express_1.Router)();
router.use('/users', users_1.default);
router.use('/admin', admin_1.default);
router.use('/recipes', recipes_1.default);
router.use('/auth', auth_1.default);
exports.default = router;
