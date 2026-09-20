import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { db } from '../db/init.js';
import { signToken, requireAuth } from '../middleware/auth.js';

const router = Router();

router.post('/login', (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email and password are required' });
  }
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(String(email).toLowerCase());
  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ success: false, message: 'Invalid email or password' });
  }
  if (user.status !== 'Active') {
    return res.status(403).json({ success: false, message: 'This account has been deactivated' });
  }
  const token = signToken(user);
  const { password_hash, ...safeUser } = user;
  res.json({ success: true, token, user: safeUser });
});

router.get('/me', requireAuth, (req, res) => {
  const user = db.prepare('SELECT id, name, email, role, location_id, status FROM users WHERE id = ?').get(req.user.id);
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });
  res.json({ success: true, user });
});

export default router;
