import { query } from '../config/database.js';

export const getLeads = async (req, res, next) => {
  try {
    const { 
      client_id, 
      sales_rep_id, 
      start_date, 
      end_date,
      page = 1,
      limit = 50
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);

    // Build dynamic WHERE clause based on provided filters
    // Support for multi-tenant: if client_id provided, filter by it; otherwise show all
    const whereClauses = [];
    const params = [];
    let paramIndex = 1;

    // Date range filter (always applied)
    whereClauses.push(`l.created_at >= $${paramIndex}`);
    params.push(start_date || '1970-01-01');
    paramIndex++;

    whereClauses.push(`l.created_at <= $${paramIndex}`);
    params.push(end_date || '2099-12-31');
    paramIndex++;

    // Optional client filter (for multi-tenant support)
    if (client_id) {
      whereClauses.push(`l.client_id = $${paramIndex}`);
      params.push(client_id);
      paramIndex++;
    }

    // Optional sales rep filter
    if (sales_rep_id) {
      whereClauses.push(`l.claimed_by = $${paramIndex}`);
      params.push(sales_rep_id);
      paramIndex++;
    }

    const whereClause = whereClauses.length > 0 
      ? whereClauses.join(' AND ')
      : '1=1';

    // Get total count
    const countQuery = `SELECT COUNT(*) as total FROM leads l WHERE ${whereClause}`;
    const countResult = await query(countQuery, params);
    const total = parseInt(countResult.rows[0].total);

    // Get paginated data
    const dataQuery = `
      SELECT 
        l.id,
        l.whatsapp,
        l.name,
        l.interest,
        l.status,
        l.source,
        l.created_at,
        l.qualified_at,
        l.claimed_at,
        c.name as client_name,
        EXTRACT(EPOCH FROM (l.claimed_at - l.qualified_at)) as claim_duration_seconds,
        sr.id as sales_rep_id,
        sr.name as sales_rep_name,
        sr.whatsapp as sales_rep_whatsapp
      FROM leads l
      LEFT JOIN clients c ON l.client_id = c.id
      LEFT JOIN sales_reps sr ON l.claimed_by = sr.id
      WHERE ${whereClause}
      ORDER BY l.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    params.push(parseInt(limit), offset);

    const dataResult = await query(dataQuery, params);

    const leads = dataResult.rows.map(row => ({
      id: row.id,
      whatsapp: row.whatsapp,
      name: row.name,
      interest: row.interest,
      status: row.status,
      source: row.source,
      created_at: row.created_at,
      qualified_at: row.qualified_at,
      claimed_at: row.claimed_at,
      client_name: row.client_name,
      claimed_by: row.sales_rep_name || null,
      sales_rep: row.sales_rep_id ? {
        id: row.sales_rep_id,
        name: row.sales_rep_name,
        whatsapp: row.sales_rep_whatsapp
      } : null,
      claim_duration: row.claim_duration_seconds 
        ? formatDuration(row.claim_duration_seconds)
        : null
    }));

    const pages = Math.ceil(total / parseInt(limit));

    res.json({
      leads,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: pages
      }
    });
  } catch (error) {
    next(error);
  }
};

function formatDuration(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}
