import { query } from '../config/database.js';

export const getAnalytics = async (req, res, next) => {
  try {
    const { client_id, sales_rep_id, status, source, start_date, end_date } = req.query;

    // Build dynamic WHERE clause based on provided filters
    // Support for multi-tenant: if client_id provided, filter by it; otherwise show all
    const whereClauses = [];
    const params = [];
    let paramIndex = 1;

    // Date range filter (always applied)
    whereClauses.push(`created_at >= $${paramIndex}`);
    params.push(start_date || '1970-01-01');
    paramIndex++;

    whereClauses.push(`created_at <= $${paramIndex}`);
    params.push(end_date || '2099-12-31');
    paramIndex++;

    // Optional client filter (for multi-tenant support)
    if (client_id) {
      whereClauses.push(`client_id = $${paramIndex}`);
      params.push(client_id);
      paramIndex++;
    }

    // Optional sales rep filter
    if (sales_rep_id) {
      whereClauses.push(`claimed_by = $${paramIndex}`);
      params.push(sales_rep_id);
      paramIndex++;
    }

    // Optional status filter
    if (status) {
      whereClauses.push(`status = $${paramIndex}`);
      params.push(status);
      paramIndex++;
    }

    // Optional source filter
    if (source) {
      whereClauses.push(`source = $${paramIndex}`);
      params.push(source);
      paramIndex++;
    }

    const whereClause = whereClauses.length > 0
      ? whereClauses.join(' AND ')
      : '1=1';

    // Qualified leads count
    const qualifiedQuery = `
      SELECT COUNT(*) as count FROM leads 
      WHERE status IN ('qualified_unclaimed', 'claimed')
      AND ${whereClause}
    `;
    const qualifiedResult = await query(qualifiedQuery, params);

    // Cold call leads count
    const coldCallQuery = `
      SELECT COUNT(*) as count FROM leads 
      WHERE status = 'cold_call'
      AND ${whereClause}
    `;
    const coldCallResult = await query(coldCallQuery, params);

    // Total leads count
    const totalQuery = `SELECT COUNT(*) as count FROM leads WHERE ${whereClause}`;
    const totalResult = await query(totalQuery, params);

    // Leads by source
    const sourceQuery = `
      SELECT source, COUNT(*) as count 
      FROM leads 
      WHERE ${whereClause}
      GROUP BY source
    `;
    const sourceResult = await query(sourceQuery, params);
    const leadsBySource = sourceResult.rows.reduce((acc, row) => {
      acc[row.source] = parseInt(row.count);
      return acc;
    }, {});

    // Average claim time
    const avgClaimQuery = `
      SELECT AVG(EXTRACT(EPOCH FROM (claimed_at - qualified_at))) as avg_seconds
      FROM leads 
      WHERE claimed_at IS NOT NULL 
      AND ${whereClause}
    `;
    const avgClaimResult = await query(avgClaimQuery, params);
    const avgSeconds = parseFloat(avgClaimResult.rows[0].avg_seconds) || 0;
    const avgClaimTimeMinutes = avgSeconds / 60; // Convert to minutes

    // Slow claims count (>30 minutes)
    const slowClaimQuery = `
      SELECT COUNT(*) as count FROM leads 
      WHERE claimed_at - qualified_at > interval '30 minutes'
      AND ${whereClause}
    `;
    const slowClaimResult = await query(slowClaimQuery, params);

    res.json({
      qualifiedLeads: parseInt(qualifiedResult.rows[0].count),
      coldCalls: parseInt(coldCallResult.rows[0].count),
      totalLeads: parseInt(totalResult.rows[0].count),
      leadsBySource,
      avgClaimTimeMinutes,
      slowClaims: parseInt(slowClaimResult.rows[0].count)
    });
  } catch (error) {
    next(error);
  }
};

// Helper function to format duration
function formatDuration(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}
