import { Link } from 'react-router-dom';

const SERVICES = [
  { icon: '🛞', name: 'Brake Repair', desc: 'Full inspection, pad and rotor replacement.' },
  { icon: '🛢️', name: 'Oil Change', desc: 'Fast, scheduled maintenance for every engine type.' },
  { icon: '🔧', name: 'Engine Diagnostics', desc: 'Computerized diagnostics with certified technicians.' },
  { icon: '❄️', name: 'AC Repair', desc: 'Keep cool with expert air conditioning service.' },
];

export default function Home() {
  return (
    <div>
      <section className="hero">
        <div className="container">
          <h1>Trusted Car Care, Across Every Location.</h1>
          <p>
            DriveCare Central keeps every location connected — so your vehicle gets consistent,
            professional service wherever you visit us, and your voice is always heard.
          </p>
          <div className="actions">
            <Link to="/feedback" className="btn btn-primary">Tell Us About Your Experience</Link>
            <Link to="/locations" className="btn btn-outline" style={{ color: '#fff', borderColor: 'rgba(255,255,255,0.4)' }}>
              Find a Location
            </Link>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <h2 className="section-title">Our Core Services</h2>
          <p className="section-subtitle">Certified technicians, genuine parts, and transparent pricing at every branch.</p>
          <div className="grid grid-4">
            {SERVICES.map((s) => (
              <div key={s.name} className="service-card">
                <div className="service-icon">{s.icon}</div>
                <h3>{s.name}</h3>
                <p className="text-muted mt-8" style={{ fontSize: '0.88rem' }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="cta-band">
        <div className="container">
          <h2>Tell Us About Your Experience</h2>
          <p>Good or bad, your feedback goes straight to our management team — every time.</p>
          <div className="actions">
            <Link to="/feedback" className="btn btn-primary">Give Feedback</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
