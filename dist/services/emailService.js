"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailService = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
const constants_1 = require("../constants");
/**
 * Handles all email related services
 * @todo - post - Ensure all errors are handled
 * @todo - post - Create Proper HTML based email structure
 * @todo - post - Add logging
 */
// 
class EmailService {
    constructor() {
        this.emailTemplates = {
            passwordReset: {
                subject: 'Reset your Recipeasy Password',
                text: (displayName, code) => `Your Password Reset link for Recipeasy is ${constants_1.RECIPEASY_PW_RESET_URL}?token=${code}`,
                html: (displayName, code) => `Your Password Reset link for Recipeasy is ${constants_1.RECIPEASY_PW_RESET_URL}?token=${code}`,
            },
            emailVerificationCode: {
                subject: 'Reset your Recipeasy Password',
                text: (displayName, code) => `Hello ${displayName}, your Recipeasy Verification Code is ${code}`,
                html: (displayName, code) => `Hello ${displayName}, your Recipeasy Verification Code is ${code}`,
            }
        };
    }
    ;
    /**
     * send email verification email to client supplied email
     * @group Security - Bot trap
     * @param {string} type - type of email (emailVerificationCode, passwordReset)
     * @return {SMTPTransport.SentMessageInfo} - stats on all attempted emails
     * @example
     * const emailService = useEmailService();
     * await emailService.sendEmailToUser('xyz987');
     */
    sendEmailToUser(type, displayName, email, code) {
        return __awaiter(this, void 0, void 0, function* () {
            const template = this.emailTemplates[type];
            const transporter = nodemailer_1.default.createTransport({
                host: process.env.SMTP_HOST || 'smtp.ethereal.email',
                port: 587,
                secure: false, // true for port 465, false for other ports
                auth: {
                    user: 'meggie95@ethereal.email', // ethermail accounts
                    pass: 'nXCbfzUBxW1ynTUkuk', // ethermail accounts
                },
            });
            return yield transporter.sendMail({
                from: '"Recipeasy Admin" <dotethan@ethanstrauss.com>',
                to: email,
                subject: template.subject,
                text: template.text(displayName, code),
                html: template.text(displayName, code),
            });
        });
    }
    ;
}
exports.EmailService = EmailService;
