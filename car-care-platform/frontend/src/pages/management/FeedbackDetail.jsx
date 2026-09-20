import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../../api/client';
import { SeverityBadge, StatusBadge } from '../../components/Badge';
import { formatDateTime, formatDate } from '../../utils/format';

export default function FeedbackDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [creating, setCreating] = useState(false);

  const load = useCallback(() => {
    api.get(`/feedback/${id}`).then((res) => setData(res.data));
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const createIssue = async () => {
    setCreating(true);
    try {
      const res = await api.post(`/feedback/${id}/create-issue`);
      navigate(`/app/issues/${res.data.issue.id}`);
    } finally {
      setCreating(false);
    }
  };

  if (!data) return <div className="empty-state">Loading…</div>;
  const { feedback, issue } = data;

  return (
    <div>
      <Link to="/app/feedback" className="text-muted" style={{ fontSize: '0.85rem' }}>← Back to Feedback Inbox</Link>
      <div className="flex justify-between items-center mt-16">
        <h1>{feedback.feedback_code}</h1>
        <SeverityBadge value={feedback.severity} />
      </div>

      <div className="two-col mt-16">
        <div className="card card-pad">
          <h3>Customer & Service Information</h3>
          <dl className="detail-grid mt-16">
            <dt>Customer Name</dt><dd>{feedback.customer_name}</dd>
            <dt>Email</dt><dd>{feedback.customer_email || '—'}</dd>
            <dt>Phone</dt><dd>{feedback.customer_phone || '—'}</dd>
            <dt>Location</dt><dd>{feedback.location_name || '—'}</dd>
            <dt>Service Received</dt><dd>{feedback.service_name || '—'}</dd>
            <dt>Vehicle</dt><dd>{[feedback.vehicle_make, feedback.vehicle_model].filter(Boolean).join(' ') || '—'}</dd>
            <dt>Registration No.</dt><dd>{feedback.vehicle_registration || '—'}</dd>
            <dt>Date of Service</dt><dd>{feedback.date_of_service ? formatDate(feedback.date_of_service) : '—'}</dd>
            <dt>Overall Rating</dt><dd>{feedback.rating ? `${feedback.rating} / 5` : '—'}</dd>
            <dt>Source</dt><dd>{feedback.source}</dd>
            <dt>Submitted</dt><dd>{formatDateTime(feedback.submitted_at)}</dd>
          </dl>

          <h3 className="mt-24">Feedback</h3>
          <p className="mt-8" style={{ fontSize: '0.9rem' }}>{feedback.feedback_text || <span className="text-muted">No general comments provided.</span>}</p>

          {feedback.complaint && (
            <>
              <h3 className="mt-24">Complaint</h3>
              <p className="mt-8" style={{ fontSize: '0.9rem' }}>{feedback.complaint}</p>
            </>
          )}

          {feedback.requested_resolution && (
            <>
              <h3 className="mt-24">Requested Resolution</h3>
              <p className="mt-8" style={{ fontSize: '0.9rem' }}>{feedback.requested_resolution}</p>
            </>
          )}
        </div>

        <div className="card card-pad">
          <h3>Linked Issue</h3>
          {issue ? (
            <div className="mt-16">
              <Link to={`/app/issues/${issue.id}`} className="primary" style={{ fontWeight: 700 }}>{issue.issue_code}</Link>
              <div className="mt-8"><StatusBadge value={issue.status} /></div>
              <Link to={`/app/issues/${issue.id}`} className="btn btn-secondary btn-block mt-16">Open Issue</Link>
            </div>
          ) : (
            <div className="mt-16">
              <p className="text-muted" style={{ fontSize: '0.85rem' }}>No issue has been created from this feedback yet.</p>
              <button className="btn btn-primary btn-block mt-16" onClick={createIssue} disabled={creating}>
                {creating ? 'Creating…' : 'Create Issue'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
