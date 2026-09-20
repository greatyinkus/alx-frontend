import { useEffect, useState } from 'react';
import api from '../../api/client';

export default function Locations() {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/public/locations')
      .then((res) => setLocations(res.data.locations))
      .finally(() => setLoading(false));
  }, []);

  return (
    <section className="section">
      <div className="container">
        <h1 className="section-title">Our Locations</h1>
        <p className="section-subtitle">Visit any DriveCare Central branch — every location follows the same service standard.</p>
        {loading && <p className="text-muted">Loading locations…</p>}
        <div className="grid grid-3">
          {locations.map((l) => (
            <div key={l.id} className="location-card">
              <h3>{l.name}</h3>
              <p className="text-muted mt-8" style={{ fontSize: '0.88rem' }}>{l.address || 'Address coming soon'}</p>
              {l.contact && <p className="mt-8" style={{ fontSize: '0.88rem' }}>📞 {l.contact}</p>}
            </div>
          ))}
        </div>
        {!loading && locations.length === 0 && <p className="text-muted">No locations available yet.</p>}
      </div>
    </section>
  );
}
