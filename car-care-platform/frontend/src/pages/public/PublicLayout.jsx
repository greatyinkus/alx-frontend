import { useState } from 'react';
import { NavLink, Outlet, Link } from 'react-router-dom';

const LINKS = [
  { to: '/', label: 'Home', end: true },
  { to: '/services', label: 'Services' },
  { to: '/locations', label: 'Locations' },
  { to: '/reviews', label: 'Customer Reviews' },
  { to: '/contact', label: 'Contact' },
];

export default function PublicLayout() {
  const [open, setOpen] = useState(false);

  return (
    <div>
      <header className="public-header">
        <div className="container">
          <Link to="/" className="brand">
            <span className="brand-mark">DC</span>
            DriveCare Central
          </Link>
          <nav className={`public-nav ${open ? 'open' : ''}`}>
            {LINKS.map((l) => (
              <NavLink key={l.to} to={l.to} end={l.end} onClick={() => setOpen(false)}>
                {l.label}
              </NavLink>
            ))}
            <Link to="/feedback" className="btn btn-primary btn-sm" onClick={() => setOpen(false)}>
              Give Feedback
            </Link>
            <Link to="/login" onClick={() => setOpen(false)}>Management Login</Link>
          </nav>
          <button className="nav-toggle" onClick={() => setOpen((v) => !v)} aria-label="Toggle navigation">
            ☰
          </button>
        </div>
      </header>
      <main>
        <Outlet />
      </main>
      <footer className="public-footer">
        <div className="container">
          <div>
            <div className="brand" style={{ color: '#fff', marginBottom: 8 }}>
              <span className="brand-mark">DC</span> DriveCare Central
            </div>
            <div>Trusted multi-location car care &amp; auto repair.</div>
          </div>
          <div>© {new Date().getFullYear()} DriveCare Central. All rights reserved.</div>
        </div>
      </footer>
    </div>
  );
}
