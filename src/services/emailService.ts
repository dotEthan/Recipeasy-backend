import nodemailer from 'nodemailer';
import { EmailFormat, EmailTypes } from '../types/email';

/**
 * Handles all email related services
 * @todo - post - Ensure all errors are handled
 * @todo - post - Create Proper HTML based email structure
 * @todo - post - Add logging
 */
// 
export class EmailService {
    private emailTemplates = {
        passwordReset: {
            subject: 'Reset your Recipeasy Password',
            text: (displayName:string, code:string) => `Your Password Reset link for Recipeasy is ${process.env.RECIPEASY_PW_RESET_URL}?token=${code}`,
            html: (displayName:string, code:string) => `Your Password Reset link for Recipeasy is ${process.env.RECIPEASY_PW_RESET_URL}?token=${code}`,
        },
        emailVerificationCode: {
            subject: 'Reset your Recipeasy Password',
            text: (displayName:string, code:string) => `Hello ${displayName}, your Recipeasy Verification Code is ${code}`,
            html: (displayName:string, code:string) => `Hello ${displayName}, your Recipeasy Verification Code is ${code}`,
        }
    } as EmailFormat;

    constructor() {};

    /**
     * send email verification email to client supplied email
     * @todo create real email host
     * @group User - Password reset
     * @param {string} type - type of email (emailVerificationCode, passwordReset)
     * @return {SMTPTransport.SentMessageInfo} - stats on all attempted emails
     * @example
     * const emailService = useEmailService();
     * await emailService.sendEmailToUser('xyz987');
     */

    public async sendEmailToUser(type: EmailTypes, displayName: string, email: string, code: string) {
        const template = this.emailTemplates[type];

        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: parseInt(process.env.SMTP_PORT || '587'),
            secure: false, // true for port 465, false for other ports
            requireTLS: true,
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASSWORD,
            },
        });
        return await transporter.sendMail({
            from: '"Tastyista Admin" <noreply@tastyista.com>',
            to: email,
            subject: template.subject,
            text: template.text(displayName, code),
            html: template.text(displayName, code),
        });
    };
}
