import { Router } from 'express';
import { authenticate, AuthRequest, authorize } from '../middleware/auth';
import { pool } from '../db/init';

const router = Router();

router.get('/settings', authenticate, async (req: AuthRequest, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM agencies WHERE id = $1',
      [req.user!.agencyId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Agency not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch agency settings' });
  }
});

router.put('/settings', authenticate, authorize(['Owner']), async (req: AuthRequest, res) => {
  try {
    const updates = req.body;

    // Build dynamic update query
    const updateFields = Object.keys(updates).filter(key => key !== 'id');
    const setClause = updateFields.map((field, index) => `${field} = $${index + 2}`).join(', ');
    const values = [req.user!.agencyId, ...updateFields.map(field => updates[field])];

    const result = await pool.query(
      `UPDATE agencies SET ${setClause} WHERE id = $1 RETURNING *`,
      values
    );

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update agency settings' });
  }
});

export default router;