export class HttpError extends Error {
  constructor(
    public statusCode: number,
    message: string,
  ) {
    super(message);
    this.name = "HttpError";
  }
}

export type CsurfError = {
  message: string;
  code: string
}