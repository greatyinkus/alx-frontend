import bcrypt from 'bcryptjs';
import { db } from './init.js';
import { newId } from '../utils/helpers.js';
import { createFeedbackRecord } from '../services/feedbackService.js';

console.log('Seeding database...');

db.exec(`
  DELETE FROM notifications;
  DELETE FROM activity_logs;
  DELETE FROM attachments;
  DELETE FROM action_items;
  DELETE FROM internal_notes;
  DELETE FROM comments;
  DELETE FROM reviews;
  DELETE FROM issues;
  DELETE FROM feedback;
  DELETE FROM customers;
  DELETE FROM services;
  DELETE FROM users;
  DELETE FROM locations;
`);

const PASSWORD = 'Password123!';
const hash = bcrypt.hashSync(PASSWORD, 10);

const locations = [
  { id: newId(), name: 'Lekki', address: '12 Admiralty Way, Lekki Phase 1, Lagos', contact: '+2348010000001' },
  { id: newId(), name: 'Victoria Island', address: '45 Adeola Odeku St, Victoria Island, Lagos', contact: '+2348010000002' },
  { id: newId(), name: 'Ikeja', address: '8 Allen Avenue, Ikeja, Lagos', contact: '+2348010000003' },
  { id: newId(), name: 'Yaba', address: '21 Herbert Macaulay Way, Yaba, Lagos', contact: '+2348010000004' },
  { id: newId(), name: 'Abuja', address: '3 Aminu Kano Crescent, Wuse II, Abuja', contact: '+2348010000005' },
];
const insertLocation = db.prepare('INSERT INTO locations (id, name, address, contact, status) VALUES (?,?,?,?,?)');
locations.forEach((l) => insertLocation.run(l.id, l.name, l.address, l.contact, 'Active'));
const [lekki, vi, ikeja, yaba, abuja] = locations;

const services = [
  'Brake Repair',
  'Oil Change',
  'Engine Diagnostics',
  'Tire Replacement',
  'AC Repair',
  'Full Service',
  'Battery Replacement',
  'Wheel Alignment',
];
const insertService = db.prepare('INSERT INTO services (id, name, description) VALUES (?,?,?)');
services.forEach((s) => insertService.run(newId(), s, `Professional ${s.toLowerCase()} performed by certified technicians.`));

const insertUser = db.prepare(
  'INSERT INTO users (id, name, email, password_hash, role, location_id, status) VALUES (?,?,?,?,?,?,?)'
);

const superAdmin = { id: newId(), name: 'Ada Okafor', email: 'super@carcare.com', role: 'Super Admin' };
const gm = { id: newId(), name: 'Tunde Balogun', email: 'gm@carcare.com', role: 'General Manager' };
const ops = { id: newId(), name: 'Ifeoma Nwosu', email: 'ops@carcare.com', role: 'Operations Manager' };
const csManager = { id: newId(), name: 'Chidinma Eze', email: 'cs@carcare.com', role: 'Customer Service Manager' };
const lekkiManager = { id: newId(), name: 'Emeka Chukwu', email: 'lekki.manager@carcare.com', role: 'Location Manager', location_id: lekki.id };
const viManager = { id: newId(), name: 'Bisi Adeyemi', email: 'vi.manager@carcare.com', role: 'Location Manager', location_id: vi.id };
const ikejaManager = { id: newId(), name: 'Kunle Fashola', email: 'ikeja.manager@carcare.com', role: 'Location Manager', location_id: ikeja.id };

[superAdmin, gm, ops, csManager, lekkiManager, viManager, ikejaManager].forEach((u) => {
  insertUser.run(u.id, u.name, u.email, hash, u.role, u.location_id || null, 'Active');
});

db.prepare('UPDATE locations SET manager_id = ? WHERE id = ?').run(lekkiManager.id, lekki.id);
db.prepare('UPDATE locations SET manager_id = ? WHERE id = ?').run(viManager.id, vi.id);
db.prepare('UPDATE locations SET manager_id = ? WHERE id = ?').run(ikejaManager.id, ikeja.id);

