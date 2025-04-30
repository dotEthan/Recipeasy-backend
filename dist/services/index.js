"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.passwordService = exports.authService = exports.userService = exports.emailVerificationService = exports.emailService = exports.recipeService = exports.authVerificationCodesRepository = exports.authLoginAttemptRepository = exports.userRepository = void 0;
const authRepository_1 = require("../repositories/auth/authRepository");
const recipesRepository_1 = require("../repositories/recipes/recipesRepository");
const userRepository_1 = require("../repositories/user/userRepository");
const authService_1 = require("./authService");
const emailService_1 = require("./emailService");
const emailVerificationService_1 = require("./emailVerificationService");
const passwordService_1 = require("./passwordService");
const recipeService_1 = require("./recipeService");
const userService_1 = require("./userService");
/**
 * Handles dependency injection instead of doing it in /routes
 */
// 
exports.userRepository = new userRepository_1.UserRepository();
exports.authLoginAttemptRepository = new authRepository_1.AuthLoginAttemptRepository();
exports.authVerificationCodesRepository = new authRepository_1.AuthVerificationCodesRepository();
exports.recipeService = new recipeService_1.RecipeService(new recipesRepository_1.RecipesRepository(), exports.userRepository);
exports.emailService = new emailService_1.EmailService();
exports.emailVerificationService = new emailVerificationService_1.EmailVerificationService(exports.authVerificationCodesRepository, exports.emailService);
exports.userService = new userService_1.UserService(exports.userRepository, exports.emailVerificationService);
exports.authService = new authService_1.AuthService(exports.authLoginAttemptRepository, exports.userService, exports.recipeService, exports.emailVerificationService);
exports.passwordService = new passwordService_1.PasswordService(exports.userRepository, exports.userService, exports.emailService);
