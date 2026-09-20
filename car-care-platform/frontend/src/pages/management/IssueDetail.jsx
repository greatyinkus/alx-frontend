import { useCallback, useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../api/client';
import { useSocket } from '../../context/SocketContext';
import { SeverityBadge, PriorityBadge, StatusBadge } from '../../components/Badge';
import { formatDate, formatDateTime, timeAgo, initials } from '../../utils/format';

const STATUSES = ['New', 'Under Review', 'Assigned', 'In Progress', 'Waiting for Customer', 'Resolved', 'Closed'];
const PRIORITIES = ['Low', 'Medium', 'High', 'Critical'];

export default function IssueDetail() {
  const { id } = useParams();
  const { socket } = useSocket();
  const [data, setData] = useState(null);
  const [users, setUsers] = useState([]);
  const [tab, setTab] = useState('timeline');
  const [commentText, setCommentText] = useState('');
  const [noteText, setNoteText] = useState('');
  const [resolutionText, setResolutionText] = useState('');
  const [actionTitle, setActionTitle] = useState('');
  const [actionAssignee, setActionAssignee] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    api.get(`/issues/${id}`).then((res) => setData(res.data));
  }, [id]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { api.get('/users').then((res) => setUsers(res.data.users)); }, []);

  useEffect(() => {
    if (!socket) return undefined;
    const refresh = () => load();
    socket.on('comment:new', refresh);
    socket.on('activity:new', refresh);
    return () => {
      socket.off('comment:new', refresh);
      socket.off('activity:new', refresh);
    };
  }, [socket, load]);

  if (!data) return <div className="empty-state">Loading…</div>;
  const { issue, comments, notes, actionItems, timeline, attachments } = data;

  const run = async (fn) => {
    setBusy(true);
    try { await fn(); await load(); } finally { setBusy(false); }
  };

  const assign = (managerId) => run(() => api.patch(`/issues/${id}/assign`, { managerId: managerId || null }));
  const changeStatus = (status) => run(() => api.patch(`/issues/${id}/status`, { status }));
  const changePriority = (priority) => run(() => api.patch(`/issues/${id}/priority`, { priority }));
  const submitComment = (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    run(async () => {
      await api.post('/comments', { body: commentText, issueId: id });
      setCommentText('');
    });
  };
  const submitNote = (e) => {
    e.preventDefault();
    if (!noteText.trim()) return;
    run(async () => {
      await api.post(`/issues/${id}/notes`, { note: noteText });
      setNoteText('');
    });
  };
  const submitResolution = (e) => {
    e.preventDefault();
    if (!resolutionText.trim()) return;
    run(async () => {
      await api.post(`/issues/${id}/resolution`, { resolution: resolutionText });
      setResolutionText('');
    });
  };
  const submitActionItem = (e) => {
    e.preventDefault();
    if (!actionTitle.trim()) return;
    run(async () => {
      await api.post(`/issues/${id}/action-items`, { title: actionTitle, assignedTo: actionAssignee || null });
      setActionTitle('');
      setActionAssignee('');
    });
  };
  const completeAction = (itemId) => run(() => api.patch(`/issues/action-items/${itemId}/complete`));
  const closeIssue = () => run(() => api.post(`/issues/${id}/close`));

  return (
    <div>
      <Link to="/app/issues" className="text-muted" style={{ fontSize: '0.85rem' }}>← Back to Issues</Link>

      <div className="flex justify-between items-center mt-16" style={{ flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1>{issue.issue_code}</h1>
          <p className="text-muted mt-8" style={{ fontSize: '0.88rem' }}>{issue.customer_name} · {issue.location_name || 'No location'}</p>
        </div>
        <div className="flex gap-8">
          <SeverityBadge value={issue.severity} />
          <PriorityBadge value={issue.priority} />
          <StatusBadge value={issue.status} />
        </div>
      </div>

      <div className="two-col mt-24">
        <div>
          <div className="card card-pad">
            <h3>Customer, Vehicle & Service</h3>
            <dl className="detail-grid mt-16">
              <dt>Customer</dt><dd>{issue.customer_name}</dd>
              <dt>Email</dt><dd>{issue.customer_email || '—'}</dd>
              <dt>Phone</dt><dd>{issue.customer_phone || '—'}</dd>
              <dt>Location</dt><dd>{issue.location_name || '—'}</dd>
              <dt>Service</dt><dd>{issue.service_name || '—'}</dd>
              <dt>Vehicle</dt><dd>{[issue.vehicle_make, issue.vehicle_model].filter(Boolean).join(' ') || '—'}</dd>
              <dt>Registration</dt><dd>{issue.vehicle_registration || '—'}</dd>
              <dt>Rating</dt><dd>{issue.rating ? `${issue.rating}/5` : '—'}</dd>
              <dt>Source</dt><dd>{issue.source || '—'}</dd>
              <dt>Created</dt><dd>{formatDate(issue.created_at)}</dd>
            </dl>

            <h3 className="mt-24">Description</h3>
            <p className="mt-8" style={{ fontSize: '0.9rem' }}>{issue.description}</p>

            {issue.requested_resolution && (
              <>
                <h3 className="mt-24">Customer Requested</h3>
                <p className="mt-8" style={{ fontSize: '0.9rem' }}>{issue.requested_resolution}</p>
              </>
            )}

            {issue.resolution && (
              <>
                <h3 className="mt-24">Resolution</h3>
                <p className="mt-8" style={{ fontSize: '0.9rem' }}>{issue.resolution}</p>
              </>
            )}
          </div>

          <div className="card mt-24">
            <div className="tabs" style={{ padding: '0 20px', marginTop: 12 }}>
              <button className={tab === 'timeline' ? 'active' : ''} onClick={() => setTab('timeline')}>Activity Timeline</button>
              <button className={tab === 'discussion' ? 'active' : ''} onClick={() => setTab('discussion')}>Discussion ({comments.length})</button>
              <button className={tab === 'notes' ? 'active' : ''} onClick={() => setTab('notes')}>Internal Notes ({notes.length})</button>
              <button className={tab === 'actions' ? 'active' : ''} onClick={() => setTab('actions')}>Action Items ({actionItems.length})</button>
            </div>
            <div className="panel-body" style={{ padding: '0 20px 20px' }}>
              {tab === 'timeline' && (
                <div className="timeline mt-16">
                  {timeline.map((t) => (
                    <div key={t.id} className="timeline-item">
                      <div className="when">{formatDateTime(t.created_at)} · {t.actor_name}</div>
                      <div className="desc">{t.description}</div>
                    </div>
                  ))}
                  {timeline.length === 0 && <div className="empty-state">No activity yet.</div>}
                </div>
              )}

              {tab === 'discussion' && (
                <div className="mt-16">
                  <form onSubmit={submitComment} className="mt-8">
                    <div className="field">
                      <textarea rows={2} placeholder="Post an update or @mention a teammate…" value={commentText} onChange={(e) => setCommentText(e.target.value)} />
                    </div>
                    <button className="btn btn-primary btn-sm" disabled={busy}>Post</button>
                  </form>
                  <div className="mt-16">
                    {comments.map((c) => (
                      <div key={c.id} className="comment">
                        <div className="avatar">{initials(c.user_name)}</div>
                        <div>
                          <span className="who">{c.user_name}</span>
                          <span className="when">{timeAgo(c.created_at)}</span>
                          <div className="body">{c.body}</div>
                        </div>
                      </div>
                    ))}
                    {comments.length === 0 && <div className="empty-state">No discussion yet — start the conversation.</div>}
                  </div>
                </div>
              )}

              {tab === 'notes' && (
                <div className="mt-16">
                  <form onSubmit={submitNote}>
                    <div className="field">
                      <textarea rows={2} placeholder="Add an internal note (not visible to the customer)…" value={noteText} onChange={(e) => setNoteText(e.target.value)} />
                    </div>
                    <button className="btn btn-primary btn-sm" disabled={busy}>Add Note</button>
                  </form>
                  <div className="mt-16">
                    {notes.map((n) => (
                      <div key={n.id} className="comment">
                        <div className="avatar">{initials(n.user_name)}</div>
                        <div>
                          <span className="who">{n.user_name}</span>
                          <span className="when">{timeAgo(n.created_at)}</span>
                          <div className="body">{n.note}</div>
                        </div>
                      </div>
                    ))}
                    {notes.length === 0 && <div className="empty-state">No internal notes yet.</div>}
                  </div>
                </div>
              )}

              {tab === 'actions' && (
                <div className="mt-16">
                  <form onSubmit={submitActionItem} className="field-row">
                    <div className="field">
                      <input placeholder="New action item…" value={actionTitle} onChange={(e) => setActionTitle(e.target.value)} />
                    </div>
                    <div className="field">
                      <select value={actionAssignee} onChange={(e) => setActionAssignee(e.target.value)}>
                        <option value="">Unassigned</option>
                        {users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
                      </select>
                    </div>
                    <button className="btn btn-primary btn-sm" style={{ height: 42 }} disabled={busy}>Add</button>
                  </form>
                  <div className="mt-16">
                    {actionItems.map((a) => (
                      <div key={a.id} className="list-row">
                        <div>
                          <div className="primary" style={{ textDecoration: a.status === 'Completed' ? 'line-through' : 'none' }}>{a.title}</div>
                          <div className="secondary">{users.find((u) => u.id === a.assigned_to)?.name || 'Unassigned'}</div>
                        </div>
                        {a.status !== 'Completed' && (
                          <button className="btn btn-outline btn-sm" onClick={() => completeAction(a.id)} disabled={busy}>Mark Complete</button>
                        )}
                        {a.status === 'Completed' && <span className="badge badge-Positive">Done</span>}
                      </div>
                    ))}
                    {actionItems.length === 0 && <div className="empty-state">No action items yet.</div>}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div>
          <div className="card card-pad">
            <h3>Manage This Issue</h3>

            <div className="field mt-16">
              <label>Assigned Manager</label>
              <select value={issue.assigned_manager_id || ''} onChange={(e) => assign(e.target.value)} disabled={busy}>
                <option value="">Unassigned</option>
                {users.map((u) => <option key={u.id} value={u.id}>{u.name} ({u.role})</option>)}
              </select>
            </div>

            <div className="field">
              <label>Status</label>
              <select value={issue.status} onChange={(e) => changeStatus(e.target.value)} disabled={busy}>
                {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            <div className="field">
              <label>Priority</label>
              <select value={issue.priority} onChange={(e) => changePriority(e.target.value)} disabled={busy}>
                {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>

            {issue.status !== 'Closed' && (
              <button className="btn btn-outline btn-block mt-8" onClick={closeIssue} disabled={busy}>Close Issue</button>
            )}
          </div>

          {issue.status !== 'Resolved' && issue.status !== 'Closed' && (
            <div className="card card-pad mt-24">
              <h3>Add Resolution</h3>
              <form onSubmit={submitResolution} className="mt-16">
                <div className="field">
                  <textarea rows={3} placeholder="Describe how this was resolved…" value={resolutionText} onChange={(e) => setResolutionText(e.target.value)} />
                </div>
                <button className="btn btn-primary btn-block" disabled={busy}>Mark Resolved</button>
              </form>
            </div>
          )}

          {attachments?.length > 0 && (
            <div className="card card-pad mt-24">
              <h3>Attachments</h3>
              <ul className="mt-16">
                {attachments.map((a) => (
                  <li key={a.id} className="mt-8"><a href={a.url} target="_blank" rel="noreferrer">{a.filename}</a></li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
