import { initialize } from './config/passport';
import passport from 'passport';

import app from './app';
import { Database } from './config/database';

const PORT = process.env.PORT || 8080;

async function startServer() {
  try {
    const database = Database.getInstance();
    await database.connect();
    await database.initializeIndexes();

    // TODO: Maybe fixed, TEST
    // Explicitly initializing routes after database connection
    // Timing issue with database connections not waiting for initialization
    // const authVerificationCodesRepository = new AuthVerificationCodesRepository();
    // const authLoginAttemptRepository = new AuthLoginAttemptRepository();
    // const userRepository = new UserRepository();
    // const recipesRepository = new RecipesRepository();
    // const emailService = new EmailService();
    // const authService = new AuthService(
    //   authLoginAttemptRepository, 
    //   authVerificationCodesRepository,
    //   emailService,
    //   userRepository
    // );
    // const userService = new UserService(
    //   userRepository, 
    //   emailService, 
    //   authService
    // );
    // const recipeService = new RecipeService(recipesRepository,userRepository);

    // registerRoutes(
    //   userService, 
    //   authService, 
    //   recipeService,
    // );
    
    // Register error handler last
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

