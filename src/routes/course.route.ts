import express from 'express';
import {
  addAnswer,
  addQuestion,
  addReplyToReview,
  addReview,
  deleteCourse,
  editCourse,
  getAllCourses,
  getAllCoursesAdmin,
  getCourseByUser,
  getSingleCourse,
  uploadCourse,
} from '../controller/course.controller';
import { authorizeRoles, isAuthenticated } from '../middleware/auth';

const router = express.Router();

router.post('/create-course', isAuthenticated, authorizeRoles('admin'), uploadCourse);
router.put('/edit-course/:id', isAuthenticated, authorizeRoles('admin'), editCourse);
router.get('/get-course/:id', getSingleCourse);
router.get('/get-courses', getAllCourses);
router.get('/get-course-content/:id', isAuthenticated, getCourseByUser);
router.post('/add-question', isAuthenticated, addQuestion);
router.post('/add-answer', isAuthenticated, addAnswer);
router.post('/add-review/:id', isAuthenticated, addReview);
router.post('/add-reply-review', isAuthenticated, authorizeRoles('admin'), addReplyToReview);
router.get('/get-all', isAuthenticated, authorizeRoles('admin'), getAllCoursesAdmin);
router.delete('/delete-course/:id', isAuthenticated, authorizeRoles('admin'), deleteCourse);
export default router;
