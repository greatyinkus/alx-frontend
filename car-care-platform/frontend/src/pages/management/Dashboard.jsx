import { useCallback, useEffect, useState } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import api from '../../api/client';
import { useSocket } from '../../context/SocketContext';
import StatCard from '../../components/StatCard';
import { SeverityBadge, PriorityBadge, StatusBadge } from '../../components/Badge';
import { timeAgo } from '../../utils/format';

export default function Dashboard() {
  const { locationFilter } = useOutletContext();
  const { socket } = useSocket();
  const [stats, setStats] = useState(null);
  const [overview, setOverview] = useState(null);

  const load = useCallback(() => {
    api.get('/dashboard/stats', { params: { location: locationFilter } }).then((res) => setStats(res.data.stats));
    api.get('/dashboard/overview', { params: { location: locationFilter } }).then((res) => setOverview(res.data));
  }, [locationFilter]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!socket) return undefined;
    const refresh = () => load();
    socket.on('dashboard:refresh', refresh);
    socket.on('feedback:new', refresh);
    socket.on('issue:new', refresh);
    socket.on('activity:new', refresh);
    return () => {
      socket.off('dashboard:refresh', refresh);
      socket.off('feedback:new', refresh);
      socket.off('issue:new', refresh);
      socket.off('activity:new', refresh);
    };
  }, [socket, load]);

  return (
    <div>
      <div className="flex justify-between items-center mt-8" style={{ marginBottom: 20 }}>
        <div>
          <h1>Central Management Dashboard</h1>
          <p className="text-muted" style={{ fontSize: '0.88rem' }}>Everything happening across the company, in one place.</p>
        </div>
      </div>

      <div className="stat-grid">
        <StatCard label="Total Feedback" value={stats?.totalFeedback} />
        <StatCard label="Open Issues" value={stats?.openIssues} />
        <StatCard label="New Issues" value={stats?.newIssues} />
        <StatCard label="Critical Issues" value={stats?.criticalIssues} />
        <StatCard label="Unresolved Complaints" value={stats?.unresolvedComplaints} />
        <StatCard label="Resolved Issues" value={stats?.resolvedIssues} />
        <StatCard label="Average Rating" value={stats?.averageRating ? `${stats.averageRating} / 5` : '—'} />
        <StatCard label="Avg. Resolution Time" value={stats?.averageResolutionHours ? `${stats.averageResolutionHours}h` : '—'} />
      </div>

      <div className="two-col">
        <div>
          <div className="card">
            <div className="panel-header">
              <h3>Critical Complaints</h3>
              <Link to="/app/issues?priority=Critical" className="btn btn-ghost btn-sm">View all</Link>
            </div>
            <div className="panel-body">
              {overview?.criticalComplaints?.length ? overview.criticalComplaints.map((i) => (
                <Link to={`/app/issues/${i.id}`} key={i.id} className="list-row">
                  <div>
                    <div className="primary">{i.issue_code} · {i.customer_name}</div>
                    <div className="secondary">{i.location_name || 'Unassigned location'} · {i.description?.slice(0, 60)}</div>
                  </div>
                  <div className="meta">
                    <PriorityBadge value={i.priority} />
                    <div className="mt-8">{timeAgo(i.created_at)}</div>
                  </div>
                </Link>
              )) : <div className="empty-state">No critical complaints right now 🎉</div>}
            </div>
          </div>

          <div className="card mt-24">
            <div className="panel-header">
              <h3>Needs Attention</h3>
              <Link to="/app/issues?status=New" className="btn btn-ghost btn-sm">View all</Link>
            </div>
            <div className="panel-body">
              {overview?.needsAttention?.length ? overview.needsAttention.map((i) => (
                <Link to={`/app/issues/${i.id}`} key={i.id} className="list-row">
                  <div>
                    <div className="primary">{i.issue_code} · {i.customer_name}</div>
                    <div className="secondary">{i.location_name}</div>
                  </div>
                  <div className="meta"><StatusBadge value={i.status} /></div>
                </Link>
              )) : <div className="empty-state">Nothing pending review.</div>}
            </div>
          </div>

          <div className="card mt-24">
            <div className="panel-header">
              <h3>Recent Feedback</h3>
              <Link to="/app/feedback" className="btn btn-ghost btn-sm">View all</Link>
            </div>
            <div className="panel-body">
              {overview?.recentFeedback?.length ? overview.recentFeedback.map((f) => (
                <Link to={`/app/feedback/${f.id}`} key={f.id} className="list-row">
                  <div>
                    <div className="primary">{f.customer_name} · {f.feedback_code}</div>
                    <div className="secondary">{f.location_name || '—'} · {f.service_name || 'General'} · via {f.source}</div>
                  </div>
                  <div className="meta">
                    <SeverityBadge value={f.severity} />
                    <div className="mt-8">{timeAgo(f.submitted_at)}</div>
                  </div>
                </Link>
              )) : <div className="empty-state">No feedback yet.</div>}
            </div>
          </div>

          <div className="card mt-24">
            <div className="panel-header">
              <h3>Recently Resolved</h3>
            </div>
            <div className="panel-body">
              {overview?.recentlyResolved?.length ? overview.recentlyResolved.map((i) => (
                <Link to={`/app/issues/${i.id}`} key={i.id} className="list-row">
                  <div>
                    <div className="primary">{i.issue_code} · {i.customer_name}</div>
                    <div className="secondary">{i.location_name}</div>
                  </div>
                  <div className="meta"><StatusBadge value={i.status} /></div>
                </Link>
              )) : <div className="empty-state">Nothing resolved yet.</div>}
            </div>
          </div>
        </div>

        <div>
          <div className="card">
            <div className="panel-header"><h3>Live Activity</h3></div>
            <div className="panel-body">
              {overview?.recentActivity?.length ? overview.recentActivity.map((a) => (
                <div key={a.id} className="feed-item">
                  <div className="feed-dot">•</div>
                  <div className="feed-content">
                    <div className="desc">{a.description}</div>
                    <div className="time">{timeAgo(a.created_at)}</div>
                  </div>
                </div>
              )) : <div className="empty-state">No activity yet.</div>}
            </div>
          </div>

          <div className="card mt-24">
            <div className="panel-header"><h3>Pending Action Items</h3></div>
            <div className="panel-body">
              {overview?.pendingActionItems?.length ? overview.pendingActionItems.map((a) => (
                <div key={a.id} className="list-row">
                  <div>
                    <div className="primary">{a.title}</div>
                    <div className="secondary">{a.issue_code || 'General'}</div>
                  </div>
                </div>
              )) : <div className="empty-state">No pending action items.</div>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
