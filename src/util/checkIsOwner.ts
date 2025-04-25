import { AppError } from "../errors";

export function assertUserOwnership(
    authenticatedUserId: string, 
    targetUserId: string
  ): void {
    if (authenticatedUserId !== targetUserId) {
      throw new AppError('User does not own this resource', 401);
    }
  }