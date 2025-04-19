import express, { Request, Response } from "express";
import { AuthController } from "../controllers/authController";
import { CodeSchema, ResetPasswordSchema } from "../schemas/user.schema";
import { validateRequestBodyData } from "../middleware/validateRequestData";
import { AuthLoginAttemptRepository, AuthVerificationCodesRepository } from "../repositories/auth/authRepository";
import { UserRepository } from "../repositories/user/userRepository";
import { RecipesRepository } from "../repositories/recipes/recipesRepository";
import { EmailService } from "../services/emailService";
import { AuthService } from "../services/authService";
import { UserService } from "../services/userService";
import { RecipeService } from "../services/recipeService";


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

const authController = new AuthController(userService, authService, recipeService);

// RESTFULy id resource in url
// Autheticate as needed

router.get('/csrf-token', (req: Request, res: Response) => {
  console.log('CSurfing')
  res.cookie('csrftoken', req.csrfToken(), { 
      httpOnly: true,
      secure: true,
      sameSite: 'strict' 
  });
  // TODO check why two csrf tokens, doubling due to res?
  res.json({ csrfToken: req.csrfToken() }); 
});

router.post('/verification-codes/verify', validateRequestBodyData(CodeSchema), authController.verifyCode);

router.post('/password-reset-requests', validateRequestBodyData(ResetPasswordSchema), authController.resetPassword);

router.post('/password-reset/validate', validateRequestBodyData(CodeSchema), authController.validatePasswordToken);

export default router;
