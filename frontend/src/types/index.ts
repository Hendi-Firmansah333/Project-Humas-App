export type Role = 'ADMIN' | 'TIM_DOKUMENTASI' | 'FOTOGRAFER' | 'VIDEOGRAFER' | 'JURNALIS';
export type UserStatus = 'AKTIF' | 'NONAKTIF';
export type ActivityStatus = 'SELESAI' | 'SEDANG_BERLANGSUNG' | 'AKAN_DATANG';
export type CheckInStatus = 'SUCCESS' | 'MISSED';
export type Platform = 'INSTAGRAM' | 'TIKTOK' | 'YOUTUBE';
export type ContentType = 'REELS' | 'VIDEO_PENDEK' | 'VIDEO_DOKUMENTER';
export type ContentStatus = 'SELESAI' | 'PROSES' | 'TERENCANA';
export type LoanStatus = 'DIPINJAM' | 'DIKEMBALIKAN' | 'TERLAMBAT';

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
}

export interface DutySchedule {
  id: number;
  date: string;
  startTime: string;
  endTime: string;
  userId: number;
  user: User;
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
  thumbnailUrl?: string;
  draftUrl?: string;
  videoUrl?: string;
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
  icon?: string;
  totalUnits: number;
  availableUnits: number;
}

export interface EquipmentLoan {
  id: number;
  equipmentId: number;
  borrowerId: number;
  borrowDate: string;
  returnDate: string;
  status: LoanStatus;
  equipment: Equipment;
  borrower: User;
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

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
