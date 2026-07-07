import { ContentPlan, LocationData, User } from '@/types';

export const MEMBER_COLORS = ['#0D9488', '#0284C7', '#16A34A', '#D97706', '#7C3AED', '#DB2777'];

export function getMemberColor(userId: number): string {
  return MEMBER_COLORS[userId % MEMBER_COLORS.length];
}

export function formatApiDate(value: string | Date): string {
  const d = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toISOString().split('T')[0];
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
    revisionNote?: string;
    submittedAt?: string;
  },
) {
  const hasSubmission = Boolean(plan.videoUrl || plan.submittedAt);
  const reviewStatus = hasSubmission && plan.status === 'PROSES'
    ? 'MENUNGGU_REVIEW'
    : mapContentStatusFromApi(plan.status);

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
    status: reviewStatus,
    caption: plan.description ?? '',
    mediaUrl: resolveSubmittedMediaUrl(plan),
    videoUrl: plan.videoUrl ?? undefined,
    mediaType: isVideo ? ('video' as const) : ('image' as const),
    revisionNote: plan.revisionNote ?? undefined,
    media: plan.media ?? [],
  };
}

export function userToMemberOption(user: User) {
  return {
    id: user.id,
    name: user.fullName,
    role: user.roleLabel,
    color: getMemberColor(user.id),
    bgClass: 'bg-teal-50 text-teal-800 border-teal-200',
    avatar: user.avatar,
  };
}