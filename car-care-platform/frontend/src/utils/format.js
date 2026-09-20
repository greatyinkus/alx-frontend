export function formatDate(value) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function formatDateTime(value) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function timeAgo(value) {
  if (!value) return '';
  const d = new Date(value.endsWith?.('Z') || value.includes?.('T') ? value : value.replace(' ', 'T') + 'Z');
  const diffMs = Date.now() - d.getTime();
  if (Number.isNaN(diffMs)) return '';
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return formatDate(value);
}

export function slug(value) {
  return String(value || '').replace(/\s+/g, '-');
}

export function initials(name) {
  if (!name) return '?';
  return name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export const SEVERITY_META = {
  Positive: { emoji: '🙂', label: "I'm happy with the service" },
  'Mildly Concerned': { emoji: '😕', label: "I'm mildly annoyed or disappointed" },
  Unhappy: { emoji: '😠', label: "I'm unhappy and want this addressed" },
  'Very Angry': { emoji: '😡', label: "I'm extremely unhappy about what happened" },
};
