import { Router } from "express";

import { UserController } from "../controllers/usersController";
import { AuthController } from "../controllers/authController";
import { validateRequestBody } from "../middleware/requestValidation";
import { registrationLimiter } from "../middleware/rateLimiters";

export default function createUsersRouter(userController: UserController, authController: AuthController) {
  const router = Router();
  router.patch("/user", validateRequestBody, userController.updateUser);
  router.post("/register", validateRequestBody, registrationLimiter, authController.register);
  router.post("/login", validateRequestBody, authController.login);
  router.post("/logout", authController.logout);
  return router;
}