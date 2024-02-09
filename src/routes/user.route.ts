import express from 'express';
import {
  activateUser,
  getUserInfo,
  loginUser,
  logoutUser,
  registrationUser,
  socialAuth,
  updateAccessToken,
  updatePassword,
  updateProfilepicture,
  updateUserInfo,
} from '../controller/user.controller';
import { isAuthenticated, authorizeRoles } from '../middleware/auth';

const router = express.Router();

router.post('/registration', registrationUser);

router.post('/activate', activateUser);

router.post('/login', loginUser);

router.get('/logout', isAuthenticated, logoutUser);

router.get('/refreshtoken', updateAccessToken);

router.get('/me', isAuthenticated, getUserInfo);

router.post('/social-auth', socialAuth);

router.put('/update-user-info', isAuthenticated, updateUserInfo);

router.put('/update-user-password', isAuthenticated, updatePassword);

router.put('/update-user-avatar', isAuthenticated, updateProfilepicture);

export default router;