console.log(`Demo accounts (password for all: ${PASSWORD}):`);
[superAdmin, gm, ops, csManager, lekkiManager, viManager, ikejaManager].forEach((u) =>
  console.log(`  - ${u.role.padEnd(24)} ${u.email}`)
);

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

const feedbackSeeds = [
  {
    customerName: 'John Doe', email: 'john.doe@example.com', phone: '+2348000000001', location: lekki.id,
    service: 'Brake Repair', vehicleMake: 'Toyota', vehicleModel: 'Camry', vehicleRegistration: 'ABC123XY',
    dateOfService: daysAgo(6), rating: 2, severity: 'Very Angry',
    feedbackText: 'The brake problem returned after the repair.', complaint: 'The brake problem returned two days after I picked up the car.',
    requestedResolution: 'I would like the issue inspected again at no extra cost.', source: 'n8n', externalId: 'FB-DEMO-000124', submittedAt: daysAgo(6),
  },
  {
    customerName: 'Grace Adamu', email: 'grace.adamu@example.com', phone: '+2348000000002', location: vi.id,
    service: 'Oil Change', vehicleMake: 'Honda', vehicleModel: 'Accord', vehicleRegistration: 'LSD456AB',
    dateOfService: daysAgo(5), rating: 3, severity: 'Mildly Concerned',
    feedbackText: 'Service took longer than promised.', complaint: 'I waited almost 3 hours for a simple oil change.',
    requestedResolution: 'A discount on my next visit would be appreciated.', source: 'WhatsApp', submittedAt: daysAgo(5),
  },
  {
    customerName: 'Michael Obi', email: 'michael.obi@example.com', phone: '+2348000000003', location: ikeja.id,
    service: 'Engine Diagnostics', vehicleMake: 'Lexus', vehicleModel: 'RX350', vehicleRegistration: 'KJA789CD',
    dateOfService: daysAgo(4), rating: 1, severity: 'Very Angry',
    feedbackText: 'Car still has the same engine light issue.', complaint: 'I paid for diagnostics and the check engine light is still on. Nobody called me back.',
    requestedResolution: 'Full refund or a proper fix immediately.', source: 'Email', submittedAt: daysAgo(4),
  },
  {
    customerName: 'Ngozi Umeh', email: 'ngozi.umeh@example.com', phone: '+2348000000004', location: yaba.id,
    service: 'Tire Replacement', vehicleMake: 'Kia', vehicleModel: 'Sportage', vehicleRegistration: 'LND321EF',
    dateOfService: daysAgo(3), rating: 5, severity: 'Positive',
    feedbackText: 'Excellent and fast service! The team was very professional.', complaint: null,
    requestedResolution: null, source: 'Google', submittedAt: daysAgo(3),
  },
  {
    customerName: 'Samuel Bello', email: 'samuel.bello@example.com', phone: '+2348000000005', location: abuja.id,
    service: 'AC Repair', vehicleMake: 'Mercedes-Benz', vehicleModel: 'C300', vehicleRegistration: 'ABJ654GH',
    dateOfService: daysAgo(2), rating: 4, severity: 'Positive',
    feedbackText: 'Good job on the AC, cooling perfectly now.', complaint: null,
    requestedResolution: null, source: 'Website', submittedAt: daysAgo(2),
  },
  {
    customerName: 'Funke Ajayi', email: 'funke.ajayi@example.com', phone: '+2348000000006', location: lekki.id,
    service: 'Full Service', vehicleMake: 'Toyota', vehicleModel: 'Highlander', vehicleRegistration: 'LKK112IJ',
    dateOfService: daysAgo(8), rating: 2, severity: 'Unhappy',
    feedbackText: 'Not happy with the wash and vacuum quality.', complaint: 'Interior was not properly cleaned even though it was included in the full service package.',
    requestedResolution: 'Please redo the interior cleaning.', source: 'WhatsApp', submittedAt: daysAgo(8),
  },
  {
    customerName: 'Ibrahim Sule', email: 'ibrahim.sule@example.com', phone: '+2348000000007', location: vi.id,
    service: 'Battery Replacement', vehicleMake: 'Ford', vehicleModel: 'Explorer', vehicleRegistration: 'VIC998KL',
    dateOfService: daysAgo(10), rating: 3, severity: 'Mildly Concerned',
    feedbackText: 'New battery installed but nobody explained the warranty.', complaint: 'I was not given any warranty documentation for the new battery.',
    requestedResolution: 'Please send me the warranty details.', source: 'Manual Entry', submittedAt: daysAgo(10),
  },
  {
    customerName: 'Chioma Nnamdi', email: 'chioma.nnamdi@example.com', phone: '+2348000000008', location: ikeja.id,
    service: 'Wheel Alignment', vehicleMake: 'Hyundai', vehicleModel: 'Tucson', vehicleRegistration: 'IKJ223MN',
    dateOfService: daysAgo(1), rating: 5, severity: 'Positive',
    feedbackText: 'Car drives so much smoother now. Great work!', complaint: null,
    requestedResolution: null, source: 'Google', submittedAt: daysAgo(1),
  },
  {
    customerName: 'Peter Nwachukwu', email: 'peter.nwachukwu@example.com', phone: '+2348000000009', location: lekki.id,
    service: 'Brake Repair', vehicleMake: 'Nissan', vehicleModel: 'Pathfinder', vehicleRegistration: 'LKK556OP',
    dateOfService: daysAgo(0), rating: 1, severity: 'Very Angry',
    feedbackText: 'Brakes are squeaking badly and it is dangerous.', complaint: 'This is the second time this month the brakes have failed after service. This is dangerous and unacceptable.',
    requestedResolution: 'I need this looked at today, this is a safety issue.', source: 'n8n', externalId: 'FB-DEMO-000131', submittedAt: daysAgo(0),
  },
  {
    customerName: 'Halima Yusuf', email: 'halima.yusuf@example.com', phone: '+2348000000010', location: yaba.id,
    service: 'Oil Change', vehicleMake: 'Toyota', vehicleModel: 'Corolla', vehicleRegistration: 'YAB778QR',
    dateOfService: daysAgo(15), rating: 4, severity: 'Positive',
    feedbackText: 'Quick and friendly service as always.', complaint: null,
    requestedResolution: null, source: 'Website', submittedAt: daysAgo(15),
  },
  {
    customerName: 'David Okon', email: 'david.okon@example.com', phone: '+2348000000011', location: abuja.id,
    service: 'Engine Diagnostics', vehicleMake: 'Honda', vehicleModel: 'CR-V', vehicleRegistration: 'ABJ334ST',
    dateOfService: daysAgo(12), rating: 2, severity: 'Unhappy',
    feedbackText: 'Diagnostic report was unclear and technician was rude.', complaint: 'The technician was dismissive when I asked questions about the diagnostic results.',
    requestedResolution: 'An apology and a clearer explanation of the report.', source: 'Email', submittedAt: daysAgo(12),
  },
  {
    customerName: 'Blessing Eze', email: 'blessing.eze@example.com', phone: '+2348000000012', location: vi.id,
    service: 'Full Service', vehicleMake: 'Lexus', vehicleModel: 'ES350', vehicleRegistration: 'VIC445UV',
    dateOfService: daysAgo(20), rating: 5, severity: 'Positive',
    feedbackText: 'Best car care experience in Lagos. Highly recommend!', complaint: null,
    requestedResolution: null, source: 'Google', submittedAt: daysAgo(20),
  },
];

