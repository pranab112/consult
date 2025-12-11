import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import { pool } from '../db/init';
import { logger } from '../utils/logger';

const router = Router();

// Register new agency and owner
router.post('/register',
  [
    body('name').notEmpty().trim(),
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 }),
    body('agencyName').notEmpty().trim()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { name, email, password, agencyName } = req.body;

      // Start transaction
      const client = await pool.connect();
      try {
        await client.query('BEGIN');

        // Check if email exists
        const existingUser = await client.query(
          'SELECT id FROM users WHERE email = $1',
          [email]
        );

        if (existingUser.rows.length > 0) {
          await client.query('ROLLBACK');
          return res.status(400).json({ error: 'Email already registered' });
        }

        // Create agency
        const agencyResult = await client.query(
          'INSERT INTO agencies (name, email) VALUES ($1, $2) RETURNING id',
          [agencyName, email]
        );

        const agencyId = agencyResult.rows[0].id;

        // Hash password
        const passwordHash = await bcrypt.hash(password, 10);

        // Create owner user
        const userResult = await client.query(
          `INSERT INTO users (agency_id, email, password_hash, name, role)
           VALUES ($1, $2, $3, $4, 'Owner') RETURNING id, email, name, role`,
          [agencyId, email, passwordHash, name]
        );

        await client.query('COMMIT');

        const user = userResult.rows[0];

        // Generate JWT
        const token = jwt.sign(
          { userId: user.id, email: user.email, role: user.role, agencyId },
          process.env.JWT_SECRET!,
          { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
        );

        res.status(201).json({
          token,
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            agencyId
          }
        });
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    } catch (error) {
      logger.error('Registration error:', error);
      res.status(500).json({ error: 'Registration failed' });
    }
  }
);

// Login
router.post('/login',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, password } = req.body;

      // Get user with password
      const result = await pool.query(
        `SELECT u.id, u.email, u.password_hash, u.name, u.role, u.agency_id, u.is_active
         FROM users u
         WHERE u.email = $1`,
        [email]
      );

      if (result.rows.length === 0) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const user = result.rows[0];

      if (!user.is_active) {
        return res.status(403).json({ error: 'Account deactivated' });
      }

      // Verify password
      const validPassword = await bcrypt.compare(password, user.password_hash);
      if (!validPassword) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Generate JWT
      const token = jwt.sign(
        { userId: user.id, email: user.email, role: user.role, agencyId: user.agency_id },
        process.env.JWT_SECRET!,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
      );

      res.json({
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          agencyId: user.agency_id
        }
      });
    } catch (error) {
      logger.error('Login error:', error);
      res.status(500).json({ error: 'Login failed' });
    }
  }
);

export default router;