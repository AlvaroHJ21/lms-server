import { catchAsyncError } from '../middleware/catchAsyncErrors';
import CourseModel from '../models/course.model';
import { createCourse } from '../services/course.service';
import { ErrorHandler } from '../utils/ErrorHandler';
import cloudinary from 'cloudinary';
import { redis } from '../utils/redis';
import mongoose from 'mongoose';
import sendMail from '../utils/sendMail';

// upload course
export const uploadCourse = catchAsyncError(async (req, res, next) => {
  try {
    const data = req.body;

    if (data.thumbnail) {
      const myCloud = await cloudinary.v2.uploader.upload(data.thumbnail, {
        folder: 'courses',
      });
      data.thumbnail = {
        public_id: myCloud.public_id,
        url: myCloud.secure_url,
      };
    }

    const createdCourse = await createCourse(data);

    res.status(201).json({
      success: true,
      message: 'Course uploaded successfully',
      course: createdCourse,
    });
  } catch (error: any) {
    return next(new ErrorHandler(500, error.message));
  }
});

// edit course

export const editCourse = catchAsyncError(async (req, res, next) => {
  try {
    const data = req.body;

    if (data.thumbnail) {
      await cloudinary.v2.uploader.destroy(data.thumbnail.public_id);

      const myCloud = await cloudinary.v2.uploader.upload(data.thumbnail, {
        folder: 'courses',
      });
      data.thumbnail = {
        public_id: myCloud.public_id,
        url: myCloud.secure_url,
      };
    }

    const courseId = req.params.id;

    const course = await CourseModel.findByIdAndUpdate(
      courseId,
      {
        $set: data, // usamos $set para actualizar solo los campos que se envian
      },
      {
        new: true,
      }
    );

    res.status(201).json({
      success: true,
      message: 'Course updated successfully',
      course,
    });
  } catch (error: any) {
    return next(new ErrorHandler(500, error.message));
  }
});

// get single course ---- without purchasing
export const getSingleCourse = catchAsyncError(async (req, res, next) => {
  try {
    const courseId = req.params.id;

    const isCacheExist = await redis.get(courseId);

    if (isCacheExist) {
      return res.status(200).json({
        success: true,
        course: JSON.parse(isCacheExist),
      });
    }

    const course = await CourseModel.findById(req.params.id).select(
      '-courseData.videoUrl -courseData.suggestion -courseData.questions -courseData.links'
    );

    if (!course) {
      return next(new ErrorHandler(404, 'Course not found'));
    }

    await redis.set(courseId, JSON.stringify(course));

    res.status(200).json({
      success: true,
      course,
    });
  } catch (error: any) {
    return next(new ErrorHandler(500, error.message));
  }
});

// get all courses --- without purchasing
export const getAllCourses = catchAsyncError(async (req, res, next) => {
  try {
    const isCatchExist = await redis.get('allCourses');
    if (isCatchExist) {
      return res.status(200).json({
        success: true,
        courses: JSON.parse(isCatchExist),
      });
    }

    const courses = await CourseModel.find().select(
      '-courseData.videoUrl -courseData.suggestion -courseData.questions -courseData.links'
    );

    await redis.set('allCourses', JSON.stringify(courses));

    res.status(200).json({
      success: true,
      courses,
    });
  } catch (error: any) {
    return next(new ErrorHandler(500, error.message));
  }
});

// get course content -- only for valid user

export const getCourseByUser = catchAsyncError(async (req, res, next) => {
  try {
    const userCourseList = req.user.courses;
    const courseId = req.params.id;

    const courseExists = userCourseList.find((course: any) => course._id === courseId);

    if (!courseExists) {
      return next(new ErrorHandler(404, 'You are not eligible to access this course'));
    }

    const course = await CourseModel.findById(courseId);

    const content = course?.courseData;

    res.status(200).json({
      success: true,
      content,
    });
  } catch (error: any) {
    return next(new ErrorHandler(500, error.message));
  }
});

// add question in course

interface IAddQuestion {
  question: string;
  courseId: string;
  contentId: string;
}

