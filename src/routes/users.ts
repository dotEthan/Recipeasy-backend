import express from "express";

import { UserController } from "../controllers/usersController";
import { validateRequestBodyData } from "../middleware/validateRequestData";
import { SetPasswordSchema, FeUpdateUsersRecipesSchema } from "../schemas/user.schema";
import { isAuthenticated } from "../middleware/auth";
import { catchAsyncError } from "../util/catchAsyncErrors";
import { UserService } from "../services/userService";
import { UserRepository } from "../repositories/user/userRepository";
import { EmailService } from "../services/emailService";
import { AuthService } from "../services/authService";
import { AuthLoginAttemptRepository, AuthVerificationCodesRepository } from "../repositories/auth/authRepository";
import { RecipeService } from "../services/recipeService";
import { RecipesRepository } from "../repositories/recipes/recipesRepository";
// import { registrationLimiter } from "../middleware/rateLimiters";

const router = express.Router();

const authLoginAttemptRepository = new AuthLoginAttemptRepository();
const authVerificationCodesRepository = new AuthVerificationCodesRepository();
const userRepository = new UserRepository();
const recipeRepository = new RecipesRepository();

const emailService = new EmailService();
const authService = new AuthService(
  authLoginAttemptRepository,
  authVerificationCodesRepository,
  emailService, 
  userRepository
)
const userService = new UserService(
  userRepository, 
  emailService, 
  authService
);
const recipeService = new RecipeService(recipeRepository, userRepository);

const userController = new UserController(userService, recipeService);


router.patch("/password", validateRequestBodyData(SetPasswordSchema), userController.updateUserPassword);
router.get("/:id", isAuthenticated(), userController.getUsersData);
router.patch("/:id/recipes", isAuthenticated(), validateRequestBodyData(FeUpdateUsersRecipesSchema), userController.updateUserRecipes);

export default router;