import express from 'express';
import { getLeads } from '../controllers/leadsController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authenticateToken, getLeads);

export default router;
