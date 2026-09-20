import { useEffect, useState, useCallback } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import api from '../../api/client';
import { initials, timeAgo } from '../../utils/format';

const NAV = [
  { to: '/app', label: 'Dashboard', icon: '📊', end: true },
  { to: '/app/feedback', label: 'Feedback Inbox', icon: '📥' },
  { to: '/app/issues', label: 'Issues', icon: '🛠️' },
  { to: '/app/activity', label: 'Activity Feed', icon: '🕒' },
  { to: '/app/management-hub', label: 'Management Hub', icon: '💬' },
  { to: '/app/customers', label: 'Customers', icon: '👤' },
  { to: '/app/locations', label: 'Locations', icon: '📍' },
  { to: '/app/reviews', label: 'Reviews', icon: '⭐' },
  { to: '/app/reports', label: 'Reports', icon: '📈' },
  { to: '/app/notifications', label: 'Notifications', icon: '🔔' },
  { to: '/app/team', label: 'Team', icon: '🧑‍🤝‍🧑' },
  { to: '/app/settings', label: 'Settings', icon: '⚙️' },
];

export default function ManagementLayout() {
  const { user, logout } = useAuth();
  const { socket } = useSocket();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [locations, setLocations] = useState([]);
  const [locationFilter, setLocationFilter] = useState('all');
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const loadLocations = useCallback(() => {
    api.get('/locations').then((res) => setLocations(res.data.locations)).catch(() => {});
  }, []);

  const loadNotifications = useCallback(() => {
    api
      .get('/notifications')
      .then((res) => {
        setNotifications(res.data.notifications);
        setUnreadCount(res.data.unreadCount);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    loadLocations();
    loadNotifications();
  }, [loadLocations, loadNotifications]);

  useEffect(() => {
    if (!socket) return undefined;
    const onNotif = () => loadNotifications();
    socket.on('notification:new', onNotif);
    return () => socket.off('notification:new', onNotif);
  }, [socket, loadNotifications]);

  const markAllRead = () => {
    api.post('/notifications/read-all').then(loadNotifications);
  };

  return (
    <div className="app-shell">
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="brand">
          <span className="brand-mark">DC</span> DriveCare Central
        </div>
        <nav>
          {NAV.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.end} onClick={() => setSidebarOpen(false)}>
              <span>{item.icon}</span> {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="user-box">
          <div className="name">{user?.name}</div>
          <div className="role">{user?.role}</div>
          <button className="btn btn-ghost btn-sm mt-8" style={{ color: '#fff', padding: '4px 0' }} onClick={() => { logout(); navigate('/login'); }}>
            Log out
          </button>
        </div>
      </aside>

      <div className="main-area">
        <div className="topbar">
          <div className="flex items-center gap-12">
            <button className="menu-toggle" onClick={() => setSidebarOpen((v) => !v)}>☰</button>
            <div className="location-filter">
              📍
              <select value={locationFilter} onChange={(e) => setLocationFilter(e.target.value)}>
                <option value="all">All Locations</option>
                {locations.map((l) => (
                  <option key={l.id} value={l.id}>{l.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="topbar-actions" style={{ position: 'relative' }}>
            <button className="bell-btn" onClick={() => setNotifOpen((v) => !v)}>
              🔔
              {unreadCount > 0 && <span className="bell-dot" />}
            </button>
            {notifOpen && (
              <div className="card" style={{ position: 'absolute', right: 0, top: 42, width: 320, zIndex: 60 }}>
                <div className="panel-header">
                  <h3>Notifications</h3>
                  <button className="btn btn-ghost btn-sm" onClick={markAllRead}>Mark all read</button>
                </div>
                <div style={{ maxHeight: 360, overflowY: 'auto' }}>
                  {notifications.length === 0 && <div className="empty-state">No notifications yet</div>}
                  {notifications.map((n) => (
                    <div key={n.id} className={`notif-item ${n.is_read ? '' : 'unread'}`}>
                      <div className="title">{n.title}</div>
                      {n.body && <div className="body">{n.body}</div>}
                      <div className="time">{timeAgo(n.created_at)}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="avatar">{initials(user?.name)}</div>
          </div>
        </div>
        <div className="content">
          <Outlet context={{ locationFilter, locations, reloadLocations: loadLocations }} />
        </div>
      </div>
    </div>
  );
}
