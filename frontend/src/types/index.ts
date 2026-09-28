export type Role = 'ADMIN' | 'USER' | 'SUPER_ADMIN';
export type UserStatus = 'AKTIF' | 'NONAKTIF';
export type ActivityStatus =
  | 'MENUNGGU_PERSETUJUAN'
  | 'DISETUJUI'
  | 'DITOLAK'
  | 'DITUGASKAN'
  | 'SEDANG_BERLANGSUNG'
  | 'MENUNGGU_VERIFIKASI'
  | 'MENUNGGU_PERSETUJUAN_AKHIR'
  | 'SELESAI'
  | 'DIKEMBALIKAN'
  | 'PERLU_PERBAIKAN'
  | 'DIBATALKAN'
  | 'AKAN_DATANG'       // legacy compat
  | 'MENUNGGU_VALIDASI'; // legacy compat

export interface ApprovalHistoryEntry {
  stage: string;
  status: string;
  userId: number;
  fullName: string;
  role: string;
  date: string;
  notes: string;
}
export type CheckInStatus = 'SUCCESS' | 'MISSED' | 'TERLAMBAT';
export type Platform = 'INSTAGRAM' | 'TIKTOK' | 'YOUTUBE';
export type ContentType = 'REELS' | 'VIDEO_PENDEK' | 'VIDEO_DOKUMENTER';
export type ContentStatus =
  | 'DRAFT'
  | 'DITUGASKAN'
  | 'DALAM_PENGERJAAN'
  | 'MENUNGGU_VERIFIKASI_ADMIN'
  | 'REVISI'
  | 'MENUNGGU_PERSETUJUAN_KEPALA_HUMAS'
  | 'DISETUJUI'
  | 'PUBLISHED'
  | 'SELESAI'
  | 'DIBATALKAN'
  | 'MENUNGGU'
  | 'PROSES';
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
  activityId?: number;
  userId: number;
  status: CheckInStatus;
  latitude?: number;
  longitude?: number;
  distance?: number;
  selfieUrl?: string;
  notes?: string;
  checkInTime?: string;
  checkInAt?: string;
  user?: User;
}

export interface IncomingLetter {
  id: number;
  letterNumber: string;
  letterDate: string;
  receivedDate: string;
  sender: string;
  institution: string;
  subject: string;
  destination: string;
  fileUrl?: string;
  notes?: string;
  status: string; // BARU, MENUNGGU_VERIFIKASI_ADMIN, MENUNGGU_PERSETUJUAN_KEPALA_HUMAS, DISETUJUI, DITOLAK, DITUGASKAN, SELESAI
  eventLocation?: string;
  latitude?: number;
  longitude?: number;
  radius?: number;
  eventDate?: string;
  startTime?: string;
  endTime?: string;
  createdById: number;
  createdBy?: User;
  activities?: { id: number; title: string; status: string; date: string }[];
  createdAt: string;
  updatedAt: string;
}

export interface Activity {
  id: number;
  title: string;
  category: string;
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  latitude?: number;
  longitude?: number;
  radius?: number;
  status: ActivityStatus;
  description: string;
  picId: number;
  isManual?: boolean;
  pic: User;
  suratId?: number;
  surat?: IncomingLetter;
  members?: ActivityMember[];
  media?: ActivityMedia[];
  attendances?: ActivityAttendance[];
  updatedAt: string;
  createdAt?: string;
  validatedById?: number;
  validatedBy?: User;
  validationNotes?: string;
  notes?: string;
  documentationUrl?: string;
  result?: string;
  approvalHistory?: ApprovalHistoryEntry[];
  loans?: any[];
}

export interface ActivityInput {
  title?: string;
  category?: string;
  date?: string;
  startTime?: string;
  endTime?: string;
  location?: string;
  latitude?: number;
  longitude?: number;
  radius?: number;
  status?: ActivityStatus;
  description?: string;
  picId?: number;
  members?: ActivityMemberInput[];
  memberIds?: number[];
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
  category?: string;
  platform: Platform;
  contentType: string;
  picId: number;
  pic: User;
  deadline: string;
  status: ContentStatus;
  description?: string;
  revisionNote?: string;
  adminNotes?: string;
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

export interface Equipment {
  id: number;
  name: string;
  code: string;
  category: string;
  total: number;
  broken: number;
  available: number;
  borrowed: number;
  condition: string;
  storage?: string;
  description?: string;
  status: string;
}

export interface EquipmentLoanItem {
  id: number;
  loanId: number;
  equipmentId: number;
  equipment: Equipment;
  quantity: number;
  returnedQuantity: number;
  returnedAt?: string;
}

export interface EquipmentLoan {
  id: number;
  borrowerName: string;
  borrowerPhone: string;
  borrowDate: string;
  returnDate: string;
  status: LoanStatus;
  purpose?: string;
  notes?: string;
  actualReturnDate?: string;
  activityId?: number;
  activity?: { id: number; title: string };
  items: EquipmentLoanItem[];
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
