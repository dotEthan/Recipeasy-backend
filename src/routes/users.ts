import { Router } from "express";

import { UserController } from "../controllers/usersController";
import { AuthController } from "../controllers/authController";
import { validateRequestBodyData } from "../middleware/validateRequestData";
import { LoginSchema, RegisterUserSchema, SetPasswordSchema } from "../schemas/user.schema";
// import { registrationLimiter } from "../middleware/rateLimiters";
// TODO check middleware - registrationLimiter, etc
export default function createUsersRouter(userController: UserController, authController: AuthController) {
  const router = Router();
  router.post("/register", validateRequestBodyData(RegisterUserSchema), authController.register);
  router.post("/login", validateRequestBodyData(LoginSchema), authController.login);
  router.post("/logout", authController.logout);
  router.post("/update-password", validateRequestBodyData(SetPasswordSchema), userController.updateUserPassword);
  return router;
}