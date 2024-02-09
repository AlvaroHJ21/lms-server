import { NextFunction, Request, Response } from 'express';
import { ErrorHandler } from '../utils/ErrorHandler';

export default (err: any, req: Request, res: Response, next: NextFunction) => {
  err.statusCode = err.statusCode || 500;
  err.message = err.message || 'Internal Server Error';

  // wrong mongodb id error
  if (err.name === 'CastError') {
    const message = `Resource not found. Invalid: ${err.path}`;
    err = new ErrorHandler(404, message);
  }

  // Duplicate key error
  if (err.code === 11000) {
    const message = `Duplicate ${Object.keys(err.keyValue)} entered`;
    err = new ErrorHandler(400, message);
  }

  // wrong jwt error
  if (err.name === 'JsonWebTokenError') {
    const message = 'JsonWebToken is invalid, try again';
    err = new ErrorHandler(401, message);
  }

  // jwt expired error
  if (err.name === 'TokenExpiredError') {
    const message = 'JsonWebToken is expired, try again';
    err = new ErrorHandler(401, message);
  }

  res.status(err.statusCode).json({
    success: false,
    message: err.message,
    // error: err,
    // stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
};
