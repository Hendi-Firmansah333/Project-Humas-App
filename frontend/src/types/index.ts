export type Role = 'ADMIN' | 'USER';
export type UserStatus = 'AKTIF' | 'NONAKTIF';
export type ActivityStatus = 'SELESAI' | 'SEDANG_BERLANGSUNG' | 'AKAN_DATANG' | 'DIBATALKAN';
export type CheckInStatus = 'SUCCESS' | 'MISSED' | 'TERLAMBAT';
export type Platform = 'INSTAGRAM' | 'TIKTOK' | 'YOUTUBE';
export type ContentType = 'REELS' | 'VIDEO_PENDEK' | 'VIDEO_DOKUMENTER';
export type ContentStatus = 'DRAFT' | 'MENUNGGU' | 'PROSES' | 'REVISI' | 'PUBLISHED' | 'SELESAI' | 'DIBATALKAN';
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
  isActive?: boolean;
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

export interface ActivityAttendance {
  id: number;
  activityId: number;
  userId: number;
  latitude?: number;
  longitude?: number;
  checkInAt?: string;
  user?: User;
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
  attendances?: ActivityAttendance[];
  updatedAt: string;
  createdAt?: string;
  validatedById?: number;
  validatedBy?: User;
  validatedAt?: string;
  validationNotes?: string;
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

export interface ContentPlanMedia {
  id: number;
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize?: number;
  createdAt: string;
  uploader?: { fullName: string } | null;
}

export interface ContentPlan {
  id: number;
  title: string;
  platform: Platform;
  contentType: string;
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
  media?: ContentPlanMedia[];
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
