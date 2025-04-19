import express, { NextFunction, Request, Response } from "express";
import { validateRequestBodyData } from "../middleware/validateRequestData";
import { LoginSchema, RegisterUserSchema } from "../schemas/user.schema";
import { catchAsyncError } from "../util/catchAsyncErrors";
import { AuthController } from "../controllers/authController";
import { EmailService } from "../services/emailService";
import { AuthService } from "../services/authService";
import { UserService } from "../services/userService";
import { RecipesRepository } from "../repositories/recipes/recipesRepository";
import { UserRepository } from "../repositories/user/userRepository";
import { AuthLoginAttemptRepository, AuthVerificationCodesRepository } from "../repositories/auth/authRepository";
import { RecipeService } from "../services/recipeService";
import { isAuthenticated } from "../middleware/auth";

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
const router = express.Router();

// Autheticate as needed

router.get('/session', isAuthenticated(), (req: Request, res: Response) => {
  console.log('checking session is Autheticated: ', req.isAuthenticated());
  if (req.isAuthenticated()) {
    res.json({ success: true, data: req.user});
  } else {
    res.status(401).json({success: false, message: 'User Not Autheticated'})
  }
});

router.delete("/session", isAuthenticated(), (req: Request, res: Response, next: NextFunction) => {    
    req.logOut((err) => {
        if (err) return next(err);
        res.clearCookie('recipeasy.sid');

        req.session.destroy((err) => {
            if (err) return next(err);
            return res.json({
                success: true,
                message: "User Logged Out"
            });
        });
    })
});

router.post("/login", validateRequestBodyData(LoginSchema), catchAsyncError(authController.login));

router.post("/register", validateRequestBodyData(RegisterUserSchema), authController.register);

export default router;