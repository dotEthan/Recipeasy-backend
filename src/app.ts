import dotenv from 'dotenv'
if(process.env.NODE_ENV !== 'production') {
  dotenv.config();
};
import path from 'path';
import cors from 'cors';
import express, { NextFunction, Request, Response } from "express";
import session from 'express-session';
import passport from 'passport';
import helmet from 'helmet';
import MongoStore from 'connect-mongo';
import cookieParser from 'cookie-parser';

import { UserController } from './controllers/usersController';
import { AuthController } from './controllers/authController';
import { RecipeController } from './controllers/recipesController';
import createUsersRouter from './routes/users';
import createAdminRouter from './routes/admin';
import createRecipesRouter from './routes/recipes';
import { UserService } from './services/userService';
import { AuthService } from './services/authService';
import { RecipeService } from './services/recipeService';
import { csrfErrorHandler, csrfProtection } from './middleware/csrf';
import { errorHandler } from './middleware/errorHandler';
import { AuthLoginAttemptRepository, AuthVerificationCodesRepository } from './repositories/auth/authRepository';
import { UserRepository } from './repositories/user/userRepository';
import { RecipesRepository } from './repositories/recipes/recipesRepository';
import { EmailService } from './services/emailService';

const app = express();

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"]
    }
  }
}));
app.use(cookieParser())
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(session({
  secret: process.env.SESSION_SECRET || 'secret',
  name: 'recipeasy.sid',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGODB_URI,
    collectionName: 'sessions',
    ttl: 7 * 24 * 60 * 60,
    touchAfter: 24 * 3600,
  }),
  cookie: {
    httpOnly: true,
    secure: false,
    sameSite: 'lax',
    maxAge: 1000 * 60 * 60 * 24 * 7,
  }
}));
app.use(passport.initialize());
app.use(passport.session());

app.use(csrfProtection);
app.use(csrfErrorHandler);

//TODO on deploy update to production domain
app.use(cors({
  origin: 'https://localhost:5173', //process.env.CORS_ORIGIN
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization', 'x-csrf-token'],
  credentials: true,
  exposedHeaders: ['Set-Cookie']
}));

// adding in server.ts due to database connection timing issue
// TODO leave as is or look into better fix? 
// app.use('/api', recipesRoutes);
// app.use('/api', usersRoutes);

app.use('/images', express.static(path.join(__dirname, 'images')));

// Refactor to remove this mess
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

// TODO Correct 404 Reply
app.use(
  (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    next(new Error(`Not Found - ${req.originalUrl}`));
  },
);

// Global Error Handler
app.use(errorHandler);

export default app;