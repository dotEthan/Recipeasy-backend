import { ObjectId } from 'mongodb';
import 'express-session';
import { UserRoles } from '../enums';

declare global {
  namespace Express {
    interface User {
      _id: ObjectId;
      role: UserRoles
    }
    interface Request {
      requestId: string;
    }
  }
}

declare module 'express-session' {
  interface SessionData {
    unverifiedUserId?: ObjectId;
    userId?: ObjectId;
  }
}

interface PaginationOptions<T> {
  sort?: Record<string, 1 | -1>; 
  skip?: number;
  limit?: number;
  projection?: Document<T>;
}