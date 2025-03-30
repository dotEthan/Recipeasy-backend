import { initialize } from './config/passport';
import passport from 'passport';

import app from './app';
import { Database } from './config/database';
import { UserRepository } from './repositories/userRepository';
import { UserService } from './services/userService';
import { UserController } from './controllers/usersController';
import { AuthController } from './controllers/authController';
import createUsersRouter from './routes/users';
import createAdminRouter from './routes/admin';
import { AuthLoginAttemptRepository, AuthVerificationCodesRepository } from './repositories/authRespository';
import { AuthService } from './services/authService';

const PORT = process.env.PORT || 8080;

async function startServer() {
  try {
    const database = Database.getInstance();
    await database.connect();
    
    // Explicitly initializing after database connection
    // Timing issue with trying to use database before connecting
    
    const userRepository = new UserRepository();
    const authLoginAttemptRepository = new AuthLoginAttemptRepository();
    const authVerificationCodesRepository = new AuthVerificationCodesRepository();
    const userService = new UserService(userRepository);
    const authService = new AuthService(
      userRepository, 
      authLoginAttemptRepository, 
      authVerificationCodesRepository
    );

    registerRoutes(userService, authService);
    
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


export function registerRoutes(userService: UserService, authService: AuthService) {
  const userController = new UserController(userService);
  const authController = new AuthController(userService, authService);
  const usersRouter = createUsersRouter(userController, authController);
  const adminRouter = createAdminRouter(authController);
  app.use('/api', usersRouter);
  app.use('/api', adminRouter);
}