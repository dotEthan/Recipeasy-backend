import { User } from "./user";

export type VerifiedUserOrErrorFunc = (error: Error | null, user?: User | false, info?: { message: string }) => void;
