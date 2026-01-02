import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import pool from '../db.js';

const router = express.Router();

// Protect all table routes
router.use(requireAuth);

// GET /api/table/recent-leads - Get paginated recent leads
router.get('/recent-leads', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.page_size) || 20;
    const offset = (page - 1) * pageSize;
    
    // TODO: Implement table query with pagination in Phase 2
    res.json({
      leads: [],
      pagination: {
        page,
        pageSize,
        total: 0,
        totalPages: 0
      }
    });
  } catch (error) {
    console.error('Error fetching recent leads:', error);
    res.status(500).json({ error: 'Failed to fetch recent leads' });
  }
});

export default router;
