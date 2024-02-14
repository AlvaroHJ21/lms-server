import { catchAsyncError } from '../middleware/catchAsyncErrors';
import CourseModel from '../models/course.model';

// create course
export const createCourse = async (data: any) => {
  const course = await CourseModel.create(data);
  return course;
};