const createdFeedback = feedbackSeeds.map((f) => createFeedbackRecord(f));

function getIssueForCustomer(name) {
  const rec = createdFeedback.find((r) => r.feedback.customer_name === name);
  return rec?.issue || null;
}

function assignIssue(issue, manager) {
  db.prepare(`UPDATE issues SET assigned_manager_id = ?, status = 'Assigned', updated_at = datetime('now') WHERE id = ?`).run(
    manager.id,
    issue.id
  );
}

function addNote(issue, user, note) {
  db.prepare('INSERT INTO internal_notes (id, issue_id, user_id, user_name, note) VALUES (?,?,?,?,?)').run(
    newId(), issue.id, user.id, user.name, note
  );
}

function addComment(issue, user, body) {
  db.prepare('INSERT INTO comments (id, issue_id, user_id, user_name, body) VALUES (?,?,?,?,?)').run(
    newId(), issue ? issue.id : null, user.id, user.name, body
  );
}

function setStatus(issue, status, closed) {
  db.prepare(`UPDATE issues SET status = ?, updated_at = datetime('now'), closed_at = ? WHERE id = ?`).run(
    status, closed ? new Date().toISOString() : null, issue.id
  );
}

function setResolution(issue, resolution) {
  db.prepare(`UPDATE issues SET resolution = ?, status = 'Resolved', closed_at = datetime('now') WHERE id = ?`).run(
    resolution, issue.id
  );
}

