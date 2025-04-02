import { Router } from "express";

import { UserController } from "../controllers/usersController";
import { AuthController } from "../controllers/authController";
import { validateRequestBody } from "../middleware/requestValidation";
// import { registrationLimiter } from "../middleware/rateLimiters";
// TODO check middleware - registrationLimiter, etc
export default function createUsersRouter(userController: UserController, authController: AuthController) {
  const router = Router();
  router.post("/register", validateRequestBody, authController.register);
  router.post("/login", validateRequestBody, authController.login);
  router.post("/logout", authController.logout);
  router.post("/update-password", userController.updateUserPassword);
  return router;
}