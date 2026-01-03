import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import pool from '../db.js';

const router = express.Router();

// Protect all filter routes
router.use(requireAuth);

// GET /api/filters/clients - Get list of all clients
router.get('/clients', async (req, res) => {
  try {
    const query = `
      SELECT id, name
      FROM public.clients
      ORDER BY name ASC
    `;
    
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching clients:', error);
    res.status(500).json({ 
      error: 'Failed to fetch clients',
      message: error.message 
    });
  }
});

// GET /api/filters/sales-reps - Get list of all sales reps
router.get('/sales-reps', async (req, res) => {
  try {
    const query = `
      SELECT id, name
      FROM public.sales_reps
      ORDER BY name ASC
    `;
    
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching sales reps:', error);
    res.status(500).json({ 
      error: 'Failed to fetch sales reps',
      message: error.message 
    });
  }
});

export default router;
