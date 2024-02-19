import express from 'express';
import { authorizeRoles, isAuthenticated } from '../middleware/auth';
import { getNotifications, updateNotification } from '../controller/notification.controller';

const notiRoute = express.Router();

notiRoute.get('/get-all', isAuthenticated, authorizeRoles('admin'), getNotifications);
notiRoute.put('/update-status/:id', isAuthenticated, authorizeRoles('admin'), updateNotification);

export default notiRoute;
