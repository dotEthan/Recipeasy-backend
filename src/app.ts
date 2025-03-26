import dotenv from 'dotenv'
if(process.env.NODE_ENV !== 'production') {
  dotenv.config();
};
import path from 'path';
import cors from 'cors';

import express, { NextFunction, Request, Response } from "express";
// import session from 'express-session';
// import passport from 'passport';

import { HttpError } from "./types/error";

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
// app.use(session({
//   secret: process.env.SESSION_SECRET || 'secret',
//   resave: false,
//   saveUninitialized: false
// }));
// app.use(passport.initialize());
// app.use(passport.session());

//TODO on deploy update to production domain
app.use(cors({
  origin: 'http://localhost:5173', //process.env.CORS_ORIGIN
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization'],
  credentials: true
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