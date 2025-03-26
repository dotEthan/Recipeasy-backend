import 'express';
import { PassportStatic }  from 'passport'
import { Strategy } from 'passport-local';
import bcrypt from 'bcryptjs';

import { VerifiedUserOrErrorFunc } from '../types/passport';
import { UserRepository } from '../repositories/userRepository';


export async function initialize(passport: PassportStatic) {
    const userRepository = new UserRepository();
    
    const authenticateUser = async (email: string, password: string, done: VerifiedUserOrErrorFunc) => {
        try {
            const user = await userRepository.findByemail(email);
            if (user == null) {
                // (error, user, message)
                return done(null, false, { message: 'No user with that email'});
            };
            if (await bcrypt.compare(password, user.password)) {
                return done(null, user);
            } else {
                return done(null, false, { message: 'Password incorrect'});
            };
        } catch(error: unknown) {
            if (error instanceof Error) {
                return done(error);
            };

            return done(new Error(String(error)));
        }
    }
    passport.use(new Strategy({ usernameField: 'email' }, authenticateUser));
    passport.serializeUser((user: Express.User, done: (err: Error | null, id?: string | undefined) => void) => {
        done(null, user._id);
      });
    passport.deserializeUser(async (id: string, done) => {
        try {
            const user = await userRepository.findByid(id);
            done(null, user);
        } catch (error: unknown) {
            done(error);
        }
    });
}