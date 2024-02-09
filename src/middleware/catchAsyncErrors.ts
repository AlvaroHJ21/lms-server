import { NextFunction, Request, Response } from 'express';

export const catchAsyncError =
  (theFunc: (req: Request, res: Response, next: NextFunction) => void) =>
  (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(theFunc(req, res, next)).catch(next);
  };
