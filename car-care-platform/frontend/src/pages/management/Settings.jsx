import { useAuth } from '../../context/AuthContext';
import { initials } from '../../utils/format';

const ROLE_PERMISSIONS = {
  'Super Admin': 'Full access to every location, user, and setting.',
  'General Manager': 'Views all locations and all activity across the company.',
  'Operations Manager': 'Manages operational issues and activities company-wide.',
  'Location Manager': 'Manages feedback and issues for their assigned location.',
  'Customer Service Manager': 'Manages customer feedback and customer communication.',
};

export default function Settings() {
  const { user } = useAuth();

  return (
    <div>
      <h1>Settings</h1>
      <p className="text-muted" style={{ fontSize: '0.88rem' }}>Your account and role information.</p>

      <div className="card card-pad mt-16" style={{ maxWidth: 520 }}>
        <div className="flex items-center gap-12">
          <div className="avatar" style={{ width: 52, height: 52, fontSize: '1.1rem' }}>{initials(user?.name)}</div>
          <div>
            <div style={{ fontWeight: 700 }}>{user?.name}</div>
            <div className="text-muted" style={{ fontSize: '0.85rem' }}>{user?.email}</div>
          </div>
        </div>

        <dl className="detail-grid mt-24">
          <dt>Role</dt><dd>{user?.role}</dd>
          <dt>Status</dt><dd>{user?.status}</dd>
        </dl>

        <h3 className="mt-24">What your role can do</h3>
        <p className="mt-8" style={{ fontSize: '0.88rem' }}>{ROLE_PERMISSIONS[user?.role]}</p>
      </div>

      <div className="card card-pad mt-24" style={{ maxWidth: 520 }}>
        <h3>n8n Webhook Integration</h3>
        <p className="text-muted mt-8" style={{ fontSize: '0.85rem' }}>
          n8n sends structured customer feedback to this platform via a secure webhook. Configure the workflow
          in n8n to POST to:
        </p>
        <p className="mt-8"><span className="kbd">POST /api/webhooks/n8n/feedback</span></p>
        <p className="text-muted mt-8" style={{ fontSize: '0.85rem' }}>
          Authenticate using an <span className="kbd">Authorization: Bearer &lt;N8N_WEBHOOK_SECRET&gt;</span> header.
          The secret is stored as a server environment variable and is never exposed to the frontend.
        </p>
      </div>
    </div>
  );
}
