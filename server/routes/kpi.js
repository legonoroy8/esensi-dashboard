import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import pool from '../db.js';

const router = express.Router();

// Protect all KPI routes
router.use(requireAuth);

// GET /api/kpi/summary - Get summary KPIs
router.get('/summary', async (req, res) => {
  try {
    const { client_id } = req.query;

    // Total leads (all time)
    const totalLeadsQuery = `
      SELECT COUNT(*) as total
      FROM public.leads
      WHERE ($1::uuid IS NULL OR client_id = $1)
    `;
    const totalResult = await pool.query(totalLeadsQuery, [client_id || null]);
    const totalLeads = parseInt(totalResult.rows[0].total);

    // Leads last 7 days
    const leads7DaysQuery = `
      SELECT COUNT(*) as total
      FROM public.leads
      WHERE created_at >= NOW() - INTERVAL '7 days'
        AND ($1::uuid IS NULL OR client_id = $1)
    `;
    const leads7Result = await pool.query(leads7DaysQuery, [client_id || null]);
    const leads7Days = parseInt(leads7Result.rows[0].total);

    // Leads last 30 days
    const leads30DaysQuery = `
      SELECT COUNT(*) as total
      FROM public.leads
      WHERE created_at >= NOW() - INTERVAL '30 days'
        AND ($1::uuid IS NULL OR client_id = $1)
    `;
    const leads30Result = await pool.query(leads30DaysQuery, [client_id || null]);
    const leads30Days = parseInt(leads30Result.rows[0].total);

    // Qualified vs unqualified ratio (if qualification field exists)
    // For now, return 0 as spec says it may not be implemented yet
    const qualifiedRatio = 0;

    res.json({
      totalLeads,
      leads7Days,
      leads30Days,
      qualifiedRatio
    });
  } catch (error) {
    console.error('Error fetching KPI summary:', error);
    res.status(500).json({ 
      error: 'Failed to fetch KPI summary',
      message: error.message 
    });
  }
});

// GET /api/kpi/leads-per-client - Leads grouped by client
router.get('/leads-per-client', async (req, res) => {
  try {
    const { start_date, end_date, client_id } = req.query;
    
    const startDate = start_date || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const endDate = end_date || new Date().toISOString();

    const query = `
      SELECT
        c.id AS client_id,
        c.name AS client_name,
        COUNT(l.id) AS lead_count
      FROM public.leads l
      JOIN public.clients c ON c.id = l.client_id
      WHERE l.created_at >= $1
        AND l.created_at < $2
        AND ($3::uuid IS NULL OR l.client_id = $3)
      GROUP BY c.id, c.name
      ORDER BY lead_count DESC
    `;

    const result = await pool.query(query, [startDate, endDate, client_id || null]);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching leads per client:', error);
    res.status(500).json({ 
      error: 'Failed to fetch leads per client',
      message: error.message 
    });
  }
});

// GET /api/kpi/leads-per-sales-rep - Leads grouped by sales rep
router.get('/leads-per-sales-rep', async (req, res) => {
  try {
    const { start_date, end_date, client_id, sales_rep_id } = req.query;
    
    const startDate = start_date || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const endDate = end_date || new Date().toISOString();

    const query = `
      SELECT
        c.id AS client_id,
        c.name AS client_name,
        sr.id AS sales_rep_id,
        sr.name AS sales_rep_name,
        COUNT(l.id) AS lead_count
      FROM public.leads l
      JOIN public.clients c ON c.id = l.client_id
      LEFT JOIN public.sales_reps sr ON sr.id = l.sales_rep_id
      WHERE l.created_at >= $1
        AND l.created_at < $2
        AND ($3::uuid IS NULL OR l.client_id = $3)
        AND ($4::uuid IS NULL OR l.sales_rep_id = $4)
      GROUP BY c.id, c.name, sr.id, sr.name
      ORDER BY c.name, lead_count DESC
    `;

    const result = await pool.query(query, [
      startDate, 
      endDate, 
      client_id || null, 
      sales_rep_id || null
    ]);

    // Transform NULL sales_rep to "Unassigned"
    const transformedRows = result.rows.map(row => ({
      ...row,
      sales_rep_name: row.sales_rep_name || 'Unassigned'
    }));

    res.json(transformedRows);
  } catch (error) {
    console.error('Error fetching leads per sales rep:', error);
    res.status(500).json({ 
      error: 'Failed to fetch leads per sales rep',
      message: error.message 
    });
  }
});

export default router;
