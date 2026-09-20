import { v4 as uuidv4 } from 'uuid';
import { db } from '../db/init.js';

export const newId = () => uuidv4();

export function nextCode(prefix, table, codeColumn) {
  const year = new Date().getFullYear();
  const row = db
    .prepare(`SELECT COUNT(*) as count FROM ${table} WHERE ${codeColumn} LIKE ?`)
    .get(`${prefix}-${year}-%`);
  const seq = String((row?.count || 0) + 1).padStart(6, '0');
  return `${prefix}-${year}-${seq}`;
}

export const SEVERITY_TO_PRIORITY = {
  Positive: 'Low',
  'Mildly Concerned': 'Medium',
  Unhappy: 'High',
  'Very Angry': 'Critical',
};

export const SEVERITY_VALUES = ['Positive', 'Mildly Concerned', 'Unhappy', 'Very Angry'];
export const ISSUE_STATUSES = [
  'New',
  'Under Review',
  'Assigned',
  'In Progress',
  'Waiting for Customer',
  'Resolved',
  'Closed',
];
export const PRIORITIES = ['Low', 'Medium', 'High', 'Critical'];

export function logActivity({ entityType, entityId, action, actorId, actorName, description }) {
  const id = newId();
  db.prepare(
    `INSERT INTO activity_logs (id, entity_type, entity_id, action, actor_id, actor_name, description)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).run(id, entityType, entityId, action, actorId || null, actorName || 'System', description);
  const row = db.prepare('SELECT * FROM activity_logs WHERE id = ?').get(id);
  if (global.io) {
    global.io.emit('activity:new', row);
  }
  return row;
}

export function notifyUsers(userIds, { type, title, body, link }) {
  const stmt = db.prepare(
    `INSERT INTO notifications (id, user_id, type, title, body, link) VALUES (?, ?, ?, ?, ?, ?)`
  );
  const unique = [...new Set(userIds.filter(Boolean))];
  unique.forEach((userId) => {
    const id = newId();
    stmt.run(id, userId, type, title, body || null, link || null);
    if (global.io) {
      global.io.to(`user:${userId}`).emit('notification:new', {
        id,
        user_id: userId,
        type,
        title,
        body,
        link,
        is_read: 0,
      });
    }
  });
}

export function emitDashboardRefresh() {
  if (global.io) global.io.emit('dashboard:refresh');
}
