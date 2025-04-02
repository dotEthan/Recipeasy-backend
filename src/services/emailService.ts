import nodemailer from 'nodemailer';
import { EmailFormat, EmailTypes } from '../types/email';
import { RECIPEASY_PW_RESET_URL } from '../constants';

export class EmailService {
    private emailTemplates = {
        passwordReset: {
            subject: 'Reset your Recipeasy Password',
            text: (displayName:string, code:string) => `Your Password Reset link for Recipeasy is ${RECIPEASY_PW_RESET_URL}?token=${code}`,
            html: (displayName:string, code:string) => `Your Password Reset link for Recipeasy is ${RECIPEASY_PW_RESET_URL}?token=${code}`,
        },
        emailVerificationCode: {
            subject: 'Reset your Recipeasy Password',
            text: (displayName:string, code:string) => `Hello ${displayName}, your Recipeasy Verification Code is ${code}`,
            html: (displayName:string, code:string) => `Hello ${displayName}, your Recipeasy Verification Code is ${code}`,
        }
    } as EmailFormat;

    constructor() {};

    public async sendEmailToUser(type: EmailTypes, displayName: string, email: string, code: string) {
        console.log('sendEmailToUser email: ', email)
        console.log('sendEmailToUser displayName: ', displayName)
        console.log('sendEmailToUser type: ', type)
        console.log('sendEmailToUser code: ', code)
        const template = this.emailTemplates[type];
        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST || 'smtp.ethereal.email',
            port: 587,
            secure: false, // true for port 465, false for other ports
            auth: {
                user: 'meggie95@ethereal.email', // ethermail accounts
                pass: 'nXCbfzUBxW1ynTUkuk', // ethermail accounts
            },
        });
        console.log(template.text(displayName, code));
        return await transporter.sendMail({
            from: '"Recipeasy Admin" <dotethan@ethanstrauss.com>',
            to: email,
            subject: template.subject,
            text: template.text(displayName, code),
            html: template.text(displayName, code),
        });
    };
}
