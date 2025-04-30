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
exports.initialize = initialize;
require("express");
const passport_local_1 = require("passport-local");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const userRepository_1 = require("../repositories/user/userRepository");
const mongodb_1 = require("mongodb");
const errors_1 = require("../errors");
/**
 * Initializes Passport for authentication, working with express-sessions
 * @function initialize
 * @param {PassportStatic} passport - An async function to be retried
 * @example
 * import passport from 'passport';
 * import initialize from './config/passport';
 *
 * initialize(passport);
 * app.use(passport.initialize());
 * app.use(passport.session());
 */
function initialize(passport) {
    return __awaiter(this, void 0, void 0, function* () {
        const userRepository = new userRepository_1.UserRepository();
        const authenticateUser = (email, password, done) => __awaiter(this, void 0, void 0, function* () {
            try {
                const user = yield userRepository.findByEmailWithInternals(email);
                if (user == null) {
                    // (error, user, message)
                    return done(null, false, { message: 'No user with that email' });
                }
                ;
                if (yield bcryptjs_1.default.compare(password, user.password)) {
                    return done(null, user);
                }
                else {
                    return done(null, false, { message: 'Password incorrect' });
                }
                ;
            }
            catch (error) {
                if (error instanceof errors_1.UnauthorizedError || error instanceof errors_1.ServerError) {
                    return done(error);
                }
                else if (error instanceof Error) {
                    return done(new errors_1.ServerError('Passport failed to create session', {
                        location: 'authController.authenticateUser',
                        originalError: {
                            name: error.name,
                            message: error.message,
                            stack: error.stack
                        }
                    }));
                }
                ;
            }
        });
        passport.use(new passport_local_1.Strategy({ usernameField: 'email' }, authenticateUser));
        passport.serializeUser((user, done) => {
            done(null, user._id.toString());
        });
        passport.deserializeUser((id, done) => __awaiter(this, void 0, void 0, function* () {
            try {
                const user = yield userRepository.findById(new mongodb_1.ObjectId(id));
                done(null, user);
            }
            catch (error) {
                done(error);
            }
        }));
    });
}
