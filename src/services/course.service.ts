import { catchAsyncError } from '../middleware/catchAsyncErrors';
import CourseModel from '../models/course.model';

// create course
export const createCourse = async (data: any) => {
  const course = await CourseModel.create(data);
  return course;
};

// get all courses
export const getAllCoursesService = async () => {
  const courses = await CourseModel.find().sort({
    createdAt: -1, // latest user first
  });

  return courses;
};
