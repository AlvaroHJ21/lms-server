import { Request, Response, NextFunction } from 'express';
import { catchAsyncError } from './catchAsyncErrors';
import { ErrorHandler } from '../utils/ErrorHandler';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { redis } from '../utils/redis';

// authenticate user
export const isAuthenticated = async function authenticate(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { access_token } = req.cookies;

    if (!access_token) {
      return next(new ErrorHandler(401, 'Login first to access this resource'));
    }

    const decoded = jwt.verify(access_token, process.env.ACCESS_TOKEN as string) as JwtPayload;

    if (!decoded) {
      return next(new ErrorHandler(401, 'Access token is not valid'));
    }

    const user = await redis.get(decoded.id);

    if (!user) {
      return next(new ErrorHandler(401, 'User not found'));
    }

    req.user = JSON.parse(user);

    next();
  } catch (error) {
    next(error);
  }
};

// validatie user role

export const authorizeRoles = (...roles: string[]) => {
  return function authorize(req: Request, res: Response, next: NextFunction) {
    if (!roles.includes(req.user.role)) {
      return next(
        new ErrorHandler(403, `Role (${req.user.role}) is not allowed to access this resource`)
      );
    }
    next();
  };
};
