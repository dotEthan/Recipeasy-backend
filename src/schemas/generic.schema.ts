import { z } from "zod";

export const SuccessFailResSchema = z.object({
    success: z.boolean()
})