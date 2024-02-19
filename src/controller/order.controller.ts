import { catchAsyncError } from '../middleware/catchAsyncErrors';
import CourseModel from '../models/course.model';
import NotificationModel from '../models/notification.model';
import { IOrder } from '../models/order.model';
import UserModel from '../models/user.model';
import { getAllOrdersService, newOrder } from '../services/order.service';
import { ErrorHandler } from '../utils/ErrorHandler';
import sendMail from '../utils/sendMail';

// create order
export const createOrder = catchAsyncError(async (req, res, next) => {
  try {
    const { courseId, payment_info } = req.body as IOrder;

    const user = await UserModel.findById(req.user._id);

    if (!user) {
      return next(new ErrorHandler(404, 'User not found'));
    }

    const coursExistInUser = user.courses.find((c) => c._id === courseId);

    if (coursExistInUser) {
      return next(new ErrorHandler(400, 'You already have this course'));
    }

    const course = await CourseModel.findById(courseId);

    if (!course) {
      return next(new ErrorHandler(404, 'Course not found'));
    }

    const data: any = {
      courseId: course._id,
      userId: user._id,
      payment_info,
    };

    const order = await newOrder(data);

    const mailData = {
      order: {
        _id: course._id.toString().slice(0, 6),
        name: course.name,
        price: course.price,
        date: new Date().toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        }),
      },
    };

    await sendMail({
      data: mailData,
      email: user.email,
      subject: 'Order Confirmation',
      template: 'order-confirmation.ejs',
    });

    user.courses.push(course._id);

    await user.save();

    await NotificationModel.create({
      title: 'New Order',
      message: `You have a new order from ${course.name}`,
      userId: user._id,
    });

    course.purchased += 1;
    await course.save();

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      order,
    });
  } catch (error: any) {
    return next(new ErrorHandler(500, error.message));
  }
});

// get all courses -- only admin
export const getAllOrders = catchAsyncError(async (req, res, next) => {
  try {
    const orders = await getAllOrdersService();
    res.status(200).json({
      success: true,
      orders,
    });
  } catch (error: any) {
    return next(new ErrorHandler(500, error.message));
  }
});
