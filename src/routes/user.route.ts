import express from 'express';
import {
  activateUser,
  getAllUsers,
  getUserInfo,
  loginUser,
  logoutUser,
  registrationUser,
  socialAuth,
  updateAccessToken,
  updatePassword,
  updateProfilepicture,
  updateUserInfo,
  updateUserRole,
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

router.get('/get-all', isAuthenticated, authorizeRoles('admin'), getAllUsers);

router.put('/update-role', isAuthenticated, authorizeRoles('admin'), updateUserRole);

export default router;
