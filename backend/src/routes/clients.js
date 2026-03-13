import express from 'express';
import { query } from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Get all clients
router.get('/', authenticateToken, async (req, res, next) => {
  try {
    const result = await query('SELECT id, name FROM clients ORDER BY name');
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});

// Get sales reps for a client
router.get('/:client_id/sales-reps', authenticateToken, async (req, res, next) => {
  try {
    const { client_id } = req.params;
    const result = await query(
      'SELECT id, name, whatsapp, active FROM sales_reps WHERE client_id = $1 AND active = true ORDER BY name',
      [client_id]
    );
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});

export default router;
