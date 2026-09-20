import { Router } from 'express';
import { db } from '../db/init.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { newId, logActivity } from '../utils/helpers.js';

const router = Router();
router.use(requireAuth);

router.get('/', (req, res) => {
  const locations = db
    .prepare(
      `SELECT l.*, u.name as manager_name,
       (SELECT COUNT(*) FROM feedback WHERE location_id = l.id) as feedback_count,
       (SELECT COUNT(*) FROM issues WHERE location_id = l.id AND status NOT IN ('Resolved','Closed')) as open_issue_count
       FROM locations l LEFT JOIN users u ON u.id = l.manager_id
       ORDER BY l.name`
    )
    .all();
  res.json({ success: true, locations });
});

router.post('/', requireRole('Super Admin', 'General Manager'), (req, res) => {
  const { name, address, managerId, contact } = req.body || {};
  if (!name) return res.status(400).json({ success: false, message: 'Location name is required' });
  const id = newId();
  db.prepare('INSERT INTO locations (id, name, address, manager_id, contact) VALUES (?,?,?,?,?)').run(
    id,
    name,
    address || null,
    managerId || null,
    contact || null
  );
  logActivity({
    entityType: 'location',
    entityId: id,
    action: 'created',
    actorId: req.user.id,
    actorName: req.user.name,
    description: `${req.user.name} added new location "${name}".`,
  });
  res.status(201).json({ success: true, location: db.prepare('SELECT * FROM locations WHERE id = ?').get(id) });
});

router.patch('/:id', requireRole('Super Admin', 'General Manager'), (req, res) => {
  const location = db.prepare('SELECT * FROM locations WHERE id = ?').get(req.params.id);
  if (!location) return res.status(404).json({ success: false, message: 'Location not found' });
  const { name, address, managerId, contact, status } = req.body || {};
  db.prepare(
    `UPDATE locations SET name = COALESCE(?, name), address = COALESCE(?, address),
     manager_id = COALESCE(?, manager_id), contact = COALESCE(?, contact), status = COALESCE(?, status)
     WHERE id = ?`
  ).run(name, address, managerId, contact, status, location.id);
  res.json({ success: true, location: db.prepare('SELECT * FROM locations WHERE id = ?').get(location.id) });
});

export default router;
