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

const PORT = process.env.PORT || 8080;

async function startServer() {
  try {
    const database = Database.getInstance();
    await database.connect();
    
    // Explicitly initializing after database connection
    // Timing issue with trying to use database before connecting
    
    const userRepository = new UserRepository();
    const userService = new UserService(userRepository);
    registerRoutes(userService);
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


export function registerRoutes(userService: UserService) {
  const userController = new UserController(userService);
  const authController = new AuthController(userService);
  const usersRouter = createUsersRouter(userController, authController);
  const adminRouter = createAdminRouter();
  app.use('/api', usersRouter);
  app.use('/api', adminRouter);
}