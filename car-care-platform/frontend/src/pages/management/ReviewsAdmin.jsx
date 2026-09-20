import { useCallback, useEffect, useState } from 'react';
import api from '../../api/client';
import { formatDate } from '../../utils/format';

export default function ReviewsAdmin() {
  const [status, setStatus] = useState('all');
  const [reviews, setReviews] = useState([]);

  const load = useCallback(() => {
    api.get('/reviews', { params: { status } }).then((res) => setReviews(res.data.reviews));
  }, [status]);

  useEffect(() => { load(); }, [load]);

  const setReviewStatus = (id, s) => api.patch(`/reviews/${id}/status`, { status: s }).then(load);
  const toggleFeature = (id, featured) => api.patch(`/reviews/${id}/feature`, { featured: !featured }).then(load);

  return (
    <div>
      <h1>Reviews</h1>
      <p className="text-muted" style={{ fontSize: '0.88rem' }}>
        Approve customer feedback to display it publicly. Private complaints never become public reviews automatically.
      </p>

      <div className="toolbar mt-16">
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="all">All</option>
          <option value="Pending">Pending</option>
          <option value="Approved">Approved</option>
          <option value="Hidden">Hidden</option>
          <option value="Rejected">Rejected</option>
        </select>
      </div>

      <div className="card">
        <div className="panel-body">
          {reviews.map((r) => (
            <div key={r.id} className="list-row" style={{ alignItems: 'flex-start' }}>
              <div style={{ maxWidth: 480 }}>
                <div className="primary">{r.customer_name} · {r.location_name} · {r.rating}/5</div>
                <div className="secondary mt-8">{r.review_text}</div>
                <div className="text-muted mt-8" style={{ fontSize: '0.74rem' }}>{formatDate(r.created_at)}</div>
              </div>
              <div className="flex gap-8" style={{ flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                <span className={`badge ${r.status === 'Approved' ? 'badge-Positive' : r.status === 'Rejected' ? 'badge-Critical' : 'badge-Low'}`}>{r.status}</span>
                {r.status !== 'Approved' && <button className="btn btn-outline btn-sm" onClick={() => setReviewStatus(r.id, 'Approved')}>Approve</button>}
                {r.status !== 'Hidden' && <button className="btn btn-outline btn-sm" onClick={() => setReviewStatus(r.id, 'Hidden')}>Hide</button>}
                {r.status !== 'Rejected' && <button className="btn btn-outline btn-sm" onClick={() => setReviewStatus(r.id, 'Rejected')}>Reject</button>}
                <button className="btn btn-ghost btn-sm" onClick={() => toggleFeature(r.id, r.featured)}>{r.featured ? 'Unfeature' : 'Feature'}</button>
              </div>
            </div>
          ))}
          {reviews.length === 0 && <div className="empty-state">No reviews yet.</div>}
        </div>
      </div>
    </div>
  );
}
