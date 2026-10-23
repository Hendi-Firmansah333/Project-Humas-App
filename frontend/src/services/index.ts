import { api } from '@/lib/api';
import { Activity, ActivityInput, ContentPlan, EquipmentLoan, LocationData, ReportItem, User, Notification } from '@/types';

export interface PaginatedApiResponse<T> {
  items: T[];
  total: number;
  hasMore: boolean;
  page: number;
  pageSize: number;
}

export const authService = {
  login: async (username: string, password: string) => {
    const res = await api.post('/auth/login', { username, password });
    return res.data as { accessToken: string; token: string; user: User };
  },
  profile: async () => {
    const res = await api.get('/auth/profile');
    return res.data as User;
  },
};

export const dashboardService = {
  summary: async () => {
    const res = await api.get('/dashboard/summary');
    return res.data;
  },
};

export const activityService = {
  getAll: async (params?: Record<string, unknown>) => {
    const res = await api.get<PaginatedApiResponse<Activity>>('/activities', { params });
    return res.data;
  },
  getHistory: async (params?: Record<string, unknown>) => {
    const res = await api.get<PaginatedApiResponse<Activity>>('/activities/history', { params });
    return res.data;
  },
  getById: async (id: number) => {
    const res = await api.get<Activity>(`/activities/${id}`);
    return res.data;
  },
  create: async (data: ActivityInput) => {
    const res = await api.post<Activity>('/activities', data);
    return res.data;
  },
  update: async (id: number, data: ActivityInput) => {
    const res = await api.patch<Activity>(`/activities/${id}`, data);
    return res.data;
  },
  remove: async (id: number) => {
    const res = await api.delete(`/activities/${id}`);
    return res.data;
  },
  restore: async (id: number) => {
    const res = await api.patch<Activity>(`/activities/${id}/restore`);
    return res.data;
  },
  getCategories: async () => {
    const res = await api.get<string[]>('/activities/categories');
    return res.data;
  },
  validate: async (id: number, notes?: string) => {
    const res = await api.patch<Activity>(`/activities/${id}/validate`, { notes });
    return res.data;
  },
  approveExecution: async (id: number) => {
    const res = await api.patch<Activity>(`/activities/${id}/approve-execution`);
    return res.data;
  },
  rejectExecution: async (id: number, notes: string) => {
    const res = await api.patch<Activity>(`/activities/${id}/reject-execution`, { notes });
    return res.data;
  },
  assignTeam: async (id: number, picId: number, memberIds: number[], equipmentItems?: { equipmentId: number; quantity: number }[]) => {
    const res = await api.patch<Activity>(`/activities/${id}/assign-team`, { picId, memberIds, equipmentItems });
    return res.data;
  },
  submitVerification: async (id: number, notes?: string) => {
    const res = await api.patch<Activity>(`/activities/${id}/submit-verification`, { notes });
    return res.data;
  },
  approveFinish: async (id: number, notes?: string) => {
    const res = await api.patch<Activity>(`/activities/${id}/approve-finish`, { notes });
    return res.data;
  },
  returnRevision: async (id: number, notes: string) => {
    const res = await api.patch<Activity>(`/activities/${id}/return-revision`, { notes });
    return res.data;
  },
};

export const scheduleService = {
  getAll: async (params?: Record<string, unknown>) => {
    const res = await api.get('/schedules', { params });
    return res.data;
  },
  create: async (data: Record<string, unknown>) => {
    const res = await api.post('/schedules', data);
    return res.data;
  },
  update: async (id: number, data: Record<string, unknown>) => {
    const res = await api.patch(`/schedules/${id}`, data);
    return res.data;
  },
  remove: async (id: number) => {
    const res = await api.delete(`/schedules/${id}`);
    return res.data;
  },
};

