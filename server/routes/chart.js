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
    
    // Default to last 30 days if not specified
    const startDate = start_date || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const endDate = end_date || new Date().toISOString();

    const query = `
      SELECT
        DATE(created_at) as date,
        COUNT(*) as lead_count
      FROM public.leads
      WHERE created_at >= $1
        AND created_at < $2
        AND ($3::uuid IS NULL OR client_id = $3)
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `;

    const result = await pool.query(query, [startDate, endDate, client_id || null]);

    // Transform for Chart.js format
    const labels = result.rows.map(row => {
      const date = new Date(row.date);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    });
    
    const data = result.rows.map(row => parseInt(row.lead_count));

    res.json({
      labels,
      data,
      raw: result.rows // Include raw data for additional processing if needed
    });
  } catch (error) {
    console.error('Error fetching chart data:', error);
    res.status(500).json({ 
      error: 'Failed to fetch chart data',
      message: error.message 
    });
  }
});

export default router;
