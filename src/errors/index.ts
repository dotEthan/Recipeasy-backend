// Passport Error recreation as defaults to HTML
export class UnauthorizedError extends Error {
    statusCode = 401;
    constructor(message: string) {
        super(message);
    }
}

export class HttpError extends Error {
    constructor(
      public statusCode: number,
      message: string,
    ) {
      super(message);
      this.name = "HttpError";
    }
  }