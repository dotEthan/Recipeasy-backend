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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const passport_1 = require("./config/passport");
const passport_2 = __importDefault(require("passport"));
const app_1 = __importDefault(require("./app"));
const database_1 = require("./config/database");
const PORT = process.env.PORT || 8080;
function startServer() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const database = database_1.Database.getInstance();
            yield database.connect();
            yield database.initializeIndexes();
            (0, passport_1.initialize)(passport_2.default);
            app_1.default.listen(PORT, () => {
                console.log(`Server running on port ${PORT}`);
            });
        }
        catch (error) {
            console.error('Failed to start server:', error);
            process.exit(1);
        }
    });
}
startServer();