export const contentService = {
  getAll: async (params?: Record<string, unknown>) => {
    const res = await api.get<PaginatedApiResponse<ContentPlan>>('/content-plans', { params });
    return res.data;
  },
  getHistory: async (params?: Record<string, unknown>) => {
    const res = await api.get<PaginatedApiResponse<ContentPlan>>('/content-plans/history', { params });
    return res.data;
  },
  getById: async (id: number) => {
    const res = await api.get<ContentPlan>(`/content-plans/${id}`);
    return res.data;
  },
  create: async (data: Partial<ContentPlan>) => {
    const res = await api.post<ContentPlan>('/content-plans', data);
    return res.data;
  },
  update: async (id: number, data: Partial<ContentPlan>) => {
    const res = await api.patch<ContentPlan>(`/content-plans/${id}`, data);
    return res.data;
  },
  startProgress: async (id: number) => {
    const res = await api.patch<ContentPlan>(`/content-plans/${id}/start-progress`);
    return res.data;
  },
  submitWork: async (id: number, data: { videoUrl?: string; draftUrl?: string; thumbnailUrl?: string; caption?: string; sendToReview?: boolean }) => {
    const res = await api.post<ContentPlan>(`/content-plans/${id}/submit-work`, data);
    return res.data;
  },
  sendReview: async (id: number, adminNotes?: string) => {
    const res = await api.patch<ContentPlan>(`/content-plans/${id}/send-review`, { adminNotes });
    return res.data;
  },
  verifyAdmin: async (id: number, adminNotes?: string) => {
    const res = await api.patch<ContentPlan>(`/content-plans/${id}/verify-admin`, { adminNotes });
    return res.data;
  },
  requestFix: async (id: number, notes: string) => {
    const res = await api.patch<ContentPlan>(`/content-plans/${id}/request-fix`, { notes });
    return res.data;
  },
  approve: async (id: number) => {
    const res = await api.patch<ContentPlan>(`/content-plans/${id}/approve`);
    return res.data;
  },
  requestRevision: async (id: number, notes: string) => {
    const res = await api.patch<ContentPlan>(`/content-plans/${id}/request-revision`, { notes });
    return res.data;
  },
  publish: async (id: number) => {
    const res = await api.patch<ContentPlan>(`/content-plans/${id}/publish`);
    return res.data;
  },
  cancel: async (id: number) => {
    const res = await api.patch<ContentPlan>(`/content-plans/${id}/cancel`);
    return res.data;
  },
  remove: async (id: number) => {
    const res = await api.delete(`/content-plans/${id}`);
    return res.data;
  },
  restore: async (id: number) => {
    const res = await api.patch<ContentPlan>(`/content-plans/${id}/restore`);
    return res.data;
  },
};

export const locationService = {
  getAll: async () => {
    const res = await api.get<LocationData[]>('/locations');
    return res.data;
  },
  sync: async (data: Record<string, unknown>) => {
    const res = await api.post('/live-location/sync', data);
    return res.data;
  },
};

export const loanService = {
  getAll: async (params?: Record<string, unknown>) => {
    const res = await api.get('/equipment-loans', { params });
    return res.data;
  },
  getHistory: async (params?: Record<string, unknown>) => {
    const res = await api.get('/equipment-loans/history', { params });
    return res.data;
  },
  getOne: async (id: number) => {
    const res = await api.get(`/equipment-loans/${id}`);
    return res.data;
  },
  create: async (data: Record<string, unknown>) => {
    const res = await api.post('/equipment-loans', data);
    return res.data;
  },
  update: async (id: number, data: Record<string, unknown>) => {
    const res = await api.patch(`/equipment-loans/${id}`, data);
    return res.data;
  },
  verifyReturn: async (id: number, returnCondition?: string) => {
    const res = await api.patch(`/equipment-loans/${id}/verify-return`, returnCondition ? { returnCondition } : {});
    return res.data;
  },
  returnItems: async (id: number, returnItems: { loanItemId: number; returnedQuantity: number; returnCondition?: string }[]) => {
    const res = await api.patch(`/equipment-loans/${id}/return-items`, { returnItems });
    return res.data;
  },
  // Equipment (Inventaris)
  getAvailability: async (params: { date: string; startTime?: string; endTime?: string; excludeActivityId?: number }) => {
    const res = await api.get('/equipment-loans/availability', { params });
    return res.data;
  },
  getEquipment: async (params?: { search?: string; includeInactive?: boolean }) => {
    const res = await api.get('/equipment-loans/equipment', { params });
    return res.data;
  },
  getEquipmentById: async (id: number) => {
    const res = await api.get(`/equipment-loans/equipment/${id}`);
    return res.data;
  },
  getStock: async (equipmentId: number) => {
    const res = await api.get(`/equipment-loans/equipment/${equipmentId}/stock`);
    return res.data;
  },
  createEquipment: async (data: Record<string, unknown>) => {
    const res = await api.post('/equipment-loans/equipment', data);
    return res.data;
  },
  updateEquipment: async (id: number, data: Record<string, unknown>) => {
    const res = await api.patch(`/equipment-loans/equipment/${id}`, data);
    return res.data;
  },
  removeEquipment: async (id: number) => {
    const res = await api.delete(`/equipment-loans/equipment/${id}`);
    return res.data;
  },
  remove: async (id: number) => {
    const res = await api.delete(`/equipment-loans/${id}`);
    return res.data;
  },
  restore: async (id: number) => {
    const res = await api.patch(`/equipment-loans/${id}/restore`);
    return res.data;
  },
};


