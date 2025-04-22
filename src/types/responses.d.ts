import { ObjectId, OptionalUnlessRequiredId, WithId } from "mongodb";
import { User } from "./user";
import { Recipe } from "./recipe";

// Todo: Generic or specific?
export type StandardResponse = {
    success: boolean;
    message?: string;
    data?: unknown;
    error?: string;
};

export type StandardUserResponse = {
    success: boolean;
    message?: string;
    user?: User;
    error?: string;
};

export type CreatedDataResponse<T> = OptionalUnlessRequiredId<T> & { _id: ObjectId};

export type PaginateResponse = {
    totalDocs: number;
    data: WithId<T>;
}

export type LoginResponse = {
    user: User;
    newEmailVerifyCodeCreated: boolean;
    recipeResponse: Recipe[];
}

export type GetUserResponse = {
    user: User,
    userRecipes: Recipe[]
}