import { ForbiddenError } from "../errors";
import { ErrorCode } from "../types/enums";

export function assertUserOwnership(
    authenticatedUserId: string, 
    targetUserId: string
  ): void {
    if (authenticatedUserId !== targetUserId) {
      throw new ForbiddenError(
        'User does not own this resource', 
        { 
          authenticatedUserId, 
          targetUserId,
          location: 'checkIsOwner.asserUserOwnership'
        },
        ErrorCode.RESOURCE_NOT_OWNED
      );
    }
  }