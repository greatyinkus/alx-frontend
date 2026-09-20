import { useEffect, useState } from 'react';
import api from '../../api/client';
import { SEVERITY_META } from '../../utils/format';

const INITIAL = {
  customerName: '', email: '', phone: '', location: '', service: '',
  vehicleMake: '', vehicleModel: '', vehicleRegistration: '', dateOfService: '',
  rating: 0, severity: '', feedback: '', complaint: '', requestedResolution: '',
};

export default function GiveFeedback() {
  const [locations, setLocations] = useState([]);
  const [services, setServices] = useState([]);
  const [form, setForm] = useState(INITIAL);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api.get('/public/locations').then((res) => setLocations(res.data.locations)).catch(() => {});
    api.get('/public/services').then((res) => setServices(res.data.services)).catch(() => {});
  }, []);

  const update = (field, value) => setForm((f) => ({ ...f, [field]: value }));

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.customerName.trim()) return setError('Please tell us your name.');
    if (!form.severity) return setError('Please let us know how you feel about your experience.');
    setSubmitting(true);
    try {
      const res = await api.post('/public/feedback', form);
      setResult(res.data);
      setForm(INITIAL);
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (result) {
    return (
      <section className="section">
        <div className="container" style={{ maxWidth: 560 }}>
          <div className="card card-pad" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2.4rem' }}>✅</div>
            <h2 className="mt-16">Thank you!</h2>
            <p className="text-muted mt-8">{result.message}</p>
            <p className="text-muted mt-16" style={{ fontSize: '0.82rem' }}>Reference: <span className="kbd">{result.feedback_id}</span></p>
            <button className="btn btn-primary mt-24" onClick={() => setResult(null)}>Submit another response</button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="section">
      <div className="container" style={{ maxWidth: 720 }}>
        <h1 className="section-title">Tell Us About Your Experience</h1>
        <p className="section-subtitle">
          Whether it's praise or a problem, your feedback goes straight to our central management team.
        </p>

        <form className="card card-pad" onSubmit={submit}>
          {error && <div className="alert alert-error">{error}</div>}

          <div className="field-row">
            <div className="field">
              <label>Your Name *</label>
              <input value={form.customerName} onChange={(e) => update('customerName', e.target.value)} required />
            </div>
            <div className="field">
              <label>Email</label>
              <input type="email" value={form.email} onChange={(e) => update('email', e.target.value)} />
            </div>
          </div>

          <div className="field-row">
            <div className="field">
              <label>Phone Number</label>
              <input value={form.phone} onChange={(e) => update('phone', e.target.value)} />
            </div>
            <div className="field">
              <label>Location Visited</label>
              <select value={form.location} onChange={(e) => update('location', e.target.value)}>
                <option value="">Select a location</option>
                {locations.map((l) => (
                  <option key={l.id} value={l.id}>{l.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="field-row">
            <div className="field">
              <label>Service Received</label>
              <select value={form.service} onChange={(e) => update('service', e.target.value)}>
                <option value="">Select a service</option>
                {services.map((s) => (
                  <option key={s.id} value={s.name}>{s.name}</option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Date of Service</label>
              <input type="date" value={form.dateOfService} onChange={(e) => update('dateOfService', e.target.value)} />
            </div>
          </div>

          <div className="field-row">
            <div className="field">
              <label>Vehicle Make</label>
              <input value={form.vehicleMake} onChange={(e) => update('vehicleMake', e.target.value)} placeholder="e.g. Toyota" />
            </div>
            <div className="field">
              <label>Vehicle Model</label>
              <input value={form.vehicleModel} onChange={(e) => update('vehicleModel', e.target.value)} placeholder="e.g. Camry" />
            </div>
          </div>

          <div className="field">
            <label>Vehicle Registration Number</label>
            <input value={form.vehicleRegistration} onChange={(e) => update('vehicleRegistration', e.target.value)} />
          </div>

          <div className="field">
            <label>Overall Rating</label>
            <div className="rating-picker">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  type="button"
                  key={n}
                  className={form.rating === n ? 'selected' : ''}
                  onClick={() => update('rating', n)}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          <div className="field">
            <label>How do you feel about your experience? *</label>
            <div className="emotion-grid">
              {Object.entries(SEVERITY_META).map(([value, meta]) => (
                <button
                  type="button"
                  key={value}
                  data-value={value}
                  className={`emotion-option ${form.severity === value ? 'selected' : ''}`}
                  onClick={() => update('severity', value)}
                >
                  <span className="emoji">{meta.emoji}</span>
                  <span className="label">{value}</span>
                  <span className="desc">{meta.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="field">
            <label>Tell us more</label>
            <textarea rows={3} value={form.feedback} onChange={(e) => update('feedback', e.target.value)} placeholder="Share your experience..." />
          </div>

          <div className="field">
            <label>Complaint (if any)</label>
            <textarea rows={3} value={form.complaint} onChange={(e) => update('complaint', e.target.value)} placeholder="Describe what went wrong..." />
          </div>

          <div className="field">
            <label>What resolution would you like?</label>
            <textarea rows={2} value={form.requestedResolution} onChange={(e) => update('requestedResolution', e.target.value)} />
          </div>

          <button className="btn btn-primary btn-block" disabled={submitting}>
            {submitting ? 'Submitting…' : 'Submit Feedback'}
          </button>
        </form>
      </div>
    </section>
  );
}
