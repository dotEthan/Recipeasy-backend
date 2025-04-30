// @ts-nocheck

import dotenv from 'dotenv'
if(process.env.NODE_ENV !== 'production') {
  dotenv.config();
};
import cors from 'cors';
import express, { NextFunction, Request, Response } from "express";
import session from 'express-session';
import passport from 'passport';
import helmet from 'helmet';
import MongoStore from 'connect-mongo';
import cookieParser from 'cookie-parser';

import { errorHandler } from './middleware/errorHandler';
import appRouter from './routes/index';
import { NotFoundError, ServerError } from './errors';
import { addRequestId } from './middleware/addRequestId';
import { ErrorCode } from './types/enums';
import hpp from 'hpp';
import compression from 'compression';
import timeout from 'connect-timeout';

/**
 * configs app setup and middleware
 */
const app = express();

// === DEBUG START ===
console.log('Imported router:', appRouter?.stack ? 'Valid Router' : 'INVALID ROUTER');
console.log('\n=== ENVIRONMENT VARIABLES ===');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('MONGODB_URI exists:', !!process.env.MONGODB_URI);
console.log('CORS_ORIGIN:', process.env.CORS_ORIGIN);

console.log('\n=== PATH VERIFICATION ===');
console.log('__dirname:', __dirname);
// === DEBUG END ===

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

const corsOrigin = process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN : 'https://localhost:5173';

app.use(cors({
  origin: corsOrigin,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization', 'x-csrf-token'],
  credentials: true,
  exposedHeaders: ['Set-Cookie']
}));
app.use(compression()); 
app.use(timeout('10s'));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(hpp());

app.use(cookieParser());

const sessionSecret = process.env.SESSION_SECRET;
if (!sessionSecret) {
  throw new ServerError(
    'FATAL: SESSION_SECRET missing in environment variables',
    { location: 'app.ts' },
    ErrorCode.UNSET_ENV_VARIABLE
  );
}
const MongoDbUri = process.env.MONGODB_URI;
if (!MongoDbUri) {
  throw new ServerError(
    'FATAL: MONGODB_URI missing in environment variables',
    { location: 'app.ts' },
    ErrorCode.UNSET_ENV_VARIABLE
  );
}

// TODO once working deployed try 
// name: '__Host-recipeasy.sid', 
// ensures cookie is from same host
app.use(session({
  secret: sessionSecret,
  name: 'recipeasy.sid',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: MongoDbUri,
    collectionName: 'sessions',
    ttl: 7 * 24 * 60 * 60,
    autoRemove: 'interval',
    autoRemoveInterval: 10,
    touchAfter: 24 * 3600,
  }),
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 1000 * 60 * 60 * 24 * 7,
  }
}));
app.use(passport.initialize());
app.use(passport.session());

app.use('/api/v1', appRouter);

console.log('Final Route Count:', app._router.stack
  .filter(layer => layer.name === 'router' && layer.regexp.test('/api/v1'))
  .flatMap(layer => layer.handle.stack)
  .length
);

console.log('Router mounted:', app._router.stack.some(
  layer => layer.regexp.test('/api/v1')
));

app.use(addRequestId)

// === POST-ROUTE DEBUG ===
console.log('\n=== REGISTERED ROUTES ===');
app._router.stack.forEach((layer: any) => {
  if (layer.route) {
    const methods = layer.route.methods;
    const method = Object.keys(methods).find(m => methods[m]);
    console.log(`- ${method?.toUpperCase()} ${layer.route.path}`);
  }
});
process.stdout.write('RAW OUTPUT TEST\n');
console.log('Regular console.log test');

app.use(
  (req: Request, res: Response, next: NextFunction) => {
    next(new NotFoundError(
      '404 - Page Not Found',
      { location: 'app.ts'},
      ErrorCode.ENDPOINT_NOT_FOUND
    ));
  },
);

app.use(errorHandler);

export default app;