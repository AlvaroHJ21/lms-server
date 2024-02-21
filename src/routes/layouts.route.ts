import express from 'express';
import { createLayout, editLayout, getLayoutByType } from '../controller/layout.controller';
import { authorizeRoles, isAuthenticated } from '../middleware/auth';

const layoutRouter = express.Router();

layoutRouter.post('/create', isAuthenticated, authorizeRoles('admin'), createLayout);
layoutRouter.put('/edit', isAuthenticated, authorizeRoles('admin'), editLayout);
layoutRouter.get('/get', isAuthenticated, authorizeRoles('admin'), getLayoutByType);

export default layoutRouter;
