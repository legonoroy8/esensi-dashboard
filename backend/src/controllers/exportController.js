import { query } from '../config/database.js';

export const exportCSV = async (req, res, next) => {
  try {
    const { client_id, sales_rep_id, status, source, start_date, end_date } = req.query;

    // Build dynamic WHERE clause (same pattern as leads/analytics)
    const whereClauses = [];
    const params = [];
    let paramIndex = 1;

    // Date range filter
    whereClauses.push(`l.created_at >= $${paramIndex}`);
    params.push(start_date || '1970-01-01');
    paramIndex++;

    whereClauses.push(`l.created_at <= $${paramIndex}`);
    params.push(end_date || '2099-12-31');
    paramIndex++;

    // Optional client filter
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

    // Optional status filter
    if (status) {
      whereClauses.push(`l.status = $${paramIndex}`);
      params.push(status);
      paramIndex++;
    }

    // Optional source filter
    if (source) {
      whereClauses.push(`l.source = $${paramIndex}`);
      params.push(source);
      paramIndex++;
    }

    const whereClause = whereClauses.length > 0
      ? whereClauses.join(' AND ')
      : '1=1';

    // Query all matching leads (no pagination for export)
    const dataQuery = `
      SELECT 
        l.id,
        l.name,
        l.whatsapp,
        l.source,
        l.first_msg,
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
    'First Message',
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
      escapeCSV(row.first_msg || ''),
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

// Export cold call list
export const exportColdCallList = async (req, res, next) => {
  try {
    const { client_id, start_date, end_date } = req.query;

    // Build WHERE clause for cold call list
    const whereClauses = ['l.status = $1']; // Always filter by cold_call status
    const params = ['cold_call'];
    let paramIndex = 2;

    // Date range filter
    whereClauses.push(`l.created_at >= $${paramIndex}`);
    params.push(start_date || '1970-01-01');
    paramIndex++;

    whereClauses.push(`l.created_at <= $${paramIndex}`);
    params.push(end_date || '2099-12-31');
    paramIndex++;

    // Optional client filter
    if (client_id) {
      whereClauses.push(`l.client_id = $${paramIndex}`);
      params.push(client_id);
      paramIndex++;
    }

    const whereClause = whereClauses.join(' AND ');

    // Query cold call leads
    const dataQuery = `
      SELECT 
        l.name,
        l.whatsapp,
        l.source,
        l.interest,
        l.status,
        TO_CHAR((l.created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Jakarta'), 'YYYY-MM-DD HH24:MI:SS') as created_at_jakarta,
        c.name as client_name
      FROM leads l
      LEFT JOIN clients c ON l.client_id = c.id
      WHERE ${whereClause}
      ORDER BY l.created_at DESC
    `;

    const result = await query(dataQuery, params);

    // Generate CSV for cold call list
    const csv = generateColdCallCSV(result.rows);

    // Set response headers
    const filename = `cold-call-list-${new Date().toISOString().split('T')[0]}.csv`;
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csv);
  } catch (error) {
    next(error);
  }
};

function generateColdCallCSV(rows) {
  const headers = [
    'Name',
    'WhatsApp',
    'Source',
    'Interest',
    'Status',
    'Created At (Asia/Jakarta)',
    'Client'
  ];

  const csvRows = [headers.join(',')];

  for (const row of rows) {
    const values = [
      escapeCSV(row.name || ''),
      escapeCSV(row.whatsapp),
      escapeCSV(row.source),
      escapeCSV(row.interest || ''),
      escapeCSV(row.status),
      escapeCSV(formatDateJakarta(row.created_at_jakarta)),
      escapeCSV(row.client_name || '')
    ];
    csvRows.push(values.join(','));
  }

  return csvRows.join('\n');
}

function formatDateJakarta(date) {
  if (!date) return '';
  // Date is already formatted as a string in Jakarta timezone from SQL query
  return date;
}
