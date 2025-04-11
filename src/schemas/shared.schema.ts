import { ObjectId } from "mongodb";
import { z } from "zod";


export const ObjectIdSchema = z.custom<ObjectId>((val) => {
    return val instanceof ObjectId || ObjectId.isValid(val);
}, {
    message: "Invalid MongoDB ObjectId"
});