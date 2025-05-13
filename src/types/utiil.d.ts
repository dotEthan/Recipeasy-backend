
export interface RetryOptions {
    maxAttempts?: number;
    delayMs?: number;
    exponential?: boolean;
    shouldRetry?: (error: unknown) => boolean;
}

export interface DecodedRefreshToken {
    userId: string;
    tokenId: string;
    iat: number;
}