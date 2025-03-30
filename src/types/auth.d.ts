import { Document } from "mongodb";

export type LoginAttempt = {
    userId?: string,
    ipAddress?: string,
    userAgent?: string,
    timestamp?: Date,
    success: boolean,
    errorMessage?: string
}

export interface LoginAttemptDocument extends LoginAttempt, Document{};


export type VerificationCode = {
    userId?: string,
    code: string,
    createdAt: date,
}

export interface VerificationCodeDocument extends VerificationCode, Document{};