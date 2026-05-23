import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import pg from 'pg';
import authenticate from '../middleware/authenticate.js';
import {
  toAuthUser,
  toProfileUser
} from '../utils/response-mappers.js';

const router = express.Router();
const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL
});

// SIGNUP ROUTE
router.post('/signup', async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const hash = await bcrypt.hash(password, 10);
    const verificationToken = crypto.randomBytes(32).toString('hex');

    // Broken signup — returns entire row including password hash and Stripe ID
    const result = await pool.query(
      `INSERT INTO users (name, email, password_hash, verification_token)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [name, email, hash, verificationToken]
    );

    res.status(201).json({
      user: toAuthUser(result.rows[0])
    });
  } catch (err) {
    console.error(err);
    if (err.code === '23505') {
      return res.status(400).json({ error: 'Email already exists' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// LOGIN ROUTE
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Missing email or password' });
  }

  try {
    // Broken login — SELECT * including sensitive metadata
    const result = await pool.query(
  `SELECT id, name, email, role, password_hash, subscription_plan
   FROM users
   WHERE email = $1`,
  [email]
);
    const user = result.rows[0];

    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Broken token — packs far too much sensitive data into JWT claims
    const token = jwt.sign({
  userId: user.id,
  role: user.role
}, process.env.JWT_SECRET, {
  expiresIn: '7d'
})

    // Also returns full user object in body
    res.json({
  token,
  user: toAuthUser(user)
});
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET ME ROUTE
router.get('/me', authenticate, async (req, res) => {
  try {
    // Broken profile — SELECT * returns salary, tokens, and internals
    const result = await pool.query(
      'SELECT id, name, email, role, password_hash FROM users WHERE id = $1',
      [req.user.userId]
    );
    res.json({
  user: toProfileUser(result.rows[0])
});
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
