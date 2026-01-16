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
    const { client_id, sales_rep_id, start_date, end_date, search } = req.query;

    // Build WHERE conditions
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

    if (search) {
      conditions.push(`(
        l.full_name ILIKE $${paramIndex} OR
        l.whatsapp ILIKE $${paramIndex} OR
        l.interest ILIKE $${paramIndex} OR
        c.name ILIKE $${paramIndex}
      )`);
      params.push(`%${search}%`);
      paramIndex++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Get total count for pagination
    const countQuery = `
      SELECT COUNT(*) as total
      FROM public.leads l
      JOIN public.clients c ON c.id = l.client_id
      ${whereClause}
    `;
    const countResult = await pool.query(countQuery, params);
    const total = parseInt(countResult.rows[0].total);
    const totalPages = Math.ceil(total / pageSize);

    // Get paginated leads with all required columns including lead_events timestamps
    // Use DISTINCT ON to ensure only one row per lead (handles duplicate lead_events)
    const leadsQuery = `
      SELECT * FROM (
        SELECT DISTINCT ON (l.id)
          l.id,
          l.created_at,
          l.full_name,
          l.whatsapp,
          l.interest,
          c.name AS client_name,
          sr.name AS sales_rep_name,
          le.ai_report_sent_at,
          le.sales_rep_replied_at
        FROM public.leads l
        JOIN public.clients c ON c.id = l.client_id
        LEFT JOIN public.sales_reps sr ON sr.id = l.sales_rep_id
        LEFT JOIN public.lead_events le ON le.lead_id = l.id
        ${whereClause}
        ORDER BY l.id, le.occurred_at DESC NULLS LAST
      ) AS unique_leads
      ORDER BY created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    const leadsResult = await pool.query(leadsQuery, [
      ...params,
      pageSize,
      offset
    ]);

    // Format dates and handle null values
    const leads = leadsResult.rows.map(lead => ({
      id: lead.id,
      created_at: new Date(lead.created_at).toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }),
      full_name: lead.full_name,
      whatsapp: lead.whatsapp,
      interest: lead.interest,
      client_name: lead.client_name,
      sales_rep_name: lead.sales_rep_name || 'Unassigned',
      ai_report_sent_at: lead.ai_report_sent_at 
        ? new Date(lead.ai_report_sent_at).toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })
        : 'N/A',
      sales_rep_replied_at: lead.sales_rep_replied_at
        ? new Date(lead.sales_rep_replied_at).toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })
        : 'N/A'
    }));

    res.json({
      leads,
      pagination: {
        page,
        pageSize,
        total,
        totalPages
      }
    });
  } catch (error) {
    console.error('Error fetching recent leads:', error);
    res.status(500).json({ 
      error: 'Failed to fetch recent leads',
      message: error.message 
    });
  }
});

export default router;
