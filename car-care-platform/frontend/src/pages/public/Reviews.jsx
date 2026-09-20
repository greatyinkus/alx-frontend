import { useEffect, useState } from 'react';
import api from '../../api/client';

function Stars({ rating }) {
  return <div className="stars">{'★'.repeat(rating || 0)}{'☆'.repeat(5 - (rating || 0))}</div>;
}

export default function Reviews() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/public/reviews')
      .then((res) => setReviews(res.data.reviews))
      .finally(() => setLoading(false));
  }, []);

  return (
    <section className="section">
      <div className="container">
        <h1 className="section-title">Customer Reviews</h1>
        <p className="section-subtitle">Real feedback from customers across our locations.</p>
        {loading && <p className="text-muted">Loading reviews…</p>}
        <div className="grid grid-3">
          {reviews.map((r) => (
            <div key={r.id} className="review-card">
              <Stars rating={r.rating} />
              <p className="mt-16" style={{ fontSize: '0.92rem' }}>&ldquo;{r.review_text}&rdquo;</p>
              <p className="text-muted mt-16" style={{ fontSize: '0.82rem', fontWeight: 700 }}>
                {r.customer_name} {r.location_name ? `· ${r.location_name}` : ''}
              </p>
              {!!r.featured && <span className="badge badge-Positive mt-8">Featured</span>}
            </div>
          ))}
        </div>
        {!loading && reviews.length === 0 && <p className="text-muted">No approved reviews yet — check back soon.</p>}
      </div>
    </section>
  );
}
