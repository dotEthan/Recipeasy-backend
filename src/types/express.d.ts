import { User as CustomUser } from './user';
declare global {
  namespace Express {
    interface User extends CustomUser {
      _id: string;
    }
  }
}