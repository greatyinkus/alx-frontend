import { useCallback, useEffect, useState } from 'react';
import { useOutletContext, useSearchParams, Link } from 'react-router-dom';
import api from '../../api/client';
import { useSocket } from '../../context/SocketContext';
import { SeverityBadge, PriorityBadge, StatusBadge } from '../../components/Badge';
import { timeAgo } from '../../utils/format';

const STATUSES = ['New', 'Under Review', 'Assigned', 'In Progress', 'Waiting for Customer', 'Resolved', 'Closed'];
const PRIORITIES = ['Low', 'Medium', 'High', 'Critical'];

export default function Issues() {
  const { locationFilter } = useOutletContext();
  const { socket } = useSocket();
  const [searchParams, setSearchParams] = useSearchParams();
  const [status, setStatus] = useState(searchParams.get('status') || 'all');
  const [priority, setPriority] = useState(searchParams.get('priority') || 'all');
  const [search, setSearch] = useState('');
  const [issues, setIssues] = useState([]);

  const load = useCallback(() => {
    api
      .get('/issues', { params: { location: locationFilter, status, priority, search: search || undefined } })
      .then((res) => setIssues(res.data.issues));
  }, [locationFilter, status, priority, search]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!socket) return undefined;
    socket.on('issue:new', load);
    return () => socket.off('issue:new', load);
  }, [socket, load]);

  useEffect(() => {
    setSearchParams((prev) => {
      const p = new URLSearchParams(prev);
      status === 'all' ? p.delete('status') : p.set('status', status);
      priority === 'all' ? p.delete('priority') : p.set('priority', priority);
      return p;
    }, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, priority]);

  return (
    <div>
      <h1>Issues</h1>
      <p className="text-muted" style={{ fontSize: '0.88rem' }}>Every complaint that needs management action, across all locations.</p>

      <div className="toolbar mt-16">
        <input className="search-input" placeholder="Search by issue code, customer, description…" value={search} onChange={(e) => setSearch(e.target.value)} />
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="all">All Statuses</option>
          {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={priority} onChange={(e) => setPriority(e.target.value)}>
          <option value="all">All Priorities</option>
          {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
      </div>

      <div className="card">
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Issue</th>
                <th>Customer</th>
                <th>Location</th>
                <th>Severity</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Assigned To</th>
                <th>Updated</th>
              </tr>
            </thead>
            <tbody>
              {issues.map((i) => (
                <tr key={i.id}>
                  <td><Link to={`/app/issues/${i.id}`} style={{ fontWeight: 700, color: 'var(--color-blue)' }}>{i.issue_code}</Link></td>
                  <td>{i.customer_name}</td>
                  <td>{i.location_name || '—'}</td>
                  <td><SeverityBadge value={i.severity} /></td>
                  <td><PriorityBadge value={i.priority} /></td>
                  <td><StatusBadge value={i.status} /></td>
                  <td>{i.assigned_manager_name || <span className="text-muted">Unassigned</span>}</td>
                  <td>{timeAgo(i.updated_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {issues.length === 0 && <div className="empty-state">No issues match these filters.</div>}
        </div>
      </div>
    </div>
  );
}
