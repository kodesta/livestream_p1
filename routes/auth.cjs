const express = require('express');
const bcrypt = require('bcrypt');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const prisma = require('../lib/db');

const router = express.Router();
const USERS_FILE = path.join(__dirname, '..', 'users.json');
const AVATAR_DIR = path.join(__dirname, '..', 'public', 'uploads', 'avatars');

if (!fs.existsSync(AVATAR_DIR)) {
  fs.mkdirSync(AVATAR_DIR, { recursive: true });
}

// Multer Storage for Profile Pictures
const avatarStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, AVATAR_DIR);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname) || '.jpg';
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'avatar-' + uniqueSuffix + ext);
  }
});

const avatarUpload = multer({
  storage: avatarStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: function (req, file, cb) {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files (JPG, PNG, WebP) are allowed for avatars!'), false);
    }
  }
});

// Helper: read local users database
function readLocalUsers() {
  try {
    if (!fs.existsSync(USERS_FILE)) {
      fs.writeFileSync(USERS_FILE, JSON.stringify([], null, 2));
      return [];
    }
    const data = fs.readFileSync(USERS_FILE, 'utf8');
    return JSON.parse(data) || [];
  } catch (err) {
    console.error('Error reading local users database:', err);
    return [];
  }
}

// Helper: write local users database
function writeLocalUsers(users) {
  try {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
  } catch (err) {
    console.error('Error writing local users database:', err);
  }
}

// Helper: save/update user in local store
function saveLocalUser(user) {
  const users = readLocalUsers();
  const existingIdx = users.findIndex(u => u.email.toLowerCase() === user.email.toLowerCase());
  if (existingIdx !== -1) {
    users[existingIdx] = { ...users[existingIdx], ...user };
  } else {
    users.push(user);
  }
  writeLocalUsers(users);
}

// Helper: find local user by email
function findLocalUser(email) {
  const users = readLocalUsers();
  return users.find(u => u.email.toLowerCase() === email.toLowerCase());
}

