import { useCallback, useEffect, useState } from 'react';
import api from '../../api/client';

const RANGES = {
  Today: () => [new Date().toISOString().slice(0, 10), null],
  'This Week': () => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return [d.toISOString(), null];
  },
  'This Month': () => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return [d.toISOString(), null];
  },
  'Last 3 Months': () => {
    const d = new Date();
    d.setMonth(d.getMonth() - 3);
    return [d.toISOString(), null];
  },
  'All Time': () => [null, null],
};

function Bar({ label, count, max }) {
  const pct = max ? Math.max(6, Math.round((count / max) * 100)) : 0;
  return (
    <div className="mt-8">
      <div className="flex justify-between" style={{ fontSize: '0.82rem' }}>
        <span>{label}</span><strong>{count}</strong>
      </div>
      <div style={{ background: '#eef0f4', borderRadius: 6, height: 8, marginTop: 4 }}>
        <div style={{ width: `${pct}%`, background: 'var(--color-accent)', height: 8, borderRadius: 6 }} />
      </div>
    </div>
  );
}

export default function ReportsPage() {
  const [range, setRange] = useState('This Month');
  const [data, setData] = useState(null);

  const load = useCallback(() => {
    const [from, to] = RANGES[range]();
    api.get('/reports/summary', { params: { from, to } }).then((res) => setData(res.data));
  }, [range]);

  useEffect(() => { load(); }, [load]);

  if (!data) return <div className="empty-state">Loading reports…</div>;

  const maxLocation = Math.max(1, ...data.byLocation.map((r) => r.count));
  const maxService = Math.max(1, ...data.byService.map((r) => r.count));
  const maxSeverity = Math.max(1, ...data.bySeverity.map((r) => r.count));

  return (
    <div>
      <div className="flex justify-between items-center">
        <h1>Reports</h1>
        <select value={range} onChange={(e) => setRange(e.target.value)}>
          {Object.keys(RANGES).map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
      </div>

      <div className="grid grid-2 mt-16">
        <div className="card card-pad">
          <h3>Feedback by Location</h3>
          {data.byLocation.map((r) => <Bar key={r.location} label={r.location || 'Unknown'} count={r.count} max={maxLocation} />)}
          {data.byLocation.length === 0 && <p className="empty-state">No data.</p>}
        </div>

        <div className="card card-pad">
          <h3>Feedback by Service</h3>
          {data.byService.map((r) => <Bar key={r.service} label={r.service} count={r.count} max={maxService} />)}
          {data.byService.length === 0 && <p className="empty-state">No data.</p>}
        </div>

        <div className="card card-pad">
          <h3>Complaints by Severity</h3>
          {data.bySeverity.map((r) => <Bar key={r.severity} label={r.severity} count={r.count} max={maxSeverity} />)}
        </div>

        <div className="card card-pad">
          <h3>Feedback by Source</h3>
          {data.bySource.map((r) => <Bar key={r.source} label={r.source} count={r.count} max={Math.max(1, ...data.bySource.map((x) => x.count))} />)}
        </div>

        <div className="card card-pad">
          <h3>Open vs Resolved Issues</h3>
          <div className="stat-grid" style={{ gridTemplateColumns: '1fr 1fr', marginTop: 12 }}>
            <div className="stat-card" style={{ border: 'none', boxShadow: 'none', background: '#f7f8fa' }}>
              <div className="stat-label">Open</div>
              <div className="stat-value">{data.openVsResolved.open || 0}</div>
            </div>
            <div className="stat-card" style={{ border: 'none', boxShadow: 'none', background: '#f7f8fa' }}>
              <div className="stat-label">Resolved</div>
              <div className="stat-value">{data.openVsResolved.resolved || 0}</div>
            </div>
          </div>
        </div>

        <div className="card card-pad">
          <h3>Management Activity</h3>
          {data.managementActivity.map((r) => (
            <div key={r.actor_name} className="list-row" style={{ padding: '8px 0' }}>
              <span>{r.actor_name}</span><strong>{r.count}</strong>
            </div>
          ))}
          {data.managementActivity.length === 0 && <p className="empty-state">No activity yet.</p>}
        </div>
      </div>
    </div>
  );
}
