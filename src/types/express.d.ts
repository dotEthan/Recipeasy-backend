import { User as CustomUser } from '../types/user';
declare global {
    namespace Express {
      interface User extends CustomUser {
        _id: string;
      }
    }
  }