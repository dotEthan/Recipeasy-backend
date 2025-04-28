
export interface RetryOptions {
    maxAttempts?: number;
    delayMs?: number;
    exponential?: boolean;
    shouldRetry?: (error: unknown) => boolean;
}