import { api } from '@/lib/api';
import { Activity, ActivityInput, ContentPlan, EquipmentLoan, LocationData, ReportItem, User } from '@/types';

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
  remove: async (id: number) => {
    const res = await api.delete(`/content-plans/${id}`);
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
  getInventory: async () => {
    const res = await api.get('/equipment-loans/inventory');
    return res.data;
  },
  create: async (data: Partial<EquipmentLoan>) => {
    const res = await api.post('/equipment-loans', data);
    return res.data;
  },
  update: async (id: number, data: Partial<EquipmentLoan>) => {
    const res = await api.patch(`/equipment-loans/${id}`, data);
    return res.data;
  },
  verifyReturn: async (id: number) => {
    const res = await api.patch(`/equipment-loans/${id}/verify-return`);
    return res.data;
  },
  remove: async (id: number) => {
    const res = await api.delete(`/equipment-loans/${id}`);
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
};

export const notificationService = {
  getAll: async (params?: Record<string, unknown>) => {
    const res = await api.get('/notifications', { params });
    return res.data;
  },
  markAllRead: async () => {
    const res = await api.patch('/notifications/read-all');
    return res.data;
  },
};