import { Router } from 'express';
import { db } from '../db/init.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

router.get('/', (req, res) => {
  const { location, entityType, limit } = req.query;
  let sql = 'SELECT * FROM activity_logs WHERE 1=1';
  const params = [];

  if (entityType && entityType !== 'all') {
    sql += ' AND entity_type = ?';
    params.push(entityType);
  }

  if (location && location !== 'all') {
    sql += ` AND (
      (entity_type = 'feedback' AND entity_id IN (SELECT id FROM feedback WHERE location_id = ?)) OR
      (entity_type = 'issue' AND entity_id IN (SELECT id FROM issues WHERE location_id = ?))
    )`;
    params.push(location, location);
  }

  sql += ' ORDER BY created_at DESC LIMIT ?';
  params.push(Number(limit) || 100);

  res.json({ success: true, activity: db.prepare(sql).all(...params) });
});

export default router;
