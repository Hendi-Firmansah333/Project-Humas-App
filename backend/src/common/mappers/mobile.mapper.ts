import {
  Activity,
  ActivityMember,
  ActivityStatus,
  CheckInStatus,
  ContentPlan,
  ContentStatus,
  Location,
  Notification,
  User,
} from '@prisma/client';

const activityStatusLabel: Record<ActivityStatus, string> = {
  AKAN_DATANG: 'Akan Datang',
  SEDANG_BERLANGSUNG: 'Sedang Berlangsung',
  SELESAI: 'Selesai',
  DIBATALKAN: 'Dibatalkan',
  MENUNGGU_VALIDASI: 'Menunggu Validasi',
};

const contentStatusToMobile: Record<ContentStatus, string> = {
  DRAFT: 'belumDikerjakan',
  MENUNGGU: 'belumDikerjakan',
  PROSES: 'sedangDikerjakan',
  REVISI: 'sedangDikerjakan',
  PUBLISHED: 'selesai',
  SELESAI: 'selesai',
  DIBATALKAN: 'belumDikerjakan',
};

const checkInStatusToState = (status?: CheckInStatus | null) => {
  switch (status) {
    case CheckInStatus.SUCCESS:
      return 'checkedIn';
    case CheckInStatus.TERLAMBAT:
      return 'late';
    case CheckInStatus.MISSED:
      return 'missed';
    default:
      return 'none';
  }
};

type ActivityWithRelations = Activity & {
  pic: Pick<User, 'fullName' | 'username'>;
  members?: (ActivityMember & { user?: Pick<User, 'fullName'> })[];
  media?: { id: number; fileName: string; fileUrl: string; fileType: string; createdAt: Date; uploader?: Pick<User, 'fullName'> | null }[];
};

export function mapActivityForMobile(
  activity: ActivityWithRelations,
  isHistory = false,
  userId?: number,
) {
  const member = userId
    ? activity.members?.find((m) => m.userId === userId)
    : activity.members?.[0];
  const isPic = userId != null && activity.picId === userId;
  const checkInStatus = member?.checkInStatus;
  const state = checkInStatusToState(checkInStatus);

  const docMedia = (activity.media ?? []).filter((m) => m.fileType === 'application/link');
  const latestDoc = docMedia[0];
  const docStatus = latestDoc ? 'Sudah Upload' : 'Belum Upload Dokumentasi';
  const documentationUrl = latestDoc?.fileUrl ?? null;

  return {
    id: String(activity.id),
    title: activity.title.trim(),
    description: activity.description,
    date: activity.date.toISOString().split('T')[0],
    time: `${activity.startTime} - ${activity.endTime}`,
    location: activity.location,
    picName: activity.pic.fullName,
    picInitials: initials(activity.pic.fullName),
    jobDesk: member?.role ?? (isPic ? 'PIC Lapangan' : ''),
    status: activityStatusLabel[activity.status],
    checkInStatus:
      state === 'checkedIn'
        ? 'Check-in: Berhasil'
        : state === 'late'
          ? 'Check-in: Terlambat'
          : state === 'missed'
            ? 'Check-in: Tidak Check-in'
            : '',
    docStatus,
    latitude: -5.3582,
    longitude: 105.2321,
    geofenceRadiusMeters: 500,
    timeline: [],
    documentationUrl,
    checkInState: state,
    selfiePath: member?.selfieUrl ?? null,
    scheduledAt: activity.date.toISOString(),
    isHistory,
    checkInTime: member?.checkInTime ?? null,
    adminNote: null,
    verificationStatus: null,
  };
}

function resolveMobileContentStatus(plan: ContentPlan) {
  if (plan.status === 'SELESAI' || plan.status === 'PUBLISHED') return 'selesai';
  if (plan.status === 'REVISI') return 'perluRevisi';
  if (plan.status === 'DIBATALKAN') return 'ditolak';
  if (plan.status === 'PROSES' && plan.videoUrl) return 'menungguReview';
  if (plan.status === 'PROSES') return 'sedangDikerjakan';
  return 'belumDikerjakan';
}

function canSubmitContent(plan: ContentPlan) {
  if (plan.status === 'SELESAI' || plan.status === 'PUBLISHED' || plan.status === 'DIBATALKAN') return false;
  if (plan.status === 'PROSES' && plan.videoUrl) return false;
  return true;
}

export function mapContentPlanForMobile(
  plan: ContentPlan & { pic?: Pick<User, 'fullName'> | null },
) {
  const status = resolveMobileContentStatus(plan);
  const locked = !canSubmitContent(plan);
  return {
    id: String(plan.id),
    title: plan.title,
    description: plan.description ?? '',
    tags: [plan.platform, plan.contentType, plan.category ?? ''].filter(Boolean),
    status,
    deadline: plan.deadline.toISOString(),
    pic: plan.pic?.fullName ?? 'Admin Humas',
    deadlineLabel: plan.deadline.toLocaleDateString('id-ID'),
    progress:
      plan.status === 'SELESAI'
        ? 100
        : plan.status === 'PROSES' && plan.videoUrl
          ? 85
          : plan.status === 'PROSES' || plan.status === 'REVISI'
            ? 60
            : 0,
    videoLink: plan.videoUrl,
    posterPath: plan.thumbnailUrl,
    videoFileName: plan.videoUrl ? plan.videoUrl.split('/').pop() : null,
    revisionNote: plan.revisionNote ?? null,
    canSubmit: canSubmitContent(plan),
    submissionLocked: locked,
  };
}

export function mapNotificationForMobile(notification: Notification) {
  return {
    id: String(notification.id),
    title: notification.title,
    body: notification.message,
    time: formatRelativeTime(notification.createdAt),
    iconCodePoint: 0xe7f4,
    colorValue: 0xff3b82f6,
    type: 'umum',
    isUnread: !notification.isRead,
    group: 'Hari Ini',
    relatedEntityId: null,
    relatedEntityType: null,
    fcmPayload: {},
    createdAt: notification.createdAt.toISOString(),
  };
}

export function mapTeamMemberFromLocation(
  location: Location & { user: Pick<User, 'id' | 'fullName' | 'phone' | 'roleLabel'> },
) {
  return {
    id: String(location.user.id),
    name: location.user.fullName,
    division: location.user.roleLabel,
    distance: location.distance ?? '—',
    location: location.address,
    initials: initials(location.user.fullName),
    isOnDuty: location.isOnline,
    latitude: location.latitude,
    longitude: location.longitude,
    lastUpdated: location.updatedAt.toISOString(),
    phone: location.user.phone,
    completedTasks: 0,
    activityHistory: [],
  };
}

function initials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

function formatRelativeTime(date: Date) {
  const diffMs = Date.now() - date.getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return 'Baru saja';
  if (minutes < 60) return `${minutes} menit yang lalu`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} jam yang lalu`;
  const days = Math.floor(hours / 24);
  return `${days} hari yang lalu`;
}