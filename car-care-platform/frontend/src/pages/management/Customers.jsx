import { useEffect, useState } from 'react';
import api from '../../api/client';
import Modal from '../../components/Modal';
import { SeverityBadge } from '../../components/Badge';
import { formatDate, timeAgo } from '../../utils/format';

export default function Customers() {
  const [search, setSearch] = useState('');
  const [customers, setCustomers] = useState([]);
  const [selected, setSelected] = useState(null);
  const [detail, setDetail] = useState(null);

  useEffect(() => {
    const t = setTimeout(() => {
      api.get('/customers', { params: { search: search || undefined } }).then((res) => setCustomers(res.data.customers));
    }, 250);
    return () => clearTimeout(t);
  }, [search]);

  const open = (c) => {
    setSelected(c);
    api.get(`/customers/${c.id}`).then((res) => setDetail(res.data));
  };

  return (
    <div>
      <h1>Customers</h1>
      <p className="text-muted" style={{ fontSize: '0.88rem' }}>Every customer who has interacted with the company across all locations.</p>

      <div className="toolbar mt-16">
        <input className="search-input" placeholder="Search customers by name, email, phone…" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <div className="card">
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr><th>Name</th><th>Email</th><th>Phone</th><th>Feedback Count</th><th>Avg Rating</th><th>Since</th></tr>
            </thead>
            <tbody>
              {customers.map((c) => (
                <tr key={c.id} onClick={() => open(c)} style={{ cursor: 'pointer' }}>
                  <td style={{ fontWeight: 700 }}>{c.name}</td>
                  <td>{c.email || '—'}</td>
                  <td>{c.phone || '—'}</td>
                  <td>{c.feedback_count}</td>
                  <td>{c.avg_rating ? Number(c.avg_rating).toFixed(1) : '—'}</td>
                  <td>{formatDate(c.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {customers.length === 0 && <div className="empty-state">No customers found.</div>}
        </div>
      </div>

      {selected && (
        <Modal title={selected.name} onClose={() => { setSelected(null); setDetail(null); }}>
          <p className="text-muted" style={{ fontSize: '0.85rem' }}>{selected.email} · {selected.phone}</p>
          <h4 className="mt-16">Feedback History</h4>
          <div className="mt-8">
            {detail?.feedback?.map((f) => (
              <div key={f.id} className="list-row" style={{ padding: '10px 0' }}>
                <div>
                  <div className="primary">{f.feedback_code} · {f.location_name}</div>
                  <div className="secondary">{f.service_name} · {timeAgo(f.submitted_at)}</div>
                </div>
                <SeverityBadge value={f.severity} />
              </div>
            ))}
            {detail && detail.feedback.length === 0 && <div className="empty-state">No feedback history.</div>}
          </div>
          <button className="btn btn-outline btn-block mt-16" onClick={() => { setSelected(null); setDetail(null); }}>Close</button>
        </Modal>
      )}
    </div>
  );
}
