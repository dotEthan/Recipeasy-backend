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


export type EmailAuthCode = {
    userId?: ObjectId,
    code: string,
    createdAt: Date,
    updatedAt: Date
}

export interface EmailAuthCodeDocument extends EmailAuthCode, Document{};

export type EmailRegistration = {
    email: string,
    password: string
}

export type AccessToken = {
    userId: ObjectId,
    role: string,
    tokenId: string,
    iat: number,
}

export type RefreshToken = {
    userId: ObjectId,
    tokenId: string,
    tokenHash: string,
    createdAt: Date,
    expiresAt: Date,
}

export interface RefreshTokenDocument extends RefreshToken, Document{};