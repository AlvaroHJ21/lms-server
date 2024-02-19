import { catchAsyncError } from '../middleware/catchAsyncErrors';
import NotificationModel from '../models/notification.model';
import { ErrorHandler } from '../utils/ErrorHandler';
import cron from 'node-cron';

// get all notifications -- only admin
export const getNotifications = catchAsyncError(async (req, res, next) => {
  try {
    const notifications = await NotificationModel.find().sort({
      createdAt: -1, // latest notification first
    });

    res.status(200).json({
      success: true,
      notifications,
    });
  } catch (error: any) {
    return next(new ErrorHandler(500, error.message));
  }
});

//update notification status -- only admin

export const updateNotification = catchAsyncError(async (req, res, next) => {
  try {
    const notification = await NotificationModel.findById(req.params.id);

    if (!notification) {
      return next(new ErrorHandler(404, 'Notification not found'));
    }

    notification.status = 'read';

    await notification.save();

    const notifications = await NotificationModel.find().sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      notifications,
    });
  } catch (error: any) {
    return next(new ErrorHandler(500, error.message));
  }
});

//delete notification -- only admin

cron.schedule('0 0 0 * * *', async function () {
  // 0 0 0 * * * runs every day at midnight
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  await NotificationModel.deleteMany({
    status: 'read',
    createdAt: {
      $lt: thirtyDaysAgo, // less than thirty days ago, lt = less than
    },
  });

  console.log('Deleted notifications older than 30 days');
});
