import { Router } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { pool } from '../db/init';

const router = Router();

router.get('/student/:studentId', authenticate, async (req: AuthRequest, res) => {
  try {
    const { studentId } = req.params;

    // Verify student belongs to agency
    const studentCheck = await pool.query(
      'SELECT id FROM students WHERE id = $1 AND agency_id = $2',
      [studentId, req.user!.agencyId]
    );

    if (studentCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Student not found' });
    }

    const result = await pool.query(
      'SELECT * FROM documents WHERE student_id = $1 ORDER BY created_at DESC',
      [studentId]
    );

    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch documents' });
  }
});

export default router;