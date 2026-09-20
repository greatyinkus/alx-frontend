import { useState } from 'react';
import { useNavigate, Link, Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function Login() {
  const { login, user, loading } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!loading && user) return <Navigate to="/app" replace />;

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await login(email, password);
      navigate('/app');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <div className="brand">
          <span className="brand-mark" style={{ background: '#d64545' }}>DC</span> DriveCare Central
        </div>
        <h1>Management Login</h1>
        <p className="sub">Sign in to access the centralized management dashboard.</p>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={submit}>
          <div className="field">
            <label>Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus />
          </div>
          <div className="field">
            <label>Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          <button className="btn btn-primary btn-block" disabled={submitting}>
            {submitting ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        <div className="demo-accounts">
          <strong>Demo accounts</strong> (password: <code>Password123!</code>)
          <div className="mt-8">super@carcare.com · Super Admin</div>
          <div>gm@carcare.com · General Manager</div>
          <div>ops@carcare.com · Operations Manager</div>
          <div>lekki.manager@carcare.com · Location Manager</div>
          <div>cs@carcare.com · Customer Service Manager</div>
        </div>

        <p className="text-muted mt-16" style={{ fontSize: '0.82rem', textAlign: 'center' }}>
          <Link to="/">← Back to website</Link>
        </p>
      </div>
    </div>
  );
}
