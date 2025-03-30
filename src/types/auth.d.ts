import { Document, ObjectId } from "mongodb";

export type LoginAttempt = {
    userId?: ObjectId,
    ipAddress?: string,
    userAgent?: string,
    timestamp?: Date,
    success: boolean,
    errorMessage?: string
}

export interface LoginAttemptDocument extends LoginAttempt, Document{};


export type VerificationCode = {
    userId?: ObjectId,
    code: string,
    createdAt: date,
}

export interface VerificationCodeDocument extends VerificationCode, Document{};