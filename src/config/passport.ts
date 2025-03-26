import { PassportStatic }  from 'passport'
import { Strategy } from 'passport-local';
import bcrypt from 'bcryptjs';
import { UserDocument } from '../types/user';
import { VerifiedUserOrErrorFunc } from '../types/passport';
type GetUserByEmailFunction = (email: string) => Promise<UserDocument | null>

export async function initialize(passport: PassportStatic, getUserByEmail: GetUserByEmailFunction) {
    const authenticateUser = async (email: string, password: string, done: VerifiedUserOrErrorFunc) => {
        try {
            const user = await getUserByEmail(email);
            if (user == null) {
                // (error, user, message)
                return done(null, false, { message: 'No user with that email'})
            }
            if (await bcrypt.compare(password, user.password)) {
                return done(null, user);
            } else {
                return done(null, false, { message: 'Password incorrect'});
            }
        } catch(error: unknown) {
            if (error instanceof Error) {
                return done(error);
            }

            return done(new Error(String(error)));
        }
    }
    passport.use(new Strategy({ usernameField: 'email' }, authenticateUser));
    // passport.serializeUser((user: User, done) => {
    //     done(user.uid, user);
    // })
    // passport.deserializeUser((id, done) => {
    //     done(null)
    // })
}