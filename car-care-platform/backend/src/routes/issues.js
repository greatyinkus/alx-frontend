import { Router } from 'express';
import { db } from '../db/init.js';
import { requireAuth } from '../middleware/auth.js';
import { newId, logActivity, notifyUsers, emitDashboardRefresh, ISSUE_STATUSES, PRIORITIES } from '../utils/helpers.js';

const router = Router();
router.use(requireAuth);

const ISSUE_SELECT = `
  SELECT i.*, l.name as location_name, u.name as assigned_manager_name,
         f.feedback_code, f.customer_name, f.customer_email, f.customer_phone,
         f.vehicle_make, f.vehicle_model, f.vehicle_registration, f.rating,
         f.feedback_text, f.complaint, f.requested_resolution, f.source, f.date_of_service
  FROM issues i
  LEFT JOIN locations l ON l.id = i.location_id
  LEFT JOIN users u ON u.id = i.assigned_manager_id
  LEFT JOIN feedback f ON f.id = i.feedback_id
`;

router.get('/', (req, res) => {
  const { location, severity, priority, status, manager, search } = req.query;
  let sql = `${ISSUE_SELECT} WHERE 1=1`;
  const params = [];

  if (location && location !== 'all') {
    sql += ' AND i.location_id = ?';
    params.push(location);
  }
  if (severity && severity !== 'all') {
    sql += ' AND i.severity = ?';
    params.push(severity);
  }
  if (priority && priority !== 'all') {
    sql += ' AND i.priority = ?';
    params.push(priority);
  }
  if (status && status !== 'all') {
    sql += ' AND i.status = ?';
    params.push(status);
  }
  if (manager && manager !== 'all') {
    sql += ' AND i.assigned_manager_id = ?';
    params.push(manager);
  }
  if (search) {
    sql += ` AND (i.issue_code LIKE ? OR f.customer_name LIKE ? OR i.description LIKE ? OR i.service_name LIKE ?)`;
    const like = `%${search}%`;
    params.push(like, like, like, like);
  }

  sql += ' ORDER BY i.created_at DESC LIMIT 300';
  res.json({ success: true, issues: db.prepare(sql).all(...params) });
});

router.get('/:id', (req, res) => {
  const issue = db.prepare(`${ISSUE_SELECT} WHERE i.id = ?`).get(req.params.id);
  if (!issue) return res.status(404).json({ success: false, message: 'Issue not found' });

  const comments = db
    .prepare('SELECT * FROM comments WHERE issue_id = ? ORDER BY created_at ASC')
    .all(issue.id);
  const notes = db
    .prepare('SELECT * FROM internal_notes WHERE issue_id = ? ORDER BY created_at ASC')
    .all(issue.id);
  const actionItems = db
    .prepare('SELECT * FROM action_items WHERE issue_id = ? ORDER BY created_at ASC')
    .all(issue.id);
  const timeline = db
    .prepare(
      `SELECT * FROM activity_logs
       WHERE (entity_type = 'issue' AND entity_id = ?) OR (entity_type = 'feedback' AND entity_id = ?)
       ORDER BY created_at ASC`
    )
    .all(issue.id, issue.feedback_id);
  const attachments = db.prepare('SELECT * FROM attachments WHERE issue_id = ?').all(issue.id);

  res.json({ success: true, issue, comments, notes, actionItems, timeline, attachments });
});

