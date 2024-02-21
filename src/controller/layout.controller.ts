import { catchAsyncError } from '../middleware/catchAsyncErrors';
import LayoutModel from '../models/layout.model';
import { ErrorHandler } from '../utils/ErrorHandler';
import cloudinary from 'cloudinary';

// Create layout
export const createLayout = catchAsyncError(async (req, res, next) => {
  try {
    const { type } = req.body;

    const isTypeExist = await LayoutModel.findOne({
      type,
    });

    if (isTypeExist) {
      return next(new ErrorHandler(400, `Layout with type ${type} already exist`));
    }

    if (type == 'Banner') {
      const { image, title, subTitle } = req.body;

      const myCloud = await cloudinary.v2.uploader.upload(image, { folder: 'layout' });

      await LayoutModel.create({
        type,
        banner: {
          image: {
            public_id: myCloud.public_id,
            url: myCloud.secure_url,
          },
          title,
          subTitle,
        },
      });
    }

    if (type == 'FAQ') {
      const { faq } = req.body;

      await LayoutModel.create({
        type,
        faq,
      });
    }

    if (type == 'Categories') {
      const { categories } = req.body;

      await LayoutModel.create({
        type,
        categories,
      });
    }

    res.status(201).json({
      success: true,
      message: 'Layout created successfully',
    });
  } catch (error: any) {
    return next(new ErrorHandler(500, error.message));
  }
});

// Edit layout
export const editLayout = catchAsyncError(async (req, res, next) => {
  try {
    const { type } = req.body;

    const layout = await LayoutModel.findOne({ type });

    if (!layout) {
      return next(new ErrorHandler(404, 'Layout not found'));
    }

    if (layout.type == 'Banner') {
      const { image, title, subTitle } = req.body;

      if (image) {
        await cloudinary.v2.uploader.destroy(layout.banner.image.public_id);
        const myCloud = await cloudinary.v2.uploader.upload(image, { folder: 'layout' });

        layout.banner.image = {
          public_id: myCloud.public_id,
          url: myCloud.secure_url,
        } as any;
      }

      layout.banner.title = title ?? layout.banner.title;
      layout.banner.subTitle = subTitle ?? layout.banner.subTitle;
    }

    if (layout.type == 'FAQ') {
      const { faq } = req.body;

      layout.faq = faq;
    }

    if (layout.type == 'Categories') {
      const { categories } = req.body;

      layout.categories = categories;
    }

    await layout.save();

    res.status(200).json({
      success: true,
      message: 'Layout updated successfully',
    });
  } catch (error: any) {
    return next(new ErrorHandler(500, error.message));
  }
});

// get layout by type
export const getLayoutByType = catchAsyncError(async (req, res, next) => {
  try {
    const { type } = req.body;

    const layout = await LayoutModel.findOne({ type });

    if (!layout) {
      return next(new ErrorHandler(404, 'Layout not found'));
    }

    res.status(200).json({
      success: true,
      layout,
    });
  } catch (error: any) {
    return next(new ErrorHandler(500, error.message));
  }
});
