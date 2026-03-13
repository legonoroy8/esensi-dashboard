import express from 'express';
import { exportCSV, exportColdCallList } from '../controllers/exportController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.get('/csv', authenticateToken, exportCSV);
router.get('/cold-call-list', authenticateToken, exportColdCallList);

export default router;
