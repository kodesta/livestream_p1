const express = require('express');
const bcrypt = require('bcrypt');
const prisma = require('../lib/db');

const router = express.Router();

// Signup
router.post('/signup', async (req, res) => {
  const { email, password, display_name } = req.body;

  // Validation
  if (!email || typeof email !== 'string' || !password || typeof password !== 'string') {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const cleanEmail = email.trim().toLowerCase();
  if (!cleanEmail.includes('@') || password.length < 8) {
    return res.status(400).json({ error: 'Please provide a valid email and a password of at least 8 characters' });
  }

  try {
    // Check if email already exists
    const existing = await prisma.users.findUnique({ where: { email: cleanEmail } });
    if (existing) {
      return res.status(409).json({ error: 'Email is already registered' });
    }

    // Hash password
    const password_hash = await bcrypt.hash(password, 10);

    // Create user in database
    const user = await prisma.users.create({
      data: {
        email: cleanEmail,
        password_hash,
        display_name: display_name ? display_name.trim() : null
      }
    });

    return res.status(201).json({
      message: 'Account created successfully',
      user: {
        user_id: user.user_id,
        email: user.email,
        display_name: user.display_name,
        created_at: user.created_at
      }
    });

  } catch (error) {
    console.error('Sign up error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const cleanEmail = email.trim().toLowerCase();

  try {
    const user = await prisma.users.findUnique({ where: { email: cleanEmail } });
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    return res.status(200).json({
      message: 'Login successful',
      user: {
        user_id: user.user_id,
        email: user.email,
        display_name: user.display_name,
        created_at: user.created_at
      }
    });

  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;