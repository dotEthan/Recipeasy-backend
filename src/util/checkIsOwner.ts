import { ForbiddenError } from "../errors";

export function assertUserOwnership(
    authenticatedUserId: string, 
    targetUserId: string
  ): void {
    if (authenticatedUserId !== targetUserId) {
      throw new ForbiddenError('User does not own this resource', { authenticatedUserId, targetUserId });
    }
  }