export const userService = {
  getAll: async (params?: Record<string, unknown>) => {
    const res = await api.get<User[]>('/users', { params });
    return res.data;
  },
  getById: async (id: number) => {
    const res = await api.get<User>(`/users/${id}`);
    return res.data;
  },
  create: async (data: Partial<User> & { password: string }) => {
    const res = await api.post<User>('/users', data);
    return res.data;
  },
  update: async (id: number, data: Partial<User>) => {
    const res = await api.patch<User>(`/users/${id}`, data);
    return res.data;
  },
  remove: async (id: number) => {
    const res = await api.delete(`/users/${id}`);
    return res.data;
  },
  updatePassword: async (id: number, data: Record<string, unknown>) => {
    const res = await api.patch(`/users/${id}/password`, data);
    return res.data;
  },
};

export const reportService = {
  getAll: async (params?: Record<string, unknown>) => {
    const res = await api.get<ReportItem[]>('/reports', { params });
    return res.data;
  },
  getById: async (id: number) => {
    const res = await api.get<ReportItem>(`/reports/${id}`);
    return res.data;
  },
  create: async (data: Partial<ReportItem>) => {
    const res = await api.post<ReportItem>('/reports', data);
    return res.data;
  },
  remove: async (id: number) => {
    const res = await api.delete(`/reports/${id}`);
    return res.data;
  },
  getActivities: async (params?: Record<string, unknown>) => {
    const res = await api.get('/reports/activities', { params });
    return res.data;
  },
  getContentPlans: async (params?: Record<string, unknown>) => {
    const res = await api.get('/reports/content-plans', { params });
    return res.data;
  },
  getLoans: async (params?: Record<string, unknown>) => {
    const res = await api.get('/reports/loans', { params });
    return res.data;
  },
  getUsers: async (params?: Record<string, unknown>) => {
    const res = await api.get('/reports/users', { params });
    return res.data;
  },
  getUserEvaluation: async (params?: Record<string, unknown>) => {
    const res = await api.get('/reports/user-evaluation', { params });
    return res.data;
  },
};

export const notificationService = {
  getAll: async (params?: Record<string, unknown>) => {
    const res = await api.get<PaginatedApiResponse<Notification>>('/notifications', { params });
    return res.data;
  },
  markAllRead: async () => {
    const res = await api.patch('/notifications/read-all');
    return res.data;
  },
  markRead: async (id: number) => {
    const res = await api.patch(`/notifications/${id}/read`);
    return res.data;
  },
  remove: async (id: number) => {
    const res = await api.delete(`/notifications/${id}`);
    return res.data;
  },
};

export const incomingLetterService = {
  getAll: async (params?: Record<string, unknown>) => {
    const res = await api.get('/incoming-letters', { params });
    return res.data;
  },
  getById: async (id: number) => {
    const res = await api.get(`/incoming-letters/${id}`);
    return res.data;
  },
  create: async (data: Record<string, unknown>) => {
    const res = await api.post('/incoming-letters', data);
    return res.data;
  },
  update: async (id: number, data: Record<string, unknown>) => {
    const res = await api.patch(`/incoming-letters/${id}`, data);
    return res.data;
  },
  verifyAdmin: async (id: number) => {
    const res = await api.patch(`/incoming-letters/${id}/verify-admin`);
    return res.data;
  },
  createActivity: async (id: number, data: Record<string, unknown>) => {
    const res = await api.post(`/incoming-letters/${id}/create-activity`, data);
    return res.data;
  },
  approve: async (id: number) => {
    const res = await api.patch(`/incoming-letters/${id}/approve`);
    return res.data;
  },
  reject: async (id: number, notes: string) => {
    const res = await api.patch(`/incoming-letters/${id}/reject`, { notes });
    return res.data;
  },
  remove: async (id: number) => {
    const res = await api.delete(`/incoming-letters/${id}`);
    return res.data;
  },
};