export const addQuestion = catchAsyncError(async (req, res, next) => {
  try {
    const { question, contentId, courseId } = req.body as IAddQuestion;

    const course = await CourseModel.findById(courseId);

    if (!mongoose.Types.ObjectId.isValid(contentId)) {
      return next(new ErrorHandler(400, 'Invalid content id'));
    }

    const courseContent = course?.courseData.find((content) => content._id.equals(contentId));

    if (!courseContent) {
      return next(new ErrorHandler(404, 'Content not found'));
    }

    // create a new question object
    const newQuestion: any = {
      user: req.user,
      question,
      questionReplies: [],
    };

    //add this question to our course content
    courseContent.questions.push(newQuestion);

    //save the updated course

    await course?.save();

    res.status(200).json({
      success: true,
      course: course,
    });
  } catch (error: any) {
    return next(new ErrorHandler(500, error.message));
  }
});

// add answer in course question

interface IAddAnswerData {
  answer: string;
  courseId: string;
  contentId: string;
  questionId: string;
}

export const addAnswer = catchAsyncError(async (req, res, next) => {
  try {
    const { answer, contentId, courseId, questionId } = req.body as IAddAnswerData;

    const course = await CourseModel.findById(courseId);

    if (!course) {
      return next(new ErrorHandler(404, 'Course not found'));
    }

    const courseVideo = course?.courseData.find((content) => content._id.equals(contentId));

    if (!courseVideo) {
      return next(new ErrorHandler(404, 'Video not found'));
    }

    const question = courseVideo.questions.find((q) => q._id.equals(questionId));

    if (!question) {
      return next(new ErrorHandler(404, 'Question not found'));
    }

    const newAnswer: any = {
      user: req.user,
      question: answer,
    };

    question.questionReplies.push(newAnswer);

    await course.save();

    // si el usuario que responde es el mismo que hizo la pregunta, no enviamos un correo
    if (req.user?._id === question.user._id) {
      // TODO: create a notification
      console.log('No email sent');
    } else {
      const data = {
        name: question.user.name,
        title: courseVideo.title,
      };

      await sendMail({
        data,
        email: question.user.email,
        subject: 'Question Reply',
        template: 'question-reply.ejs',
      });
    }

    res.status(200).json({
      success: true,
      course,
    });
  } catch (error: any) {
    return next(new ErrorHandler(500, error.message));
  }
});

// add review in course
interface IAddReviewData {
  review: string;
  rating: number;
}

export const addReview = catchAsyncError(async (req, res, next) => {
  try {
    const userCourseList = req.user.courses;

    const coursId = req.params.id;

    //check if course exist in user course list based on _id
    const courseExist = userCourseList.find((course: any) => course._id === coursId);

    if (!courseExist) {
      return next(new ErrorHandler(404, 'You are not eligible to access this course'));
    }

    const course = await CourseModel.findById(coursId);

    if (!course) {
      return next(new ErrorHandler(404, 'Course not found'));
    }
    const { review, rating } = req.body as IAddReviewData;

    const reviewData: any = {
      user: req.user,
      comment: review,
      rating,
    };

    course?.reviews.push(reviewData);

    await course.save();

    res.status(200).json({
      success: true,
      course,
    });

    let avg = 0;

    course.reviews.forEach((review) => {
      avg += review.rating;
    });

    course.ratings = avg / course.reviews.length;

    await course.save();

    await redis.set(coursId, JSON.stringify(course));

    const notification = {
      title: 'New Review Received',
      message: `${course.name} has given a review in ${course.name}`,
    };

    //TODO: create a notification

    res.status(200).json({
      success: true,
      course,
    });
  } catch (error: any) {
    return next(new ErrorHandler(500, error.message));
  }
});

// add reply in review
interface IAddReplyReviewData {
  repply: string;
  courseId: string;
  reviewId: string;
}

export const addReplyToReview = catchAsyncError(async (req, res, next) => {
  try {
    const { courseId, repply, reviewId } = req.body as IAddReplyReviewData;

    const userCorusesList = req.user.courses;

    const courseExist = userCorusesList.find((course: any) => course._id === courseId);

    if (!courseExist) {
      return next(new ErrorHandler(404, 'You are not eligible to access this course'));
    }

    const course = await CourseModel.findById(courseId);

    if (!course) {
      return next(new ErrorHandler(404, 'Course not found'));
    }

    const review = course.reviews.find((r) => r._id.equals(reviewId));

    if (!review) {
      return next(new ErrorHandler(404, 'Review not found'));
    }

    const newReply: any = {
      user: req.user,
      question: repply,
    };

    if (!review.commentReplies) {
      review.commentReplies = [];
    }

    review.commentReplies.push(newReply);

    await course.save();

    res.status(200).json({
      success: true,
      course,
    });
  } catch (error: any) {
    return next(new ErrorHandler(500, error.message));
  }
});
