export function formatDateID(dateString: string | Date): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

export function formatDateTimeID(dateString: string | Date): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export function isValidImageSrc(src?: string | null): src is string {
  if (typeof src !== 'string' || !src.trim()) return false;
  const value = src.trim();
  if (value.startsWith('data:image/')) return true;
  if (value.startsWith('http://') || value.startsWith('https://')) return true;
  return false;
}

export function isLocalFilePath(src?: string | null): boolean {
  if (!src) return false;
  return /^[a-zA-Z]:\\/.test(src) || src.startsWith('file://');
}

export function getInitials(name: string): string {
  if (!name) return 'HP';
  const parts = name.trim().split(' ');
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
