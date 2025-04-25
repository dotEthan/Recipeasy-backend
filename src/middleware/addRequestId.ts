import { NextFunction, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';

export const addRequestId = (req: Request, _res: Response, next: NextFunction) => {
  req.requestId = uuidv4();
  next();
};