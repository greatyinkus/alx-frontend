import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/client';
import { useSocket } from '../../context/SocketContext';
import { initials, timeAgo } from '../../utils/format';

export default function ManagementHub() {
  const { socket } = useSocket();
  const [comments, setComments] = useState([]);
  const [body, setBody] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    api.get('/comments').then((res) => setComments(res.data.comments));
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!socket) return undefined;
    socket.on('comment:new', load);
    return () => socket.off('comment:new', load);
  }, [socket, load]);

  const submit = async (e) => {
    e.preventDefault();
    if (!body.trim()) return;
    setBusy(true);
    try {
      await api.post('/comments', { body });
      setBody('');
      load();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <h1>Management Hub</h1>
      <p className="text-muted" style={{ fontSize: '0.88rem' }}>
        The collaboration space for the whole management team. Post updates, discuss issues, and use @name to mention a teammate.
      </p>

      <div className="card card-pad mt-16">
        <form onSubmit={submit}>
          <div className="field">
            <textarea rows={3} placeholder="Share an update with the management team…" value={body} onChange={(e) => setBody(e.target.value)} />
          </div>
          <button className="btn btn-primary" disabled={busy}>Post Update</button>
        </form>
      </div>

      <div className="card mt-24">
        <div className="panel-header"><h3>Team Discussion</h3></div>
        <div className="panel-body" style={{ padding: '8px 20px' }}>
          {comments.map((c) => (
            <div key={c.id} className="comment">
              <div className="avatar">{initials(c.user_name)}</div>
              <div>
                <span className="who">{c.user_name}</span>
                <span className="when">{timeAgo(c.created_at)}</span>
                {c.issue_code && (
                  <div className="mt-8">
                    <Link to={`/app/issues/${c.issue_id}`} className="badge badge-status">{c.issue_code}</Link>
                  </div>
                )}
                <div className="body">{c.body}</div>
              </div>
            </div>
          ))}
          {comments.length === 0 && <div className="empty-state">No management updates yet. Be the first to post.</div>}
        </div>
      </div>
    </div>
  );
}
