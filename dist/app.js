"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
if (process.env.NODE_ENV !== 'production') {
    dotenv_1.default.config();
}
;
const path_1 = __importDefault(require("path"));
const cors_1 = __importDefault(require("cors"));
const express_1 = __importDefault(require("express"));
const express_session_1 = __importDefault(require("express-session"));
const passport_1 = __importDefault(require("passport"));
const helmet_1 = __importDefault(require("helmet"));
const connect_mongo_1 = __importDefault(require("connect-mongo"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const errorHandler_1 = require("./middleware/errorHandler");
const routes_1 = __importDefault(require("./routes/"));
const errors_1 = require("./errors");
const addRequestId_1 = require("./middleware/addRequestId");
const enums_1 = require("./types/enums");
const hpp_1 = __importDefault(require("hpp"));
const compression_1 = __importDefault(require("compression"));
const connect_timeout_1 = __importDefault(require("connect-timeout"));
/**
 * configs app setup and middleware
 */
const app = (0, express_1.default)();
app.use((0, helmet_1.default)({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", "data:", "https:"]
        }
    }
}));
const corsOrigin = process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN : 'https://localhost:5173';
app.use((0, cors_1.default)({
    origin: corsOrigin,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization', 'x-csrf-token'],
    credentials: true,
    exposedHeaders: ['Set-Cookie']
}));
app.use((0, compression_1.default)());
app.use((0, connect_timeout_1.default)('10s'));
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: false }));
app.use((0, hpp_1.default)());
app.use((0, cookie_parser_1.default)());
const sessionSecret = process.env.SESSION_SECRET;
if (!sessionSecret) {
    throw new errors_1.ServerError('FATAL: SESSION_SECRET missing in environment variables', { location: 'app.ts' }, enums_1.ErrorCode.UNSET_ENV_VARIABLE);
}
const MongoDbUri = process.env.MONGODB_URI;
if (!MongoDbUri) {
    throw new errors_1.ServerError('FATAL: MONGODB_URI missing in environment variables', { location: 'app.ts' }, enums_1.ErrorCode.UNSET_ENV_VARIABLE);
}
// TODO once working deployed try 
// name: '__Host-recipeasy.sid', 
// ensures cookie is from same host
app.use((0, express_session_1.default)({
    secret: sessionSecret,
    name: 'recipeasy.sid',
    resave: false,
    saveUninitialized: false,
    store: connect_mongo_1.default.create({
        mongoUrl: MongoDbUri,
        collectionName: 'sessions',
        ttl: 7 * 24 * 60 * 60,
        autoRemove: 'interval',
        autoRemoveInterval: 10,
        touchAfter: 24 * 3600,
    }),
    cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 1000 * 60 * 60 * 24 * 7,
    }
}));
app.use(passport_1.default.initialize());
app.use(passport_1.default.session());
app.use('/images', express_1.default.static(path_1.default.join(__dirname, 'images')));
app.use(addRequestId_1.addRequestId);
app.use('/api/v1', routes_1.default);
app.use((req, res, next) => {
    next(new errors_1.NotFoundError('404 - Page Not Found', { location: 'app.ts' }, enums_1.ErrorCode.ENDPOINT_NOT_FOUND));
});
app.use(errorHandler_1.errorHandler);
exports.default = app;
