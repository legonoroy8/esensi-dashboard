import express from 'express';
import { exportCSV } from '../controllers/exportController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.get('/csv', authenticateToken, exportCSV);

export default router;
