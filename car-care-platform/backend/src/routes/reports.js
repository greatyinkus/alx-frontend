import { Router } from 'express';
import { db } from '../db/init.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

function dateFilterClause(column, from, to) {
  let clause = '';
  const params = [];
  if (from) {
    clause += ` AND ${column} >= ?`;
    params.push(from);
  }
  if (to) {
    clause += ` AND ${column} <= ?`;
    params.push(to);
  }
  return { clause, params };
}

router.get('/summary', (req, res) => {
  const { from, to } = req.query;
  const { clause, params } = dateFilterClause('f.submitted_at', from, to);

  const byLocation = db
    .prepare(
      `SELECT l.name as location, COUNT(f.id) as count, AVG(f.rating) as avgRating
       FROM feedback f LEFT JOIN locations l ON l.id = f.location_id
       WHERE 1=1 ${clause} GROUP BY f.location_id ORDER BY count DESC`
    )
    .all(...params);

  const byService = db
    .prepare(
      `SELECT service_name as service, COUNT(*) as count FROM feedback f
       WHERE service_name IS NOT NULL ${clause} GROUP BY service_name ORDER BY count DESC`
    )
    .all(...params);

  const bySeverity = db
    .prepare(`SELECT severity, COUNT(*) as count FROM feedback f WHERE 1=1 ${clause} GROUP BY severity`)
    .all(...params);

  const bySource = db
    .prepare(`SELECT source, COUNT(*) as count FROM feedback f WHERE 1=1 ${clause} GROUP BY source`)
    .all(...params);

  const issueClause = dateFilterClause('i.created_at', from, to);
  const issuesByStatus = db
    .prepare(`SELECT status, COUNT(*) as count FROM issues i WHERE 1=1 ${issueClause.clause} GROUP BY status`)
    .all(...issueClause.params);

  const openVsResolved = db
    .prepare(
      `SELECT
        SUM(CASE WHEN status NOT IN ('Resolved','Closed') THEN 1 ELSE 0 END) as open,
        SUM(CASE WHEN status IN ('Resolved','Closed') THEN 1 ELSE 0 END) as resolved
       FROM issues i WHERE 1=1 ${issueClause.clause}`
    )
    .get(...issueClause.params);

  const managementActivity = db
    .prepare(
      `SELECT actor_name, COUNT(*) as count FROM activity_logs
       WHERE actor_name IS NOT NULL AND actor_name != 'System'
       GROUP BY actor_name ORDER BY count DESC LIMIT 10`
    )
    .all();

  res.json({
    success: true,
    byLocation,
    byService,
    bySeverity,
    bySource,
    issuesByStatus,
    openVsResolved,
    managementActivity,
  });
});

export default router;
