import { Router } from 'express';
import { db } from '../db/init.js';
import { requireAuth } from '../middleware/auth.js';
import { createFeedbackRecord, createIssueFromFeedback, getIssueByFeedbackId } from '../services/feedbackService.js';

const router = Router();
router.use(requireAuth);

router.get('/', (req, res) => {
  const { location, severity, source, status, search, from, to } = req.query;
  let sql = `SELECT f.*, l.name as location_name, i.id as issue_id, i.issue_code, i.status as issue_status
             FROM feedback f
             LEFT JOIN locations l ON l.id = f.location_id
             LEFT JOIN issues i ON i.feedback_id = f.id
             WHERE 1=1`;
  const params = [];

  if (location && location !== 'all') {
    sql += ' AND f.location_id = ?';
    params.push(location);
  }
  if (severity && severity !== 'all') {
    sql += ' AND f.severity = ?';
    params.push(severity);
  }
  if (source && source !== 'all') {
    sql += ' AND f.source = ?';
    params.push(source);
  }
  if (status && status !== 'all') {
    sql += ' AND f.status = ?';
    params.push(status);
  }
  if (from) {
    sql += ' AND f.submitted_at >= ?';
    params.push(from);
  }
  if (to) {
    sql += ' AND f.submitted_at <= ?';
    params.push(to);
  }
  if (search) {
    sql += ` AND (f.customer_name LIKE ? OR f.feedback_code LIKE ? OR f.service_name LIKE ?
             OR f.vehicle_registration LIKE ? OR f.feedback_text LIKE ?)`;
    const like = `%${search}%`;
    params.push(like, like, like, like, like);
  }

  sql += ' ORDER BY f.submitted_at DESC LIMIT 300';
  const rows = db.prepare(sql).all(...params);
  res.json({ success: true, feedback: rows });
});

router.get('/:id', (req, res) => {
  const feedback = db
    .prepare(
      `SELECT f.*, l.name as location_name FROM feedback f
       LEFT JOIN locations l ON l.id = f.location_id WHERE f.id = ?`
    )
    .get(req.params.id);
  if (!feedback) return res.status(404).json({ success: false, message: 'Feedback not found' });
  const issue = getIssueByFeedbackId(feedback.id);
  const attachments = db.prepare('SELECT * FROM attachments WHERE feedback_id = ?').all(feedback.id);
  res.json({ success: true, feedback, issue, attachments });
});

router.post('/', (req, res) => {
  const body = req.body || {};
  if (!body.customerName) {
    return res.status(400).json({ success: false, message: 'Customer name is required' });
  }
  const { feedback, issue } = createFeedbackRecord({ ...body, source: body.source || 'Manual Entry' });
  res.status(201).json({ success: true, feedback, issue });
});

router.post('/:id/create-issue', (req, res) => {
  const feedback = db.prepare('SELECT * FROM feedback WHERE id = ?').get(req.params.id);
  if (!feedback) return res.status(404).json({ success: false, message: 'Feedback not found' });
  const existing = getIssueByFeedbackId(feedback.id);
  if (existing) return res.json({ success: true, issue: existing, message: 'Issue already exists' });
  const issue = createIssueFromFeedback(feedback);
  res.status(201).json({ success: true, issue });
});

export default router;
