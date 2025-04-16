import { Router } from "express";

import { UserController } from "../controllers/usersController";
import { AuthController } from "../controllers/authController";
import { validateRequestBodyData } from "../middleware/validateRequestData";
import { LoginSchema, RegisterUserSchema, SetPasswordSchema, updateUsersRecipesSchema } from "../schemas/user.schema";
import { isAuthenticated } from "../middleware/auth";
// import { registrationLimiter } from "../middleware/rateLimiters";

// TODO check middleware - registrationLimiter, etc
// RESTFULy id resource in url
export default function createUsersRouter(userController: UserController, authController: AuthController) {
  const router = Router();
  router.post("/register", validateRequestBodyData(RegisterUserSchema), authController.register);
  router.post("/login", validateRequestBodyData(LoginSchema), authController.login);
  router.post("/logout", authController.logout);
  router.post("/update-password", validateRequestBodyData(SetPasswordSchema), userController.updateUserPassword);
  router.get("/user-data", isAuthenticated(), userController.getUserData);
  router.patch("/user-recipes", isAuthenticated(), validateRequestBodyData(updateUsersRecipesSchema), userController.updateUserRecipes);
  return router;
}