import { Router } from 'express';
import { db } from '../db/init.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

router.get('/', (req, res) => {
  const notifications = db
    .prepare('SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 100')
    .all(req.user.id);
  const unreadCount = db
    .prepare('SELECT COUNT(*) as c FROM notifications WHERE user_id = ? AND is_read = 0')
    .get(req.user.id).c;
  res.json({ success: true, notifications, unreadCount });
});

router.patch('/:id/read', (req, res) => {
  db.prepare('UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?').run(req.params.id, req.user.id);
  res.json({ success: true });
});

router.post('/read-all', (req, res) => {
  db.prepare('UPDATE notifications SET is_read = 1 WHERE user_id = ?').run(req.user.id);
  res.json({ success: true });
});

export default router;
