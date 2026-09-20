import { Router } from 'express';
import { db } from '../db/init.js';
import { requireAuth } from '../middleware/auth.js';
import { logActivity } from '../utils/helpers.js';

const router = Router();
router.use(requireAuth);

router.get('/', (req, res) => {
  const { status } = req.query;
  let sql = `SELECT r.*, l.name as location_name FROM reviews r LEFT JOIN locations l ON l.id = r.location_id WHERE 1=1`;
  const params = [];
  if (status && status !== 'all') {
    sql += ' AND r.status = ?';
    params.push(status);
  }
  sql += ' ORDER BY r.created_at DESC';
  res.json({ success: true, reviews: db.prepare(sql).all(...params) });
});

router.patch('/:id/status', (req, res) => {
  const { status } = req.body || {};
  if (!['Pending', 'Approved', 'Hidden', 'Rejected'].includes(status)) {
    return res.status(400).json({ success: false, message: 'Invalid status' });
  }
  const review = db.prepare('SELECT * FROM reviews WHERE id = ?').get(req.params.id);
  if (!review) return res.status(404).json({ success: false, message: 'Review not found' });

  db.prepare('UPDATE reviews SET status = ? WHERE id = ?').run(status, review.id);

  logActivity({
    entityType: 'review',
    entityId: review.id,
    action: 'status_changed',
    actorId: req.user.id,
    actorName: req.user.name,
    description: `${req.user.name} marked a review as ${status}.`,
  });

  res.json({ success: true, review: db.prepare('SELECT * FROM reviews WHERE id = ?').get(review.id) });
});

router.patch('/:id/feature', (req, res) => {
  const { featured } = req.body || {};
  const review = db.prepare('SELECT * FROM reviews WHERE id = ?').get(req.params.id);
  if (!review) return res.status(404).json({ success: false, message: 'Review not found' });
  db.prepare('UPDATE reviews SET featured = ? WHERE id = ?').run(featured ? 1 : 0, review.id);
  res.json({ success: true, review: db.prepare('SELECT * FROM reviews WHERE id = ?').get(review.id) });
});

export default router;
