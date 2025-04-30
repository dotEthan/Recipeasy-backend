"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.retryFunction = retryFunction;
const constants_1 = require("../constants");
/**
 * Generic Retry Function
 * @param {() => Promise<T>} operation - An async function to be retried
 * @param {RetryOptions} options - Retry configuration settings
 * @throws {unknownError} - Throws whatever error is last thrown after retries fail
 * @example
 * import retryFunction = './retry';
 * retryFunction(() => this.collection.findOneAndUpdate('_id', { $set: { updatedAt: new Date() }}), { numOfAttempts: 3, delay: 3000 });
 */
function retryFunction(operation, options) {
    return __awaiter(this, void 0, void 0, function* () {
        const { maxAttempts = constants_1.RETRY_MAX_ATTEMPTS, delayMs = constants_1.RETRY_MIN_DELAY, exponential = true, 
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        shouldRetry = (error) => true, } = options;
        let attempt = 0;
        let lastError;
        while (attempt < maxAttempts) {
            try {
                return yield operation();
            }
            catch (error) {
                lastError = error;
                attempt++;
                if (!shouldRetry(error) || attempt >= maxAttempts) {
                    break;
                }
                // exponential backoff
                const thisDelay = exponential
                    ? delayMs * Math.pow(2, attempt - 1)
                    : delayMs;
                yield new Promise(resolve => setTimeout(resolve, thisDelay));
            }
        }
        throw lastError;
    });
}
