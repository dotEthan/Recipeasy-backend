import { initialize } from './config/passport';
import passport from 'passport';

import app from './app';
import { Database } from './config/database';
import { UserRepository } from './repositories/user/userRepository';
import { UserController } from './controllers/usersController';
import { AuthController } from './controllers/authController';
import { RecipeController } from './controllers/recipesController';
import createUsersRouter from './routes/users';
import createAdminRouter from './routes/admin';
import createRecipesRouter from './routes/recipes';
import {
  AuthLoginAttemptRepository,
  AuthVerificationCodesRepository
} from './repositories/auth/authRepository';
import {RecipesRepository} from './repositories/recipes/recipesRepository';
import { UserService } from './services/userService';
import { AuthService } from './services/authService';
import { EmailService } from './services/emailService';
import { RecipeService } from './services/recipeService';

const PORT = process.env.PORT || 8080;

async function startServer() {
  try {
    const database = Database.getInstance();
    await database.connect();
    await database.initializeIndexes();
    // Explicitly initializing after database connection
    // Timing issue with trying to use database before connecting
    
    const authVerificationCodesRepository = new AuthVerificationCodesRepository();
    const authLoginAttemptRepository = new AuthLoginAttemptRepository();
    const userRepository = new UserRepository();
    const recipesRepository = new RecipesRepository();
    const emailService = new EmailService();
    const authService = new AuthService(
      authLoginAttemptRepository, 
      authVerificationCodesRepository,
      emailService,
      userRepository
    );
    const userService = new UserService(
      userRepository, 
      emailService, 
      authService
    );
    const recipeService = new RecipeService(recipesRepository,userRepository);

    registerRoutes(
      userService, 
      authService, 
      recipeService,
    );
    
    initialize(passport);
    

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();


export function registerRoutes(
  userService: UserService, 
  authService: AuthService,
  recipeService: RecipeService,
) {
  const userController = new UserController(userService, recipeService);
  const authController = new AuthController(
    userService, 
    authService, 
    recipeService
  );
  const recipeController = new RecipeController(recipeService);
  const usersRouter = createUsersRouter(userController, authController);
  const adminRouter = createAdminRouter(authController);
  const recipesRouter = createRecipesRouter(recipeController);
  app.use('/api', usersRouter);
  app.use('/api', adminRouter);
  app.use('/api', recipesRouter);
}