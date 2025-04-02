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
import {
  AuthLoginAttemptRepository,
  AuthPwResetCodesRepository,
  AuthVerificationCodesRepository
} from './repositories/authRespository';
import { AuthService } from './services/authService';
import { EmailService } from './services/emailService';

const PORT = process.env.PORT || 8080;

async function startServer() {
  try {
    const database = Database.getInstance();
    await database.connect();
    
    // Explicitly initializing after database connection
    // Timing issue with trying to use database before connecting
    
    const authVerificationCodesRepository = new AuthVerificationCodesRepository();
    const authLoginAttemptRepository = new AuthLoginAttemptRepository();
    const authPwResetCodesRepository = new AuthPwResetCodesRepository();
    const userRepository = new UserRepository();
    const emailService = new EmailService();
    const authService = new AuthService(
      authLoginAttemptRepository, 
      authVerificationCodesRepository,
      emailService,
      authPwResetCodesRepository,
      userRepository
    );
    const userService = new UserService(
      userRepository, 
      emailService, 
      authPwResetCodesRepository,
      authService
    );

    registerRoutes(
      userService, 
      authService, 
      authPwResetCodesRepository
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
  authPwResetCodesRepository: AuthPwResetCodesRepository
) {
  const userController = new UserController(userService);
  const authController = new AuthController(
    userService, 
    authService, 
    authPwResetCodesRepository
  );
  const usersRouter = createUsersRouter(userController, authController);
  const adminRouter = createAdminRouter(authController);
  app.use('/api', usersRouter);
  app.use('/api', adminRouter);
}