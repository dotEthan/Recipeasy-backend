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