import 'dotenv/config';

import express, { NextFunction, Request, Response } from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';

import errorMiddleware from './middleware/error';

import userRoute from './routes/user.route';
import courseRoute from './routes/course.route';
import orderRoute from './routes/order.route';
import notiRoute from './routes/notification.route';

import { ErrorHandler } from './utils/ErrorHandler';
import { catchAsyncError } from './middleware/catchAsyncErrors';
import analyticsRoute from './routes/analytics.route';
import layoutRouter from './routes/layouts.route';

export const app = express();

// body parser
app.use(express.json({ limit: '50mb' })); // con esto indicamos que el limite de la peticion es de 50mb

// cookie parser
app.use(cookieParser());

// cors
app.use(cors({ origin: process.env.ORIGIN }));

// testing api
app.get(
  '/test',
  catchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    await Promise.reject(new Error('¡Esto es un error asincrónico!'));

    res.status(200).json({
      message: 'Hello world',
    });
  })
);

// routes
app.use('/api/v1/users', userRoute);
app.use('/api/v1/courses', courseRoute);
app.use('/api/v1/orders', orderRoute);
app.use('/api/v1/notifications', notiRoute);
app.use('/api/v1/analytics', analyticsRoute);
app.use('/api/v1/layouts', layoutRouter);

// unknow route
app.all('*', (req: Request, res: Response, next: NextFunction) => {
  // const err = new Error(`Route ${req.originalUrl} not found`);
  // res.status(404);
  const err = new ErrorHandler(404, `Route ${req.originalUrl} not found`);
  next(err);
  // res.status(404).json({
  //   message: err.message,
  // });
});

app.use(errorMiddleware);
