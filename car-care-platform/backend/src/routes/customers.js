import { Router } from 'express';
import { db } from '../db/init.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

router.get('/', (req, res) => {
  const { search } = req.query;
  let sql = `SELECT c.*,
    (SELECT COUNT(*) FROM feedback WHERE customer_id = c.id) as feedback_count,
    (SELECT AVG(rating) FROM feedback WHERE customer_id = c.id AND rating IS NOT NULL) as avg_rating
    FROM customers c WHERE 1=1`;
  const params = [];
  if (search) {
    sql += ' AND (c.name LIKE ? OR c.email LIKE ? OR c.phone LIKE ?)';
    const like = `%${search}%`;
    params.push(like, like, like);
  }
  sql += ' ORDER BY c.created_at DESC LIMIT 300';
  res.json({ success: true, customers: db.prepare(sql).all(...params) });
});

router.get('/:id', (req, res) => {
  const customer = db.prepare('SELECT * FROM customers WHERE id = ?').get(req.params.id);
  if (!customer) return res.status(404).json({ success: false, message: 'Customer not found' });
  const feedback = db
    .prepare(
      `SELECT f.*, l.name as location_name FROM feedback f LEFT JOIN locations l ON l.id = f.location_id
       WHERE f.customer_id = ? ORDER BY f.submitted_at DESC`
    )
    .all(customer.id);
  res.json({ success: true, customer, feedback });
});

export default router;
