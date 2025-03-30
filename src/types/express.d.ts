import { ObjectId } from 'mongodb';
import { User as CustomUser } from './user';
import 'express-session';

declare global {
  namespace Express {
    interface User extends CustomUser {
      _id: ObjectId;
    }
  }
}

declare module 'express-session' {
  interface SessionData {
    unverifiedUserId?: ObjectId;
    userId?: ObjectId;
  }
}