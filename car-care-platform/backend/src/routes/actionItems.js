import { Router } from 'express';
import { db } from '../db/init.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

router.get('/', (req, res) => {
  const { assignedTo, status } = req.query;
  let sql = `SELECT a.*, i.issue_code FROM action_items a LEFT JOIN issues i ON i.id = a.issue_id WHERE 1=1`;
  const params = [];
  if (assignedTo) {
    sql += ' AND a.assigned_to = ?';
    params.push(assignedTo);
  }
  if (status && status !== 'all') {
    sql += ' AND a.status = ?';
    params.push(status);
  }
  sql += ' ORDER BY a.created_at DESC LIMIT 200';
  res.json({ success: true, actionItems: db.prepare(sql).all(...params) });
});

export default router;
