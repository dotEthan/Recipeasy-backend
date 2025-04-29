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

import { errorHandler } from './middleware/errorHandler';
import appRouter from './routes/';
import { NotFoundError } from './errors';
import { addRequestId } from './middleware/addRequestId';

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
    autoRemove: 'interval',
    autoRemoveInterval: 10,
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

//TODO on deploy update to production domain
app.use(cors({
  origin: 'https://localhost:5173', //process.env.CORS_ORIGIN
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization', 'x-csrf-token'],
  credentials: true,
  exposedHeaders: ['Set-Cookie']
}));

app.use('/images', express.static(path.join(__dirname, 'images')));

// TODO this is to test sessions for csrf inconsistency - Remove it, I dare you. 
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log('Session Debug1:');
  console.log('Session ID1:', req.sessionID);
  console.log('CSRF Token1:', req.session.csrfToken);
  console.log('Session1:', req.session);
  next();
});
app.use(addRequestId)
app.use('/api/v1', appRouter);

// TODO Correct 404 Reply
app.use(
  (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    next(new NotFoundError('404 - Not Found'));
  },
);

// Global Error Handler
app.use(errorHandler);

export default app;