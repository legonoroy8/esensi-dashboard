import { query } from '../config/database.js';

export const getAnalytics = async (req, res, next) => {
  try {
    const { client_id, sales_rep_id, start_date, end_date } = req.query;

    if (!client_id) {
      return res.status(400).json({ error: 'client_id is required' });
    }

    const baseWhere = `
      client_id = $1 
      AND created_at >= $2 
      AND created_at <= $3
    `;
    const baseParams = [
      client_id,
      start_date || '1970-01-01',
      end_date || '2099-12-31'
    ];

    // If sales_rep_id filter is provided, add it
    const whereClause = sales_rep_id 
      ? `${baseWhere} AND claimed_by = $4`
      : baseWhere;
    const params = sales_rep_id 
      ? [...baseParams, sales_rep_id]
      : baseParams;

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
    const avgSeconds = avgClaimResult.rows[0].avg_seconds || 0;
    const avgClaimTime = formatDuration(avgSeconds);

    // Slow claims count (>30 minutes)
    const slowClaimQuery = `
      SELECT COUNT(*) as count FROM leads 
      WHERE claimed_at - qualified_at > interval '30 minutes'
      AND ${whereClause}
    `;
    const slowClaimResult = await query(slowClaimQuery, params);

    res.json({
      qualifiedLeads: parseInt(qualifiedResult.rows[0].count),
      coldCallLeads: parseInt(coldCallResult.rows[0].count),
      totalLeads: parseInt(totalResult.rows[0].count),
      leadsBySource,
      avgClaimTime,
      slowClaimCount: parseInt(slowClaimResult.rows[0].count)
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
