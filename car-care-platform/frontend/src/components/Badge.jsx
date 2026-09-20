import { slug } from '../utils/format';

export function SeverityBadge({ value }) {
  if (!value) return null;
  return <span className={`badge badge-${slug(value)}`}><span className="badge-dot" />{value}</span>;
}

export function PriorityBadge({ value }) {
  if (!value) return null;
  return <span className={`badge badge-${slug(value)}`}>{value}</span>;
}

export function StatusBadge({ value }) {
  if (!value) return null;
  return <span className={`badge badge-status is-${slug(value)}`}>{value}</span>;
}
