
import { AuthLoginAttemptRepository, AuthVerificationCodesRepository } from '../repositories/auth/authRepository';
import { RecipesRepository } from '../repositories/recipes/recipesRepository';
import { UserRepository } from '../repositories/user/userRepository';
import { AuthService } from './authService';
import { EmailService } from './emailService';
import { EmailVerificationService } from './emailVerificationService';
import { PasswordService } from './passwordService';
import { RecipeService } from './recipeService';
import { UserService } from './userService';

/**
 * Handles dependency injection to keep code "cleaner". 
 * @todo Should be used everywhere? 
 */
// 

export const userRepository = new UserRepository();

export const authLoginAttemptRepository = new AuthLoginAttemptRepository()
export const authVerificationCodesRepository = new AuthVerificationCodesRepository();
export const recipeService = new RecipeService(new RecipesRepository(), userRepository);
export const emailService = new EmailService();
export const emailVerificationService = new EmailVerificationService(authVerificationCodesRepository, emailService);
export const userService = new UserService(
  userRepository,
  emailVerificationService,
);
export const authService = new AuthService(
  authLoginAttemptRepository,
  userService,
  recipeService,
  emailVerificationService
);
export const passwordService = new PasswordService(userRepository, userService, emailService);

