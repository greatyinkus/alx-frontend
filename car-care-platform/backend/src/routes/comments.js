import { Router } from 'express';
import { db } from '../db/init.js';
import { requireAuth } from '../middleware/auth.js';
import { newId, logActivity, notifyUsers } from '../utils/helpers.js';

const router = Router();
router.use(requireAuth);

function extractMentions(body) {
  const matches = [...body.matchAll(/@([a-zA-Z0-9._-]+)/g)].map((m) => m[1].toLowerCase());
  if (!matches.length) return [];
  const users = db.prepare('SELECT id, name, email FROM users').all();
  return users
    .filter((u) =>
      matches.some((m) => u.name.toLowerCase().replace(/\s+/g, '.').includes(m) || u.email.toLowerCase().startsWith(m))
    )
    .map((u) => u.id);
}

router.get('/', (req, res) => {
  const { issueId } = req.query;
  let rows;
  if (issueId) {
    rows = db.prepare('SELECT * FROM comments WHERE issue_id = ? ORDER BY created_at ASC').all(issueId);
  } else {
    rows = db
      .prepare(
        `SELECT c.*, i.issue_code FROM comments c LEFT JOIN issues i ON i.id = c.issue_id
         ORDER BY c.created_at DESC LIMIT 100`
      )
      .all();
  }
  res.json({ success: true, comments: rows });
});

router.post('/', (req, res) => {
  const { body, issueId, parentId } = req.body || {};
  if (!body || !body.trim()) return res.status(400).json({ success: false, message: 'Comment cannot be empty' });

  const mentionIds = extractMentions(body);
  const id = newId();
  db.prepare(
    'INSERT INTO comments (id, issue_id, parent_id, user_id, user_name, body, mentions) VALUES (?,?,?,?,?,?,?)'
  ).run(id, issueId || null, parentId || null, req.user.id, req.user.name, body, JSON.stringify(mentionIds));

  const comment = db.prepare('SELECT * FROM comments WHERE id = ?').get(id);

  let issueCode = null;
  if (issueId) {
    const issue = db.prepare('SELECT issue_code FROM issues WHERE id = ?').get(issueId);
    issueCode = issue?.issue_code;
    logActivity({
      entityType: 'issue',
      entityId: issueId,
      action: 'comment_added',
      actorId: req.user.id,
      actorName: req.user.name,
      description: `${req.user.name} commented on ${issueCode}: "${body.slice(0, 120)}"`,
    });
  } else {
    logActivity({
      entityType: 'management_hub',
      entityId: id,
      action: 'update_posted',
      actorId: req.user.id,
      actorName: req.user.name,
      description: `${req.user.name} posted a management update: "${body.slice(0, 120)}"`,
    });
  }

  if (mentionIds.length) {
    notifyUsers(mentionIds, {
      type: 'mention',
      title: `${req.user.name} mentioned you`,
      body: body.slice(0, 140),
      link: issueId ? `/issues/${issueId}` : '/management-hub',
    });
  }

  if (global.io) global.io.emit('comment:new', comment);

  res.status(201).json({ success: true, comment });
});

export default router;
