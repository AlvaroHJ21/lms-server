import express from 'express';
import { authorizeRoles, isAuthenticated } from '../middleware/auth';
import {
  getCoursesAnalytics,
  getOrdersAnalytics,
  getUsersAnalytics,
} from '../controller/analytics.controller';

const analyticsRoute = express.Router();

analyticsRoute.get('/users', isAuthenticated, authorizeRoles('admin'), getUsersAnalytics);
analyticsRoute.get('/courses', isAuthenticated, authorizeRoles('admin'), getCoursesAnalytics);
analyticsRoute.get('/orders', isAuthenticated, authorizeRoles('admin'), getOrdersAnalytics);

export default analyticsRoute;
