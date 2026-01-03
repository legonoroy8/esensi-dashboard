import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import pool from '../db.js';

const router = express.Router();

// Protect all KPI routes
router.use(requireAuth);

// GET /api/kpi/summary - Get summary KPIs
router.get('/summary', async (req, res) => {
  try {
    const { client_id, sales_rep_id, start_date, end_date } = req.query;

    // Build WHERE conditions for leads table
    const conditions = [];
    const params = [];
    let paramIndex = 1;

    if (client_id) {
      conditions.push(`l.client_id::text = $${paramIndex}`);
      params.push(client_id);
      paramIndex++;
    }

    if (sales_rep_id) {
      conditions.push(`l.sales_rep_id::text = $${paramIndex}`);
      params.push(sales_rep_id);
      paramIndex++;
    }

    if (start_date) {
      conditions.push(`l.created_at >= $${paramIndex}`);
      params.push(start_date);
      paramIndex++;
    }

    if (end_date) {
      conditions.push(`l.created_at < $${paramIndex}`);
      params.push(end_date);
      paramIndex++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // 1. Total leads
    const totalLeadsQuery = `
      SELECT COUNT(*) as total
      FROM public.leads l
      ${whereClause}
    `;
    const totalResult = await pool.query(totalLeadsQuery, params);
    const totalLeads = parseInt(totalResult.rows[0].total);

    // 2. Average response time (in minutes)
    // Calculate: sales_rep_replied_at - ai_report_sent_at
    const avgResponseTimeQuery = `
      SELECT 
        AVG(
          EXTRACT(EPOCH FROM (le.sales_rep_replied_at - le.ai_report_sent_at)) / 60
        ) as avg_minutes
      FROM public.lead_events le
      INNER JOIN public.leads l ON l.id = le.lead_id
      WHERE le.ai_report_sent_at IS NOT NULL
        AND le.sales_rep_replied_at IS NOT NULL
        ${conditions.length > 0 ? 'AND ' + conditions.join(' AND ') : ''}
    `;
    const avgResponseResult = await pool.query(avgResponseTimeQuery, params);
    const avgResponseMinutes = avgResponseResult.rows[0].avg_minutes 
      ? parseFloat(avgResponseResult.rows[0].avg_minutes).toFixed(2)
      : null;

    // 3. Count of response times > 1 hour
    const slowResponseQuery = `
      SELECT COUNT(*) as count
      FROM public.lead_events le
      INNER JOIN public.leads l ON l.id = le.lead_id
      WHERE le.ai_report_sent_at IS NOT NULL
        AND le.sales_rep_replied_at IS NOT NULL
        AND (le.sales_rep_replied_at - le.ai_report_sent_at) > INTERVAL '1 hour'
        ${conditions.length > 0 ? 'AND ' + conditions.join(' AND ') : ''}
    `;
    const slowResponseResult = await pool.query(slowResponseQuery, params);
    const slowResponseCount = parseInt(slowResponseResult.rows[0].count);

    res.json({
      totalLeads,
      avgResponseMinutes,
      slowResponseCount
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
        AND ($3::text IS NULL OR l.client_id::text = $3::text)
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
        AND ($3::text IS NULL OR l.client_id::text = $3::text)
        AND ($4::text IS NULL OR l.sales_rep_id::text = $4::text)
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
