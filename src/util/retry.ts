import { RETRY_MAX_ATTEMPTS, RETRY_MIN_DELAY } from "../constants";
import { AppError } from "./appError";

interface RetryOptions {
    numOfAttempts?: number;
    delay?: number;
}

/**
 * Generic Retry Function
 * @param {() => Promise<T>} - An async function to be retried 
 * @param {RetryOptions} - Number of Attempts and Delay in MS
 * @returns {Promise{T}} - returns a Promise of the result of the function's success or failure
 * @example
 * import retryFunction = './retry';
 * retryFunction(this.collection.findOneAndUpdate(), { numOfAttempts: 3, delay: 3000 });
 */  

export async function retryFunction<T>(operation: () => Promise<T>, options: RetryOptions): Promise<T> {
    const {
        numOfAttempts = RETRY_MAX_ATTEMPTS,
        delay = RETRY_MIN_DELAY
    } = options;

    let attempt = 0;
    let lastError: unknown;

    while (attempt < numOfAttempts) {
        try {
            return await operation();
        } catch (error) {
            lastError = error;
            attempt++;

            if (!shouldRetry(error as Error | AppError) || attempt >= numOfAttempts) {
                break;
            }

            // exponential backoff
            const thisDelay = Math.min(1000 * Math.pow(delay, attempt), 30000);
            await new Promise(resolve => setTimeout(resolve, thisDelay));
        }
    }
    throw lastError;
}

/**
 * Check Error Type to see if needs to be retried
 * @todo collect error types, or refactor errors to include types so they can be classified
 * @param {Error | AppError} - An Error thrown in the app
 * @returns {Promise{T}} - returns a Promise of the result of the function, or the error encountered
 * @example
 * shouldRetry(error);
 */  
function shouldRetry(error: Error | AppError) {
    console.log('should retry error: ', error);
    // return error.code === 'ECONNREFUSED' || 
                // error.code === 'ETIMEDOUT';
    return true;
}