import express from 'express';
import { getAnalytics } from '../controllers/analyticsController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authenticateToken, getAnalytics);

export default router;