function addActionItem(issue, title, assignedTo, status = 'Pending') {
  db.prepare(
    'INSERT INTO action_items (id, issue_id, title, assigned_to, status, created_by) VALUES (?,?,?,?,?,?)'
  ).run(newId(), issue.id, title, assignedTo, status, ops.id);
}

const johnIssue = getIssueForCustomer('John Doe');
if (johnIssue) {
  assignIssue(johnIssue, lekkiManager);
  addNote(johnIssue, lekkiManager, 'Technician re-inspected the brake pads, found an installation defect.');
  addComment(johnIssue, ops, 'Brake complaint from Lekki has been inspected. Technician identified the issue.');
  addComment(johnIssue, gm, 'Please make sure the customer is contacted after the repair.');
  setStatus(johnIssue, 'In Progress', false);
  addActionItem(johnIssue, 'Call customer to confirm re-inspection appointment', lekkiManager.id, 'Completed');
  addActionItem(johnIssue, 'Provide 20% discount voucher for the inconvenience', csManager.id);
}

const michaelIssue = getIssueForCustomer('Michael Obi');
if (michaelIssue) {
  assignIssue(michaelIssue, ikejaManager);
  addNote(michaelIssue, ikejaManager, 'Escalated to senior technician for a full diagnostic re-run.');
  setStatus(michaelIssue, 'Under Review', false);
}

const peterIssue = getIssueForCustomer('Peter Nwachukwu');
if (peterIssue) {
  assignIssue(peterIssue, lekkiManager);
  addNote(peterIssue, lekkiManager, 'Safety issue — vehicle recalled for immediate inspection.');
  setStatus(peterIssue, 'In Progress', false);
}

const funkeIssue = getIssueForCustomer('Funke Ajayi');
if (funkeIssue) {
  assignIssue(funkeIssue, lekkiManager);
  addComment(funkeIssue, lekkiManager, 'Repair completed and vehicle tested. Interior redone at no cost.');
  setResolution(funkeIssue, 'Vehicle interior was re-cleaned free of charge. Customer confirmed satisfaction over the phone.');
}

const ibrahimIssue = getIssueForCustomer('Ibrahim Sule');
if (ibrahimIssue) {
  assignIssue(ibrahimIssue, viManager);
  setResolution(ibrahimIssue, 'Warranty documentation emailed to the customer.');
  setStatus(ibrahimIssue, 'Closed', true);
}

const davidIssue = getIssueForCustomer('David Okon');
if (davidIssue) {
  assignIssue(davidIssue, ops);
  addNote(davidIssue, ops, 'Spoke with technician involved; retraining scheduled on customer communication.');
  setStatus(davidIssue, 'Waiting for Customer', false);
}

addComment(null, gm, 'Great numbers across all locations this week — keep up the good work team.');
addComment(null, ops, 'Reminder: all critical complaints must be acknowledged within 2 hours.');

const positiveFeedback = createdFeedback.filter((r) => r.feedback.severity === 'Positive');
const insertReview = db.prepare(
  'INSERT INTO reviews (id, feedback_id, customer_name, location_id, rating, review_text, status, featured) VALUES (?,?,?,?,?,?,?,?)'
);
positiveFeedback.forEach((r, idx) => {
  insertReview.run(
    newId(),
    r.feedback.id,
    r.feedback.customer_name,
    r.feedback.location_id,
    r.feedback.rating,
    r.feedback.feedback_text,
    idx < 3 ? 'Approved' : 'Pending',
    idx === 0 ? 1 : 0
  );
});

console.log('Seed complete.');
console.log(`Locations: ${locations.length}, Feedback: ${createdFeedback.length}`);
