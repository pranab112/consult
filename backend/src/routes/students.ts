import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import { pool } from '../db/init';
import { authenticate, AuthRequest } from '../middleware/auth';
import { logger } from '../utils/logger';

const router = Router();

// Get all students for agency
router.get('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const result = await pool.query(
      `SELECT s.*, u.name as counsellor_name
       FROM students s
       LEFT JOIN users u ON s.assigned_counsellor_id = u.id
       WHERE s.agency_id = $1
       ORDER BY s.created_at DESC`,
      [req.user!.agencyId]
    );

    res.json(result.rows);
  } catch (error) {
    logger.error('Get students error:', error);
    res.status(500).json({ error: 'Failed to fetch students' });
  }
});

// Create new student
router.post('/',
  authenticate,
  [
    body('name').notEmpty().trim(),
    body('email').isEmail().normalizeEmail(),
    body('phone').notEmpty().trim()
  ],
  async (req: AuthRequest, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const {
        name, email, phone, address, passportNumber,
        dateOfBirth, educationLevel, englishProficiency,
        preferredCountries, preferredCourses, budgetRange,
        intakeYear, intakeMonth, notes
      } = req.body;

      const result = await pool.query(
        `INSERT INTO students (
          agency_id, name, email, phone, address, passport_number,
          date_of_birth, education_level, english_proficiency,
          preferred_countries, preferred_courses, budget_range,
          intake_year, intake_month, notes, assigned_counsellor_id
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
        RETURNING *`,
        [
          req.user!.agencyId, name, email, phone, address, passportNumber,
          dateOfBirth, educationLevel, englishProficiency,
          preferredCountries, preferredCourses, budgetRange,
          intakeYear, intakeMonth, notes, req.user!.id
        ]
      );

      res.status(201).json(result.rows[0]);
    } catch (error: any) {
      if (error.code === '23505') {
        return res.status(400).json({ error: 'Student with this email already exists' });
      }
      logger.error('Create student error:', error);
      res.status(500).json({ error: 'Failed to create student' });
    }
  }
);

// Update student
router.put('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Build dynamic update query
    const updateFields = Object.keys(updates).filter(key => key !== 'id');
    const setClause = updateFields.map((field, index) => `${field} = $${index + 3}`).join(', ');
    const values = [req.user!.agencyId, id, ...updateFields.map(field => updates[field])];

    const result = await pool.query(
      `UPDATE students
       SET ${setClause}
       WHERE agency_id = $1 AND id = $2
       RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Student not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    logger.error('Update student error:', error);
    res.status(500).json({ error: 'Failed to update student' });
  }
});

// Delete student
router.delete('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'DELETE FROM students WHERE agency_id = $1 AND id = $2 RETURNING id',
      [req.user!.agencyId, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Student not found' });
    }

    res.json({ message: 'Student deleted successfully' });
  } catch (error) {
    logger.error('Delete student error:', error);
    res.status(500).json({ error: 'Failed to delete student' });
  }
});

export default router;