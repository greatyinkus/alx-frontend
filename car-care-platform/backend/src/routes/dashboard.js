import { Router } from 'express';
import { db } from '../db/init.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

router.get('/stats', (req, res) => {
  const { location } = req.query;
  const locClause = location && location !== 'all' ? 'AND location_id = ?' : '';
  const locParams = location && location !== 'all' ? [location] : [];

  const totalFeedback = db
    .prepare(`SELECT COUNT(*) as c FROM feedback WHERE 1=1 ${locClause}`)
    .get(...locParams).c;

  const openIssues = db
    .prepare(
      `SELECT COUNT(*) as c FROM issues WHERE status NOT IN ('Resolved','Closed') ${locClause}`
    )
    .get(...locParams).c;

  const newIssues = db
    .prepare(`SELECT COUNT(*) as c FROM issues WHERE status = 'New' ${locClause}`)
    .get(...locParams).c;

  const criticalIssues = db
    .prepare(
      `SELECT COUNT(*) as c FROM issues WHERE priority = 'Critical' AND status NOT IN ('Resolved','Closed') ${locClause}`
    )
    .get(...locParams).c;

  const unresolvedComplaints = db
    .prepare(
      `SELECT COUNT(*) as c FROM issues WHERE status NOT IN ('Resolved','Closed') AND severity IN ('Unhappy','Very Angry') ${locClause}`
    )
    .get(...locParams).c;

  const resolvedIssues = db
    .prepare(`SELECT COUNT(*) as c FROM issues WHERE status IN ('Resolved','Closed') ${locClause}`)
    .get(...locParams).c;

  const avgRating = db
    .prepare(`SELECT AVG(rating) as avg FROM feedback WHERE rating IS NOT NULL ${locClause}`)
    .get(...locParams).avg;

  const avgResolutionHours = db
    .prepare(
      `SELECT AVG((julianday(closed_at) - julianday(created_at)) * 24) as avg
       FROM issues WHERE closed_at IS NOT NULL ${locClause}`
    )
    .get(...locParams).avg;

  res.json({
    success: true,
    stats: {
      totalFeedback,
      openIssues,
      newIssues,
      criticalIssues,
      unresolvedComplaints,
      resolvedIssues,
      averageRating: avgRating ? Number(avgRating.toFixed(2)) : null,
      averageResolutionHours: avgResolutionHours ? Number(avgResolutionHours.toFixed(1)) : null,
    },
  });
});

router.get('/overview', (req, res) => {
  const { location } = req.query;
  const locClauseF = location && location !== 'all' ? 'AND f.location_id = ?' : '';
  const locClauseI = location && location !== 'all' ? 'AND i.location_id = ?' : '';
  const p = location && location !== 'all' ? [location] : [];

  const recentFeedback = db
    .prepare(
      `SELECT f.*, l.name as location_name FROM feedback f
       LEFT JOIN locations l ON l.id = f.location_id
       WHERE 1=1 ${locClauseF} ORDER BY f.submitted_at DESC LIMIT 8`
    )
    .all(...p);

  const criticalComplaints = db
    .prepare(
      `SELECT i.*, l.name as location_name, f.customer_name FROM issues i
       LEFT JOIN locations l ON l.id = i.location_id
       LEFT JOIN feedback f ON f.id = i.feedback_id
       WHERE i.priority = 'Critical' AND i.status NOT IN ('Resolved','Closed') ${locClauseI}
       ORDER BY i.created_at DESC LIMIT 8`
    )
    .all(...p);

  const needsAttention = db
    .prepare(
      `SELECT i.*, l.name as location_name, f.customer_name FROM issues i
       LEFT JOIN locations l ON l.id = i.location_id
       LEFT JOIN feedback f ON f.id = i.feedback_id
       WHERE i.status IN ('New','Under Review') ${locClauseI}
       ORDER BY i.created_at DESC LIMIT 8`
    )
    .all(...p);

  const recentlyResolved = db
    .prepare(
      `SELECT i.*, l.name as location_name, f.customer_name FROM issues i
       LEFT JOIN locations l ON l.id = i.location_id
       LEFT JOIN feedback f ON f.id = i.feedback_id
       WHERE i.status IN ('Resolved','Closed') ${locClauseI}
       ORDER BY i.closed_at DESC LIMIT 8`
    )
    .all(...p);

  const recentActivity = db.prepare('SELECT * FROM activity_logs ORDER BY created_at DESC LIMIT 15').all();

  const pendingActionItems = db
    .prepare(
      `SELECT a.*, i.issue_code FROM action_items a LEFT JOIN issues i ON i.id = a.issue_id
       WHERE a.status = 'Pending' ORDER BY a.created_at DESC LIMIT 10`
    )
    .all();

  res.json({
    success: true,
    recentFeedback,
    criticalComplaints,
    needsAttention,
    recentlyResolved,
    recentActivity,
    pendingActionItems,
  });
});

export default router;
