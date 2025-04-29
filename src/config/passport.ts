import 'express';
import { PassportStatic }  from 'passport'
import { Strategy } from 'passport-local';
import bcrypt from 'bcryptjs';

import { VerifiedUserOrErrorFunc } from '../types/passport';
import { UserRepository } from '../repositories/user/userRepository';
import { ObjectId } from 'mongodb';
import { User } from '../types/user';
import { ServerError, UnauthorizedError } from '../errors';

/**
 * Initializes Passport for authentication, working with express-sessions
 * @function initialize
 * @param {PassportStatic} passport - An async function to be retried 
 * @example
 * import passport from 'passport';
 * import initialize from './config/passport';
 * 
 * initialize(passport);
 * app.use(passport.initialize());
 * app.use(passport.session());
 */  

export async function initialize(passport: PassportStatic) {
    const userRepository = new UserRepository();
    
    const authenticateUser = async (email: string, password: string, done: VerifiedUserOrErrorFunc) => {
        try {
            console.log('serializing1')
            const user = await userRepository.findByEmailWithInternals(email);
            if (user == null) {
                // (error, user, message)
                return done(null, false, { message: 'No user with that email'});
            };
            console.log('serializing2', password)
            console.log('serializing2', user.password)
            if (await bcrypt.compare(password, user.password)) {
                console.log('serializing3')
                return done(null, user);
            } else {
                console.log('serializing4')
                return done(null, false, { message: 'Password incorrect'});
            };
        } catch(error: unknown) {
            if (error instanceof UnauthorizedError || error instanceof ServerError) {
                return done(error);
            } else if (error instanceof Error) {
                return done(
                    new ServerError('Passport failed to create session',
                        { 
                            location:'authController.authenticateUser', 
                            originalError: {
                                name: error.name, 
                                message: error.message, 
                                stack: error.stack
                            } 
                        },
                    )
                );
            };
        }
    };

    passport.use(new Strategy({ usernameField: 'email' }, authenticateUser));

    passport.serializeUser((user: Express.User, done: (err: Error | null, id?: string | undefined) => void) => {
        console.log('serializing')
        done(null, user._id.toString());
    });

    passport.deserializeUser(async (id: string, done) => {
        console.log('deserializing')
        try {
            const user = await userRepository.findById(new ObjectId(id)) as User;
            done(null, user);
        } catch (error: unknown) {
            done(error);
        }
    });
}