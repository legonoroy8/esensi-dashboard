import { query } from '../config/database.js';

export const exportCSV = async (req, res, next) => {
  try {
    const { client_id, sales_rep_id, start_date, end_date } = req.query;

    if (!client_id) {
      return res.status(400).json({ error: 'client_id is required' });
    }

    // Build WHERE clause (same as leads controller)
    let whereClause = `l.client_id = $1 AND l.created_at >= $2 AND l.created_at <= $3`;
    let params = [client_id, start_date || '1970-01-01', end_date || '2099-12-31'];

    if (sales_rep_id) {
      whereClause += ` AND l.claimed_by = $4`;
      params.push(sales_rep_id);
    }

    // Query all matching leads (no pagination for export)
    const dataQuery = `
      SELECT 
        l.id,
        l.name,
        l.whatsapp,
        l.source,
        l.status,
        l.created_at,
        l.qualified_at,
        sr.name as claimed_by_name,
        l.claimed_at,
        EXTRACT(EPOCH FROM (l.claimed_at - l.qualified_at)) as claim_duration_seconds
      FROM leads l
      LEFT JOIN sales_reps sr ON l.claimed_by = sr.id
      WHERE ${whereClause}
      ORDER BY l.created_at DESC
    `;

    const result = await query(dataQuery, params);

    // Generate CSV
    const csv = generateCSV(result.rows);

    // Set response headers
    const filename = `leads-export-${new Date().toISOString().split('T')[0]}.csv`;
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csv);
  } catch (error) {
    next(error);
  }
};

function generateCSV(rows) {
  const headers = [
    'Lead ID',
    'Name',
    'WhatsApp',
    'Source',
    'Status',
    'Created',
    'Qualified',
    'Claimed By',
    'Claim Time',
    'Duration to Claim'
  ];

  const csvRows = [headers.join(',')];

  for (const row of rows) {
    const values = [
      escapeCSV(row.id),
      escapeCSV(row.name || ''),
      escapeCSV(row.whatsapp),
      escapeCSV(row.source),
      escapeCSV(row.status),
      escapeCSV(formatDate(row.created_at)),
      escapeCSV(formatDate(row.qualified_at)),
      escapeCSV(row.claimed_by_name || ''),
      escapeCSV(formatDate(row.claimed_at)),
      escapeCSV(row.claim_duration_seconds ? formatDuration(row.claim_duration_seconds) : '')
    ];
    csvRows.push(values.join(','));
  }

  return csvRows.join('\n');
}

function escapeCSV(value) {
  if (value === null || value === undefined) return '';
  const stringValue = String(value);
  if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
}

function formatDate(date) {
  if (!date) return '';
  return new Date(date).toISOString().replace('T', ' ').substring(0, 19);
}

function formatDuration(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}
