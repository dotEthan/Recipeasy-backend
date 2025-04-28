import { RETRY_MAX_ATTEMPTS, RETRY_MIN_DELAY } from "../constants";
import { RetryOptions } from "../types/utiil";


/**
 * Generic Retry Function
 * @param {() => Promise<T>} operation - An async function to be retried 
 * @param {RetryOptions} options - Retry configuration settings
 * @throws {unknownError} - Throws whatever error is last thrown after retries fail
 * @example
 * import retryFunction = './retry';
 * retryFunction(() => this.collection.findOneAndUpdate(), { numOfAttempts: 3, delay: 3000 });
 */  

export async function retryFunction<T>(operation: () => Promise<T>, options: RetryOptions): Promise<T> {
    const {
        maxAttempts = RETRY_MAX_ATTEMPTS,
        delayMs = RETRY_MIN_DELAY,
        exponential = true,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        shouldRetry = (error: unknown) => true,
    } = options;

    let attempt = 0;
    let lastError: unknown;

    while (attempt < maxAttempts) {
        try {
            return await operation();
        } catch (error) {
            lastError = error;
            attempt++;

            if (!shouldRetry(error) || attempt >= maxAttempts) {
                break;
            }

            // exponential backoff
            const thisDelay = exponential
                ? delayMs * Math.pow(2, attempt - 1)
                : delayMs;

            await new Promise(resolve => setTimeout(resolve, thisDelay));
        }
    }
    throw lastError;
}
