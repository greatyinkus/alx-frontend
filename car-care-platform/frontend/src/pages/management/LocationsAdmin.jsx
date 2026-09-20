import { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import Modal from '../../components/Modal';

export default function LocationsAdmin() {
  const { reloadLocations } = useOutletContext();
  const { user } = useAuth();
  const [locations, setLocations] = useState([]);
  const [users, setUsers] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: '', address: '', contact: '', managerId: '' });
  const [busy, setBusy] = useState(false);

  const canManage = ['Super Admin', 'General Manager'].includes(user?.role);

  const load = () => {
    api.get('/locations').then((res) => setLocations(res.data.locations));
    api.get('/users').then((res) => setUsers(res.data.users));
  };

  useEffect(() => { load(); }, []);

  const addLocation = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await api.post('/locations', form);
      setShowAdd(false);
      setForm({ name: '', address: '', contact: '', managerId: '' });
      load();
      reloadLocations?.();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center">
        <div>
          <h1>Locations</h1>
          <p className="text-muted" style={{ fontSize: '0.88rem' }}>All company branches. Add as many as you need — no limit.</p>
        </div>
        {canManage && <button className="btn btn-primary" onClick={() => setShowAdd(true)}>+ Add Location</button>}
      </div>

      <div className="grid grid-3 mt-16">
        {locations.map((l) => (
          <div key={l.id} className="card card-pad">
            <div className="flex justify-between items-center">
              <h3>{l.name}</h3>
              <span className={`badge ${l.status === 'Active' ? 'badge-Positive' : 'badge-Low'}`}>{l.status}</span>
            </div>
            <p className="text-muted mt-8" style={{ fontSize: '0.85rem' }}>{l.address || 'No address on file'}</p>
            <p className="mt-8" style={{ fontSize: '0.85rem' }}>Manager: {l.manager_name || 'Unassigned'}</p>
            <div className="flex gap-12 mt-16">
              <div><strong>{l.feedback_count}</strong><div className="text-muted" style={{ fontSize: '0.74rem' }}>Feedback</div></div>
              <div><strong>{l.open_issue_count}</strong><div className="text-muted" style={{ fontSize: '0.74rem' }}>Open Issues</div></div>
            </div>
          </div>
        ))}
      </div>

      {showAdd && (
        <Modal title="Add New Location" onClose={() => setShowAdd(false)}>
          <form onSubmit={addLocation}>
            <div className="field">
              <label>Location Name</label>
              <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="field">
              <label>Address</label>
              <input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
            </div>
            <div className="field">
              <label>Contact</label>
              <input value={form.contact} onChange={(e) => setForm({ ...form, contact: e.target.value })} />
            </div>
            <div className="field">
              <label>Manager</label>
              <select value={form.managerId} onChange={(e) => setForm({ ...form, managerId: e.target.value })}>
                <option value="">Unassigned</option>
                {users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            </div>
            <button className="btn btn-primary btn-block" disabled={busy}>Save Location</button>
          </form>
        </Modal>
      )}
    </div>
  );
}