router.patch('/:id/assign', (req, res) => {
  const { managerId } = req.body || {};
  const issue = db.prepare('SELECT * FROM issues WHERE id = ?').get(req.params.id);
  if (!issue) return res.status(404).json({ success: false, message: 'Issue not found' });
  const manager = managerId ? db.prepare('SELECT * FROM users WHERE id = ?').get(managerId) : null;
  if (managerId && !manager) return res.status(400).json({ success: false, message: 'Manager not found' });

  db.prepare(
    `UPDATE issues SET assigned_manager_id = ?, status = CASE WHEN status = 'New' THEN 'Assigned' ELSE status END, updated_at = datetime('now') WHERE id = ?`
  ).run(managerId || null, issue.id);

  logActivity({
    entityType: 'issue',
    entityId: issue.id,
    action: 'assigned',
    actorId: req.user.id,
    actorName: req.user.name,
    description: manager
      ? `${issue.issue_code} assigned to ${manager.name} by ${req.user.name}.`
      : `${issue.issue_code} unassigned by ${req.user.name}.`,
  });

  if (manager) {
    notifyUsers([manager.id], {
      type: 'issue_assigned',
      title: `Issue assigned: ${issue.issue_code}`,
      body: `${req.user.name} assigned this issue to you.`,
      link: `/issues/${issue.id}`,
    });
  }

  emitDashboardRefresh();
  res.json({ success: true, issue: db.prepare('SELECT * FROM issues WHERE id = ?').get(issue.id) });
});

router.patch('/:id/status', (req, res) => {
  const { status } = req.body || {};
  if (!ISSUE_STATUSES.includes(status)) {
    return res.status(400).json({ success: false, message: 'Invalid status' });
  }
  const issue = db.prepare('SELECT * FROM issues WHERE id = ?').get(req.params.id);
  if (!issue) return res.status(404).json({ success: false, message: 'Issue not found' });

  const closedAt = ['Resolved', 'Closed'].includes(status) ? new Date().toISOString() : null;
  db.prepare(
    `UPDATE issues SET status = ?, updated_at = datetime('now'), closed_at = COALESCE(?, closed_at) WHERE id = ?`
  ).run(status, closedAt, issue.id);

  logActivity({
    entityType: 'issue',
    entityId: issue.id,
    action: 'status_changed',
    actorId: req.user.id,
    actorName: req.user.name,
    description: `${issue.issue_code} status changed from ${issue.status} to ${status} by ${req.user.name}.`,
  });

  emitDashboardRefresh();
  res.json({ success: true, issue: db.prepare('SELECT * FROM issues WHERE id = ?').get(issue.id) });
});

router.patch('/:id/priority', (req, res) => {
  const { priority } = req.body || {};
  if (!PRIORITIES.includes(priority)) {
    return res.status(400).json({ success: false, message: 'Invalid priority' });
  }
  const issue = db.prepare('SELECT * FROM issues WHERE id = ?').get(req.params.id);
  if (!issue) return res.status(404).json({ success: false, message: 'Issue not found' });

  db.prepare(`UPDATE issues SET priority = ?, updated_at = datetime('now') WHERE id = ?`).run(priority, issue.id);

  logActivity({
    entityType: 'issue',
    entityId: issue.id,
    action: 'priority_changed',
    actorId: req.user.id,
    actorName: req.user.name,
    description: `${issue.issue_code} priority changed from ${issue.priority} to ${priority} by ${req.user.name}.`,
  });

  emitDashboardRefresh();
  res.json({ success: true, issue: db.prepare('SELECT * FROM issues WHERE id = ?').get(issue.id) });
});

router.post('/:id/resolution', (req, res) => {
  const { resolution } = req.body || {};
  if (!resolution) return res.status(400).json({ success: false, message: 'Resolution text is required' });
  const issue = db.prepare('SELECT * FROM issues WHERE id = ?').get(req.params.id);
  if (!issue) return res.status(404).json({ success: false, message: 'Issue not found' });

  db.prepare(
    `UPDATE issues SET resolution = ?, status = 'Resolved', updated_at = datetime('now'), closed_at = datetime('now') WHERE id = ?`
  ).run(resolution, issue.id);

  logActivity({
    entityType: 'issue',
    entityId: issue.id,
    action: 'resolved',
    actorId: req.user.id,
    actorName: req.user.name,
    description: `Resolution added to ${issue.issue_code} by ${req.user.name}: "${resolution}"`,
  });

  emitDashboardRefresh();
  res.json({ success: true, issue: db.prepare('SELECT * FROM issues WHERE id = ?').get(issue.id) });
});

