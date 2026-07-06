export type Role = 'ADMIN' | 'USER';
export type UserStatus = 'AKTIF' | 'NONAKTIF';
export type ActivityStatus = 'SELESAI' | 'SEDANG_BERLANGSUNG' | 'AKAN_DATANG' | 'DIBATALKAN';
export type CheckInStatus = 'SUCCESS' | 'MISSED';
export type Platform = 'INSTAGRAM' | 'TIKTOK' | 'YOUTUBE';
export type ContentType = 'REELS' | 'VIDEO_PENDEK' | 'VIDEO_DOKUMENTER';
export type ContentStatus = 'SELESAI' | 'PROSES' | 'TERENCANA' | 'REVISI' | 'DITOLAK';
export type LoanStatus = 'SEDANG_DIPINJAM' | 'SELESAI' | 'TERLAMBAT';
export type NotificationType = 'INFO' | 'SUCCESS' | 'WARNING' | 'ALERT';

export interface User {
  id: number;
  fullName: string;
  username: string;
  email: string;
  phone?: string;
  role: Role;
  roleLabel: string;
  avatar?: string;
  status: UserStatus;
  joinedAt: string;
}

export interface ActivityMember {
  id: number;
  activityId: number;
  userId: number;
  role: string;
  checkInStatus: CheckInStatus;
  checkInTime?: string;
  selfieUrl?: string;
  user: User;
}

export interface ActivityMedia {
  id: number;
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize?: number;
  createdAt: string;
  uploader?: { fullName: string } | null;
}

export interface ActivityMemberInput {
  userId: number;
  role: string;
}

export interface Activity {
  id: number;
  title: string;
  category: string;
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  status: ActivityStatus;
  description: string;
  picId: number;
  pic: User;
  members?: ActivityMember[];
  media?: ActivityMedia[];
}

export interface ActivityInput {
  title?: string;
  category?: string;
  date?: string;
  startTime?: string;
  endTime?: string;
  location?: string;
  status?: ActivityStatus;
  description?: string;
  picId?: number;
  members?: ActivityMemberInput[];
}

export interface DutySchedule {
  id: number;
  date: string;
  startTime: string;
  endTime: string;
  userId: number;
  user: User;
  notes?: string;
  shiftName?: string;
}

export interface ContentPlan {
  id: number;
  title: string;
  category?: string;
  platform: Platform;
  contentType: ContentType;
  picId: number;
  pic: User;
  deadline: string;
  status: ContentStatus;
  description?: string;
  revisionNote?: string;
  thumbnailUrl?: string;
  draftUrl?: string;
  videoUrl?: string;
  submittedAt?: string;
}

export interface LocationData {
  id: number;
  userId: number;
  user: User;
  latitude: number;
  longitude: number;
  address: string;
  distance?: string;
  isOnline: boolean;
  updatedAt: string;
}

export interface EquipmentLoan {
  id: number;
  borrowerName: string;
  borrowerPhone: string;
  equipmentName: string;
  borrowDate: string;
  returnDate: string;
  status: LoanStatus;
  purpose?: string;
  actualReturnDate?: string;
}

export interface ReportItem {
  id: number;
  title: string;
  category: string;
  date: string;
  picId: number;
  pic: User;
  status: string;
}

export interface Notification {
  id: number;
  userId: number | null;
  user?: User | null;
  title: string;
  message: string;
  type: NotificationType;
  isRead: boolean;
  link?: string | null;
  creatorName?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
