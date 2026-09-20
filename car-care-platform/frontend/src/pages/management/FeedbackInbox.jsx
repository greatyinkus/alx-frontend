import { useCallback, useEffect, useState } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import api from '../../api/client';
import { useSocket } from '../../context/SocketContext';
import { SeverityBadge, StatusBadge } from '../../components/Badge';
import { timeAgo } from '../../utils/format';

const SEVERITIES = ['Positive', 'Mildly Concerned', 'Unhappy', 'Very Angry'];
const SOURCES = ['Website', 'Google', 'WhatsApp', 'Email', 'n8n', 'Manual Entry', 'Other'];

export default function FeedbackInbox() {
  const { locationFilter, locations } = useOutletContext();
  const { socket } = useSocket();
  const [severity, setSeverity] = useState('all');
  const [source, setSource] = useState('all');
  const [search, setSearch] = useState('');
  const [feedback, setFeedback] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    api
      .get('/feedback', { params: { location: locationFilter, severity, source, search: search || undefined } })
      .then((res) => setFeedback(res.data.feedback))
      .finally(() => setLoading(false));
  }, [locationFilter, severity, source, search]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!socket) return undefined;
    socket.on('feedback:new', load);
    return () => socket.off('feedback:new', load);
  }, [socket, load]);

  return (
    <div>
      <h1>Feedback Inbox</h1>
      <p className="text-muted" style={{ fontSize: '0.88rem' }}>Every customer feedback received across all channels and locations.</p>

      <div className="toolbar mt-16">
        <input className="search-input" placeholder="Search by customer, code, vehicle, service…" value={search} onChange={(e) => setSearch(e.target.value)} />
        <select value={severity} onChange={(e) => setSeverity(e.target.value)}>
          <option value="all">All Severities</option>
          {SEVERITIES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={source} onChange={(e) => setSource(e.target.value)}>
          <option value="all">All Sources</option>
          {SOURCES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <div className="card">
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Feedback</th>
                <th>Customer</th>
                <th>Location</th>
                <th>Service</th>
                <th>Rating</th>
                <th>Severity</th>
                <th>Source</th>
                <th>Issue</th>
                <th>Submitted</th>
              </tr>
            </thead>
            <tbody>
              {feedback.map((f) => (
                <FeedbackRow key={f.id} f={f} />
              ))}
            </tbody>
          </table>
          {!loading && feedback.length === 0 && <div className="empty-state">No feedback matches these filters.</div>}
        </div>
      </div>
    </div>
  );
}

function FeedbackRow({ f }) {
  return (
    <tr>
      <td><Link to={`/app/feedback/${f.id}`} style={{ fontWeight: 700, color: 'var(--color-blue)' }}>{f.feedback_code}</Link></td>
      <td>{f.customer_name}</td>
      <td>{f.location_name || '—'}</td>
      <td>{f.service_name || '—'}</td>
      <td>{f.rating ? `${f.rating}/5` : '—'}</td>
      <td><SeverityBadge value={f.severity} /></td>
      <td>{f.source}</td>
      <td>{f.issue_code ? <Link to={`/app/issues/${f.issue_id}`}><StatusBadge value={f.issue_status} /></Link> : <span className="text-muted">None</span>}</td>
      <td>{timeAgo(f.submitted_at)}</td>
    </tr>
  );
}
