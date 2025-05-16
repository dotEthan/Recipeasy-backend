import { z } from "zod";
import { BadRequestError } from "../errors";
import { ErrorCode } from "../types/enums";

export function zodValidationWrapper<T>(
  schema: z.ZodType<T>,
  data: unknown,
  location: string
): T {
  try {
    return schema.parse(data);
  } catch (error) {
    console.log('error', typeof error)
    if (error instanceof z.ZodError) { 
        console.log('zod error')           
      throw new BadRequestError(
        'Zod Validation Failed',
        { location, data, originalError: error },
        ErrorCode.ZOD_VALIDATION_ERR
      );
    }
    throw error;
  }
}