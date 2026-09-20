import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { db } from '../db/init.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { newId, logActivity } from '../utils/helpers.js';

const router = Router();
router.use(requireAuth);

const ROLES = ['Super Admin', 'General Manager', 'Operations Manager', 'Location Manager', 'Customer Service Manager'];

router.get('/', (req, res) => {
  const users = db
    .prepare(
      `SELECT u.id, u.name, u.email, u.role, u.location_id, u.status, u.created_at, l.name as location_name
       FROM users u LEFT JOIN locations l ON l.id = u.location_id ORDER BY u.name`
    )
    .all();
  res.json({ success: true, users });
});

router.post('/', requireRole('Super Admin'), (req, res) => {
  const { name, email, password, role, locationId } = req.body || {};
  if (!name || !email || !password || !role) {
    return res.status(400).json({ success: false, message: 'Name, email, password and role are required' });
  }
  if (!ROLES.includes(role)) return res.status(400).json({ success: false, message: 'Invalid role' });
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email.toLowerCase());
  if (existing) return res.status(409).json({ success: false, message: 'A user with this email already exists' });

  const id = newId();
  const hash = bcrypt.hashSync(password, 10);
  db.prepare('INSERT INTO users (id, name, email, password_hash, role, location_id) VALUES (?,?,?,?,?,?)').run(
    id,
    name,
    email.toLowerCase(),
    hash,
    role,
    locationId || null
  );

  logActivity({
    entityType: 'user',
    entityId: id,
    action: 'created',
    actorId: req.user.id,
    actorName: req.user.name,
    description: `${req.user.name} added ${name} as ${role}.`,
  });

  res.status(201).json({ success: true, user: { id, name, email, role, locationId } });
});

router.patch('/:id', requireRole('Super Admin'), (req, res) => {
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });
  const { name, role, locationId, status } = req.body || {};
  db.prepare(
    `UPDATE users SET name = COALESCE(?, name), role = COALESCE(?, role),
     location_id = COALESCE(?, location_id), status = COALESCE(?, status) WHERE id = ?`
  ).run(name, role, locationId, status, user.id);
  res.json({
    success: true,
    user: db.prepare('SELECT id, name, email, role, location_id, status FROM users WHERE id = ?').get(user.id),
  });
});

export default router;
