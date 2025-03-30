import { Request } from "express";
import nodemailer from 'nodemailer';


import { LoginAttempt } from "../types/auth";
import { UserRepository } from "../repositories/userRepository";
import {AuthVerificationCodesRepository, AuthLoginAttemptRepository} from "../repositories/authRespository";
import { ObjectId } from "mongodb";

export class AuthService {
    private AuthLoginAttemptRepository: AuthLoginAttemptRepository;
    private AuthVerificationCodesRepository: AuthVerificationCodesRepository;
    private userRepository: UserRepository;

    constructor(
        userRepository: UserRepository,
        AuthLoginAttemptRepository: AuthLoginAttemptRepository,
        AuthVerificationCodesRepository: AuthVerificationCodesRepository
    ) {
        this.AuthVerificationCodesRepository = AuthVerificationCodesRepository;
        this.AuthLoginAttemptRepository = AuthLoginAttemptRepository;
        this.userRepository = userRepository;
    }


    async logLoginAttempt(req: Request, success: boolean, errorMessage?: string)  {
        // TODO test req.ip is working in production
        console.log('errormsg:', errorMessage)
        const loginData: LoginAttempt = {
            userId: new ObjectId(req.user?._id),
            ipAddress: req.ip,
            userAgent: req.headers['user-agent'],
            timestamp: new Date(),
            success,
            errorMessage: success ? undefined : errorMessage,
        };
        try {
            await this.AuthLoginAttemptRepository.create(loginData);
            return;
        } catch(error: unknown) {
            // global error handle, log but don't stop flow
            console.log(error);
        }
    }

    async setAndSendVerificationCode(email: string, displayName: string, userId: ObjectId): Promise<boolean> {
        const verificationCode = Math.floor(100000 + Math.random() * 900000);
        console.log(`sending email: ${email} for ${displayName}`)

        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST || 'smtp.ethereal.email',
            port: 587,
            secure: false, // true for port 465, false for other ports
            auth: {
                user: 'meggie95@ethereal.email', // Auto-generated
                pass: 'nXCbfzUBxW1ynTUkuk', // Auto-generated
            },
        });

        try{
            const info = await transporter.sendMail({
                from: '"Recipeasy Admin" <dotethan@ethanstrauss.com>',
                to: email,
                subject: "Hello ✔",
                text: `Hello ${displayName}, your Recipeasy Verification Code is ${verificationCode}`,
                html: `<b>Hello ${displayName}!</b> Your recipeasy Verification Code is ${verificationCode}`,
            });
            
            console.log("Message sent: %s", info.messageId);
            await this.AuthVerificationCodesRepository.create({ 
                userId,
                verificationCode,
                createdAt: new Date(),
            });
            return true;
        } catch(err) {
            console.log('Sending Email err:', err);
            return false
        }
    }

    async checkVerificationCode(userId: ObjectId, code: string): Promise<boolean> {
        let isVerified = false;
        try {
            const vCode = await this.AuthVerificationCodesRepository.findOne({userId: userId});
            if (vCode?.verificationCode && parseInt(code) === vCode.verificationCode) isVerified = true;
            console.log('isVerfied: ', isVerified);
        } catch(err) {
            console.log('check verfication code Err', err);
        };
        return isVerified;
    }
}