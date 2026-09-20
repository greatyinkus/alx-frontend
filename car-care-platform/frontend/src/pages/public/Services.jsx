const SERVICES = [
  { icon: '🛞', name: 'Brake Repair', desc: 'Pad replacement, rotor resurfacing, and full brake system inspection.' },
  { icon: '🛢️', name: 'Oil Change', desc: 'Synthetic and conventional oil change with multi-point inspection.' },
  { icon: '🔧', name: 'Engine Diagnostics', desc: 'Computerized diagnostics to pinpoint performance issues fast.' },
  { icon: '🛻', name: 'Tire Replacement', desc: 'Wide range of tire brands with balancing included.' },
  { icon: '❄️', name: 'AC Repair', desc: 'Recharge, leak detection, and full AC system servicing.' },
  { icon: '🧽', name: 'Full Service', desc: 'Complete vehicle service including wash and interior detailing.' },
  { icon: '🔋', name: 'Battery Replacement', desc: 'Testing and replacement with manufacturer-grade batteries.' },
  { icon: '📐', name: 'Wheel Alignment', desc: 'Precision alignment for a smoother, safer drive.' },
];

export default function Services() {
  return (
    <section className="section">
      <div className="container">
        <h1 className="section-title">Our Services</h1>
        <p className="section-subtitle">
          Every DriveCare Central location offers the same certified standard of service.
        </p>
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
  );
}
