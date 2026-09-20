import { useCallback, useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import api from '../../api/client';
import { useSocket } from '../../context/SocketContext';
import { timeAgo, formatDateTime } from '../../utils/format';

const ICONS = {
  feedback: '📥',
  issue: '🛠️',
  management_hub: '💬',
  location: '📍',
  user: '🧑',
  review: '⭐',
};

export default function ActivityFeed() {
  const { locationFilter } = useOutletContext();
  const { socket } = useSocket();
  const [entityType, setEntityType] = useState('all');
  const [activity, setActivity] = useState([]);

  const load = useCallback(() => {
    api.get('/activity', { params: { location: locationFilter, entityType, limit: 150 } })
      .then((res) => setActivity(res.data.activity));
  }, [locationFilter, entityType]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!socket) return undefined;
    socket.on('activity:new', load);
    return () => socket.off('activity:new', load);
  }, [socket, load]);

  return (
    <div>
      <h1>Activity Feed</h1>
      <p className="text-muted" style={{ fontSize: '0.88rem' }}>Everything happening across the company, newest first.</p>

      <div className="toolbar mt-16">
        <select value={entityType} onChange={(e) => setEntityType(e.target.value)}>
          <option value="all">All Activity</option>
          <option value="feedback">Feedback</option>
          <option value="issue">Issues</option>
          <option value="management_hub">Management Hub</option>
          <option value="location">Locations</option>
          <option value="review">Reviews</option>
          <option value="user">Team</option>
        </select>
      </div>

      <div className="card">
        <div className="panel-body">
          {activity.length === 0 && <div className="empty-state">No activity to show.</div>}
          {activity.map((a) => (
            <div key={a.id} className="feed-item">
              <div className="feed-dot">{ICONS[a.entity_type] || '•'}</div>
              <div className="feed-content">
                <div className="desc">{a.description}</div>
                <div className="time" title={formatDateTime(a.created_at)}>{timeAgo(a.created_at)}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
