import { ObjectId, OptionalUnlessRequiredId } from "mongodb";

export type StandardResponse = {
    success: boolean;
    message?: string;
    data?: unknown;
    error?: string;
};

export type CreatedDataResponse<T> = OptionalUnlessRequiredId<T> & { _id: ObjectId};