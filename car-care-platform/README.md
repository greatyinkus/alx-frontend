# DriveCare Central

A centralized customer feedback & management platform for a multi-location car care
and auto repair company.

Customers give feedback through the public website, or through **n8n** (WhatsApp,
email, forms, AI classification, etc.). n8n sends structured data to this app through
a secure webhook. Everything — every location, every complaint, every management
action — shows up on **one** central management dashboard.

```
CUSTOMER / EXTERNAL SOURCE → n8n → WEBHOOK → BACKEND API → DATABASE → CENTRAL DASHBOARD → MANAGEMENT TEAM
```

## Project layout

```
car-care-platform/
  backend/    Node.js + Express + SQLite API, JWT auth, Socket.IO realtime, n8n webhook
  frontend/   React (Vite) public website + management dashboard
```

## Running locally

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env   # already generated with random secrets for this checkout
npm run seed            # populate realistic sample data
npm start                # http://localhost:4000
```

Demo management accounts (password for all: `Password123!`):

| Role | Email |
|---|---|
| Super Admin | super@carcare.com |
| General Manager | gm@carcare.com |
| Operations Manager | ops@carcare.com |
| Customer Service Manager | cs@carcare.com |
| Location Manager (Lekki) | lekki.manager@carcare.com |
| Location Manager (Victoria Island) | vi.manager@carcare.com |
| Location Manager (Ikeja) | ikeja.manager@carcare.com |

### 2. Frontend

```bash
cd frontend
npm install
npm run dev   # http://localhost:5173, proxies /api and /socket.io to :4000
```

Visit `http://localhost:5173` for the public site, or `/login` for the management
dashboard.

## The n8n webhook

n8n (or any automation) posts structured feedback here:

```
POST /api/webhooks/n8n/feedback
Authorization: Bearer <N8N_WEBHOOK_SECRET>
Content-Type: application/json

{
  "feedback_id": "FB-2026-000124",
  "customer_name": "John Doe",
  "email": "john@example.com",
  "phone": "+2348000000000",
  "location": "Lekki",
  "service": "Brake Repair",
  "vehicle_make": "Toyota",
  "vehicle_model": "Camry",
  "vehicle_registration": "ABC123XY",
  "rating": 2,
  "severity": "Very Angry",
  "feedback": "The brake problem returned after the repair.",
  "requested_resolution": "I would like the issue inspected again.",
  "source": "n8n",
  "submitted_at": "2026-09-19T10:30:00Z"
}
```

Behaviour:

- `location` may be an existing location's id or name — an unknown name is created
  automatically, so you never need to hard-code locations.
- `severity` accepts `Positive`, `Mildly Concerned`, `Unhappy`, `Very Angry` (case/underscore
  insensitive aliases like `very_angry` also work).
- A complaint or a severity of `Unhappy`/`Very Angry` automatically creates an **Issue**
  with a priority derived from severity (configurable afterwards by management).
- Retrying the same `feedback_id` is idempotent — the existing record is returned with
  `"duplicate": true` instead of creating a second one.
- Missing `customer_name` or an out-of-range `rating` returns `400` with a validation
  error and nothing is written to the database.
- The new feedback/issue appears on the management dashboard immediately via Socket.IO,
  no refresh needed.
- The secret is a plain environment variable (`N8N_WEBHOOK_SECRET` in `backend/.env`) —
  it is never sent to, or readable from, the frontend.

## What's implemented

- Public site: Home, Services, Locations, Customer Reviews, Contact, Give Feedback
  (with the 4-option emotion picker: Positive / Mildly Concerned / Unhappy / Very Angry).
- Secure n8n webhook with bearer-token auth, validation, and idempotency.
- One central management dashboard with an "All Locations" / single-location filter —
  never separate dashboards per branch.
- Feedback Inbox, Issues (with status/priority/assignment), Activity Feed, Management
  Hub (team discussion + @mentions), Customers, Locations (unlimited, configurable),
  Reviews moderation, Reports, Notifications, Team (role-based users), Settings.
- Full activity timeline per issue (who did what, when) built from an `activity_logs`
  table, plus internal notes, comments, and action items.
- Role-based access: Super Admin, General Manager, Operations Manager, Location
  Manager, Customer Service Manager.
- Realtime updates over Socket.IO: new feedback/issues/comments/notifications refresh
  the dashboard and feed without a page reload.
- Seed script with realistic multi-location sample data (open/critical/resolved issues,
  comments, notes, action items, reviews) so the system is testable immediately.
