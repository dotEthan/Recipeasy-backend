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

import { HttpError } from "./errors/index";
import MongoStore from 'connect-mongo';
import { csrfErrorHandler, csrfProtection } from './middleware/csrf';
import cookieParser from 'cookie-parser';

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

// Error Handler, Keep last
app.use(
  (
    error: HttpError | Error,
    req: Request,
    res: Response,
    next: NextFunction, // eslint-disable-line @typescript-eslint/no-unused-vars
  ) => {
    console.log('error catch all')
    const status = error instanceof HttpError ? error.statusCode : 500;
    const message = error.message;
    const data = error.message;
    res.status(status).json({ message: message, data: data });
  },
);


export default app;

// TODO DO COMMIT SOON!!!!