import { useEffect, useState } from 'react';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import Modal from '../../components/Modal';

const ROLES = ['Super Admin', 'General Manager', 'Operations Manager', 'Location Manager', 'Customer Service Manager'];

export default function Team() {
  const { user: me } = useAuth();
  const [users, setUsers] = useState([]);
  const [locations, setLocations] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'Location Manager', locationId: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const load = () => {
    api.get('/users').then((res) => setUsers(res.data.users));
    api.get('/locations').then((res) => setLocations(res.data.locations));
  };

  useEffect(() => { load(); }, []);

  const canManage = me?.role === 'Super Admin';

  const addUser = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await api.post('/users', form);
      setShowAdd(false);
      setForm({ name: '', email: '', password: '', role: 'Location Manager', locationId: '' });
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add user');
    } finally {
      setBusy(false);
    }
  };

  const toggleStatus = (u) => api.patch(`/users/${u.id}`, { status: u.status === 'Active' ? 'Inactive' : 'Active' }).then(load);

  return (
    <div>
      <div className="flex justify-between items-center">
        <div>
          <h1>Team</h1>
          <p className="text-muted" style={{ fontSize: '0.88rem' }}>Manage roles and access for the management team.</p>
        </div>
        {canManage && <button className="btn btn-primary" onClick={() => setShowAdd(true)}>+ Add Team Member</button>}
      </div>

      <div className="card mt-16">
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr><th>Name</th><th>Email</th><th>Role</th><th>Location</th><th>Status</th>{canManage && <th></th>}</tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td style={{ fontWeight: 700 }}>{u.name}</td>
                  <td>{u.email}</td>
                  <td>{u.role}</td>
                  <td>{u.location_name || '—'}</td>
                  <td><span className={`badge ${u.status === 'Active' ? 'badge-Positive' : 'badge-Low'}`}>{u.status}</span></td>
                  {canManage && (
                    <td><button className="btn btn-ghost btn-sm" onClick={() => toggleStatus(u)}>{u.status === 'Active' ? 'Deactivate' : 'Activate'}</button></td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showAdd && (
        <Modal title="Add Team Member" onClose={() => setShowAdd(false)}>
          {error && <div className="alert alert-error">{error}</div>}
          <form onSubmit={addUser}>
            <div className="field">
              <label>Full Name</label>
              <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="field">
              <label>Email</label>
              <input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div className="field">
              <label>Temporary Password</label>
              <input type="text" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
            </div>
            <div className="field">
              <label>Role</label>
              <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            {form.role === 'Location Manager' && (
              <div className="field">
                <label>Assigned Location</label>
                <select value={form.locationId} onChange={(e) => setForm({ ...form, locationId: e.target.value })}>
                  <option value="">Select a location</option>
                  {locations.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
                </select>
              </div>
            )}
            <button className="btn btn-primary btn-block" disabled={busy}>Add Team Member</button>
          </form>
        </Modal>
      )}
    </div>
  );
}
