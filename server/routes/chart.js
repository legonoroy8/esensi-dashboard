import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import pool from '../db.js';

const router = express.Router();

// Protect all chart routes
router.use(requireAuth);

// GET /api/chart/leads-over-time - Get leads data for chart
router.get('/leads-over-time', async (req, res) => {
  try {
    const { start_date, end_date, client_id } = req.query;
    
    // TODO: Implement chart query in Phase 2
    res.json({
      labels: [],
      data: []
    });
  } catch (error) {
    console.error('Error fetching chart data:', error);
    res.status(500).json({ error: 'Failed to fetch chart data' });
  }
});

export default router;
