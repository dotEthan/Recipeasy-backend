import nodemailer from 'nodemailer';
import { EmailFormat, EmailTypes } from '../types/email';
import { RECIPEASY_PW_RESET_URL } from '../constants';

/**
 * Handles all email related services
 * @todo Ensure all errors are handled
 * @todo Create Proper HTML based email structure
 */
// 
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

    /**
     * send email verification email to client supplied email
     * @group Security - Bot trap
     * @param {string} type - type of email (emailVerificationCode, passwordReset)
     * @return {SMTPTransport.SentMessageInfo} - stats on all attempted emails
     * @example
     * const emailService = useEmailService();
     * await emailService.sendEmailToUser('xyz987');
     */

    public async sendEmailToUser(type: EmailTypes, displayName: string, email: string, code: string) {
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
