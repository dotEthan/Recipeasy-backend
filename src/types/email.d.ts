export interface EmailFormat {
    passwordReset: EmailData;
    emailVerificationCode: EmailData;
}

export type EmailTypes = keyof EmailFormat;

export interface EmailData {
    subject: string;
    text: (displayName: string, code: string) => string;
    html: (displayName: string, code: string) => string;
}