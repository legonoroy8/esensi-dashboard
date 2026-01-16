import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import pool from '../db.js';
import ExcelJS from 'exceljs';

const router = express.Router();

// Protect all export routes
router.use(requireAuth);

// Helper function to build query with filters
function buildExportQuery(filters) {
  const { client_id, sales_rep_id, start_date, end_date, search } = filters;
  
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

  // Use DISTINCT ON to ensure only one row per lead (handles duplicate lead_events)
  const query = `
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
  `;

  return { query, params };
}

// Helper function to format dates
function formatDate(date) {
  if (!date) return 'N/A';
  return new Date(date).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Jakarta'
  });
}

// GET /api/export/csv - Export leads as CSV
router.get('/csv', async (req, res) => {
  try {
    const { query, params } = buildExportQuery(req.query);
    const result = await pool.query(query, params);

    // Build CSV
    const headers = [
      'ID',
      'Created At',
      'Full Name',
      'WhatsApp',
      'Interest',
      'Client',
      'Sales Rep',
      'AI Report Sent',
      'Sales Rep Replied'
    ];

    let csv = headers.join(',') + '\n';

    result.rows.forEach(lead => {
      const row = [
        lead.id,
        formatDate(lead.created_at),
        `"${lead.full_name}"`,
        lead.whatsapp,
        `"${lead.interest || ''}"`,
        `"${lead.client_name}"`,
        `"${lead.sales_rep_name || 'Unassigned'}"`,
        formatDate(lead.ai_report_sent_at),
        formatDate(lead.sales_rep_replied_at)
      ];
      csv += row.join(',') + '\n';
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=leads-export-${Date.now()}.csv`);
    res.send(csv);
  } catch (error) {
    console.error('Error exporting CSV:', error);
    res.status(500).json({ 
      error: 'Failed to export CSV',
      message: error.message 
    });
  }
});

// GET /api/export/excel - Export leads as Excel
router.get('/excel', async (req, res) => {
  try {
    const { query, params } = buildExportQuery(req.query);
    const result = await pool.query(query, params);

    // Create workbook and worksheet
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Leads');

    // Define columns
    worksheet.columns = [
      { header: 'ID', key: 'id', width: 20 },
      { header: 'Created At', key: 'created_at', width: 20 },
      { header: 'Full Name', key: 'full_name', width: 25 },
      { header: 'WhatsApp', key: 'whatsapp', width: 20 },
      { header: 'Interest', key: 'interest', width: 30 },
      { header: 'Client', key: 'client_name', width: 25 },
      { header: 'Sales Rep', key: 'sales_rep_name', width: 25 },
      { header: 'AI Report Sent', key: 'ai_report_sent_at', width: 20 },
      { header: 'Sales Rep Replied', key: 'sales_rep_replied_at', width: 20 }
    ];

    // Style header row
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };

    // Add data
    result.rows.forEach(lead => {
      worksheet.addRow({
        id: lead.id,
        created_at: formatDate(lead.created_at),
        full_name: lead.full_name,
        whatsapp: lead.whatsapp,
        interest: lead.interest || '',
        client_name: lead.client_name,
        sales_rep_name: lead.sales_rep_name || 'Unassigned',
        ai_report_sent_at: formatDate(lead.ai_report_sent_at),
        sales_rep_replied_at: formatDate(lead.sales_rep_replied_at)
      });
    });

    // Set response headers
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=leads-export-${Date.now()}.xlsx`);

    // Write to response
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('Error exporting Excel:', error);
    res.status(500).json({ 
      error: 'Failed to export Excel',
      message: error.message 
    });
  }
});

export default router;
