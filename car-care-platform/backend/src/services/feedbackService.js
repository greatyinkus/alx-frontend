import { db } from '../db/init.js';
import { newId, nextCode, SEVERITY_TO_PRIORITY, logActivity, notifyUsers, emitDashboardRefresh } from '../utils/helpers.js';

const ISSUE_WORTHY = ['Unhappy', 'Very Angry'];

export function findOrCreateCustomer({ name, email, phone }) {
  if (email) {
    const existing = db.prepare('SELECT * FROM customers WHERE email = ?').get(email);
    if (existing) {
      db.prepare('UPDATE customers SET name = COALESCE(?, name), phone = COALESCE(?, phone) WHERE id = ?').run(
        name || null,
        phone || null,
        existing.id
      );
      return existing.id;
    }
  }
  const id = newId();
  db.prepare('INSERT INTO customers (id, name, email, phone) VALUES (?, ?, ?, ?)').run(
    id,
    name || 'Unknown Customer',
    email || null,
    phone || null
  );
  return id;
}

export function resolveLocationId(locationNameOrId) {
  if (!locationNameOrId) return null;
  const byId = db.prepare('SELECT id FROM locations WHERE id = ?').get(locationNameOrId);
  if (byId) return byId.id;
  const byName = db.prepare('SELECT id FROM locations WHERE lower(name) = lower(?)').get(locationNameOrId);
  if (byName) return byName.id;
  const id = newId();
  db.prepare('INSERT INTO locations (id, name, status) VALUES (?, ?, ?)').run(id, locationNameOrId, 'Active');
  return id;
}

export function createFeedbackRecord(input) {
  const {
    externalId,
    customerName,
    email,
    phone,
    location,
    service,
    vehicleMake,
    vehicleModel,
    vehicleRegistration,
    dateOfService,
    rating,
    severity,
    feedbackText,
    complaint,
    requestedResolution,
    source,
    submittedAt,
  } = input;

  if (externalId) {
    const existing = db.prepare('SELECT * FROM feedback WHERE external_id = ?').get(externalId);
    if (existing) {
      return { feedback: existing, issue: getIssueByFeedbackId(existing.id), duplicate: true };
    }
  }

  const customerId = findOrCreateCustomer({ name: customerName, email, phone });
  const locationId = resolveLocationId(location);
  const feedbackId = newId();
  const feedbackCode = nextCode('FB', 'feedback', 'feedback_code');
  const finalSeverity = severity || 'Positive';

  db.prepare(
    `INSERT INTO feedback (
      id, feedback_code, external_id, customer_id, customer_name, customer_email, customer_phone,
      location_id, service_name, vehicle_make, vehicle_model, vehicle_registration, date_of_service,
      rating, severity, feedback_text, complaint, requested_resolution, source, status, submitted_at
    ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`
  ).run(
    feedbackId,
    feedbackCode,
    externalId || null,
    customerId,
    customerName || 'Unknown Customer',
    email || null,
    phone || null,
    locationId,
    service || null,
    vehicleMake || null,
    vehicleModel || null,
    vehicleRegistration || null,
    dateOfService || null,
    rating != null ? Number(rating) : null,
    finalSeverity,
    feedbackText || null,
    complaint || null,
    requestedResolution || null,
    source || 'Website',
    'New',
    submittedAt || new Date().toISOString()
  );

  const feedback = db.prepare('SELECT * FROM feedback WHERE id = ?').get(feedbackId);

  logActivity({
    entityType: 'feedback',
    entityId: feedbackId,
    action: 'created',
    actorName: source === 'n8n' ? 'n8n Automation' : 'Customer',
    description: `New feedback ${feedbackCode} received from ${customerName || 'a customer'}${
      location ? ` at ${location}` : ''
    } via ${source || 'Website'}.`,
  });

  let issue = null;
  if (ISSUE_WORTHY.includes(finalSeverity) || (complaint && complaint.trim().length > 0)) {
    issue = createIssueFromFeedback(feedback);
  }

  notifyManagement(feedback, issue);
  emitDashboardRefresh();
  if (global.io) global.io.emit('feedback:new', feedback);

  return { feedback, issue, duplicate: false };
}

export function createIssueFromFeedback(feedback) {
  const issueId = newId();
  const issueCode = nextCode('ISS', 'issues', 'issue_code');
  const priority = SEVERITY_TO_PRIORITY[feedback.severity] || 'Medium';

  db.prepare(
    `INSERT INTO issues (
      id, issue_code, feedback_id, customer_id, location_id, service_name, description,
      severity, priority, status
    ) VALUES (?,?,?,?,?,?,?,?,?,?)`
  ).run(
    issueId,
    issueCode,
    feedback.id,
    feedback.customer_id,
    feedback.location_id,
    feedback.service_name,
    feedback.complaint || feedback.feedback_text || 'Customer complaint requires attention.',
    feedback.severity,
    priority,
    'New'
  );

  const issue = db.prepare('SELECT * FROM issues WHERE id = ?').get(issueId);

  logActivity({
    entityType: 'issue',
    entityId: issueId,
    action: 'created',
    actorName: 'System',
    description: `Issue ${issueCode} automatically created from feedback ${feedback.feedback_code} (${feedback.severity}).`,
  });

  if (global.io) global.io.emit('issue:new', issue);

  return issue;
}

export function getIssueByFeedbackId(feedbackId) {
  return db.prepare('SELECT * FROM issues WHERE feedback_id = ?').get(feedbackId) || null;
}

function notifyManagement(feedback, issue) {
  const managers = db
    .prepare("SELECT id FROM users WHERE role IN ('Super Admin','General Manager','Operations Manager') AND status = 'Active'")
    .all()
    .map((u) => u.id);

  let locationManagers = [];
  if (feedback.location_id) {
    locationManagers = db
      .prepare("SELECT id FROM users WHERE location_id = ? AND role = 'Location Manager' AND status = 'Active'")
      .all(feedback.location_id)
      .map((u) => u.id);
  }

  const recipients = [...managers, ...locationManagers];
  const isCritical = feedback.severity === 'Very Angry';

  notifyUsers(recipients, {
    type: isCritical ? 'critical_feedback' : 'new_feedback',
    title: isCritical ? 'Critical feedback received' : 'New feedback received',
    body: `${feedback.customer_name} submitted ${feedback.severity.toLowerCase()} feedback (${feedback.feedback_code}).`,
    link: `/feedback/${feedback.id}`,
  });

  if (issue) {
    notifyUsers(recipients, {
      type: 'issue_created',
      title: `Issue created: ${issue.issue_code}`,
      body: `Priority: ${issue.priority}. Requires assignment.`,
      link: `/issues/${issue.id}`,
    });
  }
}
