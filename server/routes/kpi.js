import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import pool from '../db.js';

const router = express.Router();

// Protect all KPI routes
router.use(requireAuth);

// GET /api/kpi/summary - Get summary KPIs
router.get('/summary', async (req, res) => {
  try {
    // TODO: Implement KPI queries in Phase 2
    res.json({
      totalLeads: 0,
      leads7Days: 0,
      leads30Days: 0,
      qualifiedRatio: 0
    });
  } catch (error) {
    console.error('Error fetching KPI summary:', error);
    res.status(500).json({ error: 'Failed to fetch KPI summary' });
  }
});

export default router;