// Signup
router.post('/signup', async (req, res) => {
  const { email, password, display_name } = req.body;

  // Validation
  if (!email || typeof email !== 'string' || !password || typeof password !== 'string') {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const cleanEmail = email.trim().toLowerCase();
  if (!cleanEmail.includes('@') || password.trim().length < 6) {
    return res.status(400).json({ error: 'Please provide a valid email and a password of at least 6 characters' });
  }

  try {
    const password_hash = await bcrypt.hash(password, 10);
    let user = null;

    // Try PostgreSQL Prisma first
    try {
      const existing = await prisma.users.findUnique({ where: { email: cleanEmail } });
      if (existing) {
        return res.status(409).json({ error: 'Email is already registered. Please log in.' });
      }

      user = await prisma.users.create({
        data: {
          email: cleanEmail,
          password_hash,
          display_name: display_name ? display_name.trim() : null
        }
      });
    } catch (dbErr) {
      console.warn('Prisma DB unavailable, using local users store:', dbErr.message);
      const localExisting = findLocalUser(cleanEmail);
      if (localExisting) {
        return res.status(409).json({ error: 'Email is already registered. Please log in.' });
      }
      user = {
        user_id: Date.now(),
        email: cleanEmail,
        password_hash,
        display_name: display_name ? display_name.trim() : null,
        created_at: new Date()
      };
    }

    // Always mirror to local users store for persistent fallback
    saveLocalUser({
      user_id: user.user_id,
      email: user.email,
      password_hash,
      display_name: user.display_name || cleanEmail.split('@')[0],
      created_at: user.created_at || new Date(),
      avatar: null
    });

    return res.status(201).json({
      message: 'Account created successfully',
      user: {
        user_id: user.user_id,
        email: user.email,
        display_name: user.display_name || cleanEmail.split('@')[0],
        created_at: user.created_at,
        avatar: null
      }
    });

  } catch (error) {
    console.error('Sign up error:', error);
    return res.status(500).json({ error: 'Failed to create account in database. Please try again.' });
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
    let user = null;

    // Try PostgreSQL Prisma first
    try {
      user = await prisma.users.findUnique({ where: { email: cleanEmail } });
    } catch (dbErr) {
      console.warn('Prisma DB unavailable during login, checking local store:', dbErr.message);
    }

    // Fallback to local store if not found in Prisma or Prisma was offline
    if (!user) {
      user = findLocalUser(cleanEmail);
    }

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const localUser = findLocalUser(cleanEmail);
    const avatar = (localUser && localUser.avatar) || user.avatar || null;

    return res.status(200).json({
      message: 'Login successful',
      user: {
        user_id: user.user_id,
        email: user.email,
        display_name: user.display_name || user.email.split('@')[0],
        created_at: user.created_at,
        avatar: avatar
      }
    });

  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Database login error. Please try again.' });
  }
});

// Social Logins (Google & Facebook)
router.post('/social', async (req, res) => {
  const { provider, email, name, avatar } = req.body;

  if (!provider) {
    return res.status(400).json({ error: 'Social provider is required' });
  }

  const providerName = provider.toLowerCase();
  const cleanEmail = email && typeof email === 'string' && email.includes('@')
    ? email.trim().toLowerCase()
    : `${providerName}_user_${Date.now()}@${providerName}.com`;

  const displayName = name && typeof name === 'string' && name.trim()
    ? name.trim()
    : (providerName === 'google' ? 'Google User' : 'Facebook User');

  try {
    let user = null;
    const randomPassword = Math.random().toString(36).slice(-12) + '!A9z';
    const password_hash = await bcrypt.hash(randomPassword, 10);

    // Try PostgreSQL Prisma first
    try {
      user = await prisma.users.findUnique({ where: { email: cleanEmail } });
      if (!user) {
        user = await prisma.users.create({
          data: {
            email: cleanEmail,
            password_hash,
            display_name: displayName
          }
        });
      }
    } catch (dbErr) {
      console.warn('Prisma DB unavailable for social auth, using local store:', dbErr.message);
      user = findLocalUser(cleanEmail);
      if (!user) {
        user = {
          user_id: Date.now(),
          email: cleanEmail,
          password_hash,
          display_name: displayName,
          created_at: new Date()
        };
      }
    }

    const localUser = findLocalUser(cleanEmail);
    const userAvatar = (localUser && localUser.avatar) || avatar || null;

    // Always mirror to local store
    saveLocalUser({
      user_id: user.user_id,
      email: user.email,
      password_hash: user.password_hash || password_hash,
      display_name: user.display_name || displayName,
      created_at: user.created_at || new Date(),
      provider: providerName,
      avatar: userAvatar
    });

    return res.status(200).json({
      message: `${providerName.charAt(0).toUpperCase() + providerName.slice(1)} login successful`,
      user: {
        user_id: user.user_id,
        email: user.email,
        display_name: user.display_name || displayName,
        created_at: user.created_at,
        provider: providerName,
        avatar: userAvatar
      }
    });
  } catch (error) {
    console.error('Social login error:', error);
    return res.status(200).json({
      message: `${providerName} login successful`,
      user: {
        user_id: Date.now(),
        email: cleanEmail,
        display_name: displayName,
        provider: providerName,
        avatar: avatar || null
      }
    });
  }
});

// Upload/Update Profile Picture (Avatar)
router.post('/avatar', avatarUpload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file uploaded.' });
    }

    const email = (req.body.email || '').trim().toLowerCase();
    const avatarUrl = '/uploads/avatars/' + req.file.filename;

    if (email) {
      // Update in local store
      const localUser = findLocalUser(email);
      if (localUser) {
        localUser.avatar = avatarUrl;
        saveLocalUser(localUser);
      } else {
        saveLocalUser({
          email: email,
          avatar: avatarUrl,
          created_at: new Date()
        });
      }
    }

    return res.status(200).json({
      message: 'Profile picture updated successfully',
      avatarUrl: avatarUrl
    });
  } catch (err) {
    console.error('Avatar upload error:', err);
    return res.status(500).json({ error: 'Failed to upload profile picture. ' + err.message });
  }
});

module.exports = router;