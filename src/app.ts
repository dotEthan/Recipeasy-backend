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

app.set('trust proxy', 1);

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

const corsOrigin = process.env.CORS_ORIGIN 
  ? process.env.CORS_ORIGIN.split(',').map(origin => origin.trim())
  : ['https://localhost:5173'];
  
console.log('Configured CORS origins:', corsOrigin);

const corsOrigins = process.env.CORS_ORIGIN 
  ? process.env.CORS_ORIGIN.split(',').map(origin => origin.trim())
  : ['https://localhost:5173'];

console.log('Configured CORS origins:', corsOrigins);

// This is the key part - we need to match the specific origin
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (corsOrigins.includes(origin)) {
      // Important: Return the ACTUAL requesting origin, not the whole list
      return callback(null, origin);
    }
    
    console.log(`CORS blocked origin: ${origin}, allowed origins:`, corsOrigins);
    return callback(new Error('Not allowed by CORS'), false);
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization', 'x-csrf-token'],
  credentials: true,
  exposedHeaders: ['Set-Cookie', 'x-csrf-token'],
  maxAge: 3600
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
app.get('/debug-cors', (req: Request, res: Response) => {
  // Only allow in development or with specific header for security
  if (process.env.NODE_ENV === 'production' && 
      req.headers['x-debug-key'] !== process.env.DEBUG_KEY) {
    res.status(403).send('Forbidden in production');
    return;
  }
  
  // Return the debug information
  res.json({
    environment: process.env.NODE_ENV,
    corsOrigin: process.env.CORS_ORIGIN,
    parsedCorsOrigin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',').map(o => o.trim()) : null,
    requestOrigin: req.headers.origin || 'none',
    requestHost: req.headers.host,
    requestMethod: req.method,
    requestIp: req.ip,
    nodeVersion: process.version,
    timestamp: new Date().toISOString()
  });
});

app.use((req, res, next) => {
  console.log('Incoming request to:', req.originalUrl);
  next();
});

app.get('/health', (req: Request, res: Response) => {
  if (process.env.NODE_ENV === 'production' && 
      !req.ip?.startsWith('10.') && 
      !req.get('user-agent')?.includes('Render')) {
    res.sendStatus(404);
    return;
  }
  res.status(200).json({ 
    status: 'healthy' as const,
    timestamp: new Date().toISOString() 
  });
});
  // TODO check if needed. why calls to /
app.get('/', (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    return res.redirect('/health');
  }
  res.sendStatus(404);
});
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
    sameSite: 'lax',
    maxAge: 1000 * 60 * 60 * 24 * 7,
    path: '/',
    partitioned: true
  }
}));
app.use(passport.initialize());
app.use(passport.session());


app.use('/api/v1', appRouter);


app.use(addRequestId)

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