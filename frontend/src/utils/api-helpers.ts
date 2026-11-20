import { ContentPlan, LocationData, User } from '@/types';

export const MEMBER_COLORS = ['#35C6D4', '#E99710', '#B8484A', '#202938', '#67686D', '#007985'];

export function isValidImageSrc(src?: string): boolean {
  if (!src) return false;
  return (
    src.startsWith('http://') ||
    src.startsWith('https://') ||
    src.startsWith('data:image/') ||
    src.startsWith('/')
  );
}

export function getMemberColor(userId: number): string {
  return MEMBER_COLORS[userId % MEMBER_COLORS.length];
}

export function formatApiDate(value: string | Date): string {
  const d = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return String(value);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatRelativeTime(value: string | Date): string {
  const d = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return 'Baru saja';
  const diffMs = Date.now() - d.getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'Baru saja';
  if (mins < 60) return `${mins} menit lalu`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} jam lalu`;
  return formatApiDate(d);
}

export function normalizeLocation(loc: LocationData): LocationData {
  return {
    ...loc,
    updatedAt: typeof loc.updatedAt === 'string' && loc.updatedAt.includes('T')
      ? formatRelativeTime(loc.updatedAt)
      : loc.updatedAt,
  };
}

export function mapPlatformLabel(platform: string, contentType?: string): string {
  const map: Record<string, string> = {
    INSTAGRAM: contentType === 'REELS' ? 'Instagram Reels' : 'Instagram Carousel',
    TIKTOK: 'TikTok Video',
    YOUTUBE: 'YouTube Video',
    WEBSITE: 'Website Rilis',
    FACEBOOK: 'Facebook Post',
  };
  return map[platform] ?? platform;
}

export function mapPlatformToApi(platform: string): { platform: string; contentType: string } {
  const normalized = platform.toLowerCase();
  if (normalized.includes('tiktok')) return { platform: 'TIKTOK', contentType: 'VIDEO_PENDEK' };
  if (normalized.includes('youtube')) return { platform: 'YOUTUBE', contentType: 'VIDEO_DOKUMENTER' };
  if (normalized.includes('website')) return { platform: 'WEBSITE', contentType: 'BERITA_RILIS' };
  if (normalized.includes('carousel')) return { platform: 'INSTAGRAM', contentType: 'INFOGRAFIS' };
  return { platform: 'INSTAGRAM', contentType: 'REELS' };
}

export type ContentReviewStatus = 'DRAFT' | 'MENUNGGU' | 'PROSES' | 'REVISI' | 'PUBLISHED' | 'SELESAI' | 'DIBATALKAN';

export function mapContentStatusFromApi(status: string): ContentReviewStatus {
  return status as ContentReviewStatus;
}

export function mapContentStatusToApi(status: ContentReviewStatus): string {
  return status;
}

function resolveSubmittedMediaUrl(
  plan: ContentPlan & { thumbnailUrl?: string | null; videoUrl?: string | null; draftUrl?: string | null },
) {
  const thumb = plan.thumbnailUrl?.trim();
  const isPlaceholder = thumb?.includes('images.unsplash.com') ?? false;
  if (thumb && !isPlaceholder && (thumb.startsWith('http') || thumb.startsWith('data:image/'))) {
    return thumb;
  }
  return plan.draftUrl ?? undefined;
}

export function contentPlanToItem(
  plan: ContentPlan & {
    description?: string;
    thumbnailUrl?: string;
    videoUrl?: string;
    rawMaterialUrl?: string;
    revisionNote?: string;
    adminNotes?: string;
    submittedAt?: string;
  },
) {
  const d = new Date(plan.deadline);
  const hours = !isNaN(d.getTime()) ? String(d.getHours()).padStart(2, '0') : '16';
  const mins = !isNaN(d.getTime()) ? String(d.getMinutes()).padStart(2, '0') : '00';
  const timeLabel = `${hours}:${mins} WIB`;

  const isVideo = ['video', 'reels', 'tiktok', 'podcast', 'live'].some(word => 
    (plan.contentType || '').toLowerCase().includes(word)
  );

  return {
    id: plan.id,
    title: plan.title,
    platform: plan.platform,
    contentType: plan.contentType || 'Foto',
    deadline: formatApiDate(plan.deadline),
    time: timeLabel,
    picName: plan.pic?.fullName ?? '-',
    picRole: plan.pic?.roleLabel ?? '-',
    picAvatar: plan.pic?.avatar,
    status: plan.status,
    caption: plan.description ?? '',
    mediaUrl: resolveSubmittedMediaUrl(plan),
    thumbnailUrl: plan.thumbnailUrl ?? undefined,
    videoUrl: plan.videoUrl ?? undefined,
    draftUrl: plan.draftUrl ?? undefined,
    rawMaterialUrl: plan.rawMaterialUrl ?? undefined,
    mediaType: isVideo ? ('video' as const) : ('image' as const),
    revisionNote: plan.revisionNote ?? undefined,
    adminNotes: plan.adminNotes ?? undefined,
    submittedAt: plan.submittedAt ?? undefined,
    media: plan.media ?? [],
  };
}

export function userToMemberOption(user: User) {
  return {
    id: user.id,
    name: user.fullName,
    role: user.roleLabel,
    color: getMemberColor(user.id),
    bgClass: 'bg-[#E0F7F9] text-[#007985] border-[#35C6D4]/30',
    avatar: user.avatar,
  };
}

export function getFileViewUrl(fileUrl?: string): string {
  if (!fileUrl) return '#';
  const trimmed = fileUrl.trim();
  if (!trimmed) return '#';

  if (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('/') ||
    trimmed.startsWith('blob:')
  ) {
    return trimmed;
  }

  // Base64 Data URI -> convert to Blob URL
  if (trimmed.startsWith('data:')) {
    try {
      const parts = trimmed.split(',');
      const header = parts[0];
      const base64Data = parts[1];
      const mimeMatch = header.match(/:(.*?);/);
      const mimeType = mimeMatch ? mimeMatch[1] : 'application/octet-stream';

      const byteCharacters = atob(base64Data);
      const byteNumbers = new Uint8Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const blob = new Blob([byteNumbers], { type: mimeType });
      return URL.createObjectURL(blob);
    } catch (err) {
      console.error('Gagal convert base64 ke blob:', err);
      return trimmed;
    }
  }

  // External domain without protocol (e.g. drive.google.com/...)
  if (trimmed.includes('.') && !trimmed.includes(' ')) {
    return 'https://' + trimmed;
  }

  return trimmed;
}

export function openFileInNewTab(fileUrl?: string) {
  if (!fileUrl) return;
  const viewUrl = getFileViewUrl(fileUrl);
  if (!viewUrl || viewUrl === '#') return;

  const a = document.createElement('a');
  a.href = viewUrl;
  a.target = '_blank';
  a.rel = 'noopener noreferrer';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}