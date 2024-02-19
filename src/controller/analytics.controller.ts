import { catchAsyncError } from '../middleware/catchAsyncErrors';
import CourseModel from '../models/course.model';
import OrderModel from '../models/order.model';
import UserModel from '../models/user.model';
import { ErrorHandler } from '../utils/ErrorHandler';
import { generateLast12MonthsData } from '../utils/analytics.generator';

// get user analytics -- only admin
export const getUsersAnalytics = catchAsyncError(async (req, res, next) => {
  try {
    const data = await generateLast12MonthsData(UserModel);

    res.status(200).json({
      success: true,
      data,
    });
  } catch (error: any) {
    return next(new ErrorHandler(500, error.message));
  }
});

// get courses analytics -- only admin
export const getCoursesAnalytics = catchAsyncError(async (req, res, next) => {
  try {
    const data = await generateLast12MonthsData(CourseModel);

    res.status(200).json({
      success: true,
      data,
    });
  } catch (error: any) {
    return next(new ErrorHandler(500, error.message));
  }
});

// get courses analytics -- only admin
export const getOrdersAnalytics = catchAsyncError(async (req, res, next) => {
  try {
    const data = await generateLast12MonthsData(OrderModel);

    res.status(200).json({
      success: true,
      data,
    });
  } catch (error: any) {
    return next(new ErrorHandler(500, error.message));
  }
});
