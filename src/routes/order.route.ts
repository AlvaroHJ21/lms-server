import express from 'express';
import { isAuthenticated } from '../middleware/auth';
import { createOrder } from '../controller/order.controller';

const router = express.Router();

router.post('/create-order', isAuthenticated, createOrder);

export default router;