router.post('/:id/close', (req, res) => {
  const issue = db.prepare('SELECT * FROM issues WHERE id = ?').get(req.params.id);
  if (!issue) return res.status(404).json({ success: false, message: 'Issue not found' });

  db.prepare(`UPDATE issues SET status = 'Closed', updated_at = datetime('now'), closed_at = datetime('now') WHERE id = ?`).run(
    issue.id
  );

  logActivity({
    entityType: 'issue',
    entityId: issue.id,
    action: 'closed',
    actorId: req.user.id,
    actorName: req.user.name,
    description: `${issue.issue_code} marked Closed by ${req.user.name}.`,
  });

  emitDashboardRefresh();
  res.json({ success: true, issue: db.prepare('SELECT * FROM issues WHERE id = ?').get(issue.id) });
});

router.post('/:id/notes', (req, res) => {
  const { note } = req.body || {};
  if (!note) return res.status(400).json({ success: false, message: 'Note text is required' });
  const issue = db.prepare('SELECT * FROM issues WHERE id = ?').get(req.params.id);
  if (!issue) return res.status(404).json({ success: false, message: 'Issue not found' });

  const id = newId();
  db.prepare('INSERT INTO internal_notes (id, issue_id, user_id, user_name, note) VALUES (?,?,?,?,?)').run(
    id,
    issue.id,
    req.user.id,
    req.user.name,
    note
  );

  logActivity({
    entityType: 'issue',
    entityId: issue.id,
    action: 'note_added',
    actorId: req.user.id,
    actorName: req.user.name,
    description: `${req.user.name} added an internal note to ${issue.issue_code}.`,
  });

  res.status(201).json({ success: true, note: db.prepare('SELECT * FROM internal_notes WHERE id = ?').get(id) });
});

router.post('/:id/action-items', (req, res) => {
  const { title, assignedTo, dueDate } = req.body || {};
  if (!title) return res.status(400).json({ success: false, message: 'Action item title is required' });
  const issue = db.prepare('SELECT * FROM issues WHERE id = ?').get(req.params.id);
  if (!issue) return res.status(404).json({ success: false, message: 'Issue not found' });

  const id = newId();
  db.prepare(
    'INSERT INTO action_items (id, issue_id, title, assigned_to, due_date, created_by) VALUES (?,?,?,?,?,?)'
  ).run(id, issue.id, title, assignedTo || null, dueDate || null, req.user.id);

  logActivity({
    entityType: 'issue',
    entityId: issue.id,
    action: 'action_item_created',
    actorId: req.user.id,
    actorName: req.user.name,
    description: `${req.user.name} created action item "${title}" on ${issue.issue_code}.`,
  });

  if (assignedTo) {
    notifyUsers([assignedTo], {
      type: 'action_item',
      title: 'New action item assigned',
      body: title,
      link: `/issues/${issue.id}`,
    });
  }

  res.status(201).json({ success: true, actionItem: db.prepare('SELECT * FROM action_items WHERE id = ?').get(id) });
});

router.patch('/action-items/:itemId/complete', (req, res) => {
  const item = db.prepare('SELECT * FROM action_items WHERE id = ?').get(req.params.itemId);
  if (!item) return res.status(404).json({ success: false, message: 'Action item not found' });

  db.prepare(`UPDATE action_items SET status = 'Completed', completed_at = datetime('now') WHERE id = ?`).run(item.id);

  if (item.issue_id) {
    const issue = db.prepare('SELECT * FROM issues WHERE id = ?').get(item.issue_id);
    logActivity({
      entityType: 'issue',
      entityId: item.issue_id,
      action: 'action_item_completed',
      actorId: req.user.id,
      actorName: req.user.name,
      description: `${req.user.name} marked action item "${item.title}" complete on ${issue?.issue_code || ''}.`,
    });
  }

  res.json({ success: true, actionItem: db.prepare('SELECT * FROM action_items WHERE id = ?').get(item.id) });
});

export default router;
