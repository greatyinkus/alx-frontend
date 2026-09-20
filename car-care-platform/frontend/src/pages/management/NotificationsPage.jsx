import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/client';
import { formatDateTime } from '../../utils/format';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);

  const load = useCallback(() => {
    api.get('/notifications').then((res) => setNotifications(res.data.notifications));
  }, []);

  useEffect(() => { load(); }, [load]);

  const markRead = (id) => api.patch(`/notifications/${id}/read`).then(load);
  const markAll = () => api.post('/notifications/read-all').then(load);

  return (
    <div>
      <div className="flex justify-between items-center">
        <h1>Notifications</h1>
        <button className="btn btn-outline btn-sm" onClick={markAll}>Mark all as read</button>
      </div>

      <div className="card mt-16">
        <div className="panel-body">
          {notifications.map((n) => (
            <div key={n.id} className={`notif-item ${n.is_read ? '' : 'unread'}`} style={{ cursor: n.link ? 'pointer' : 'default' }}>
              {n.link ? (
                <Link to={`/app${n.link}`} onClick={() => markRead(n.id)}>
                  <div className="title">{n.title}</div>
                  {n.body && <div className="body">{n.body}</div>}
                </Link>
              ) : (
                <>
                  <div className="title">{n.title}</div>
                  {n.body && <div className="body">{n.body}</div>}
                </>
              )}
              <div className="time">{formatDateTime(n.created_at)}</div>
            </div>
          ))}
          {notifications.length === 0 && <div className="empty-state">You're all caught up.</div>}
        </div>
      </div>
    </div>
  );
}
