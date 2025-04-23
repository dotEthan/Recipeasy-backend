import { ObjectId } from "mongodb";

/**
 * Ensure values that should be an ObjectId, are.
 * @param id - The ID (either string or ObjectId)
 * @returns ObjectId
 */
export function ensureObjectId(id: string | ObjectId): ObjectId {
  return typeof id === 'string' ? new ObjectId(id) : id;
}