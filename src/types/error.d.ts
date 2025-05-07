export type CsurfErrorType = {
  message: string;
  code: string
}

type ErrorContextValue = 
  | string 
  | number 
  | boolean 
  | object 
  | Date 
  | null 
  | unknown
  | undefined;

export interface ErrorContext {
  location?: string;
  originalError?: unknown;
  [key: string]: ErrorContextValue;
}