import { api } from '@/lib/api';
import { Activity, ContentPlan, EquipmentLoan, LocationData, ReportItem, User } from '@/types';

export const activityService = {
  getAll: async (params?: Record<string, any>) => {
    const res = await api.get('/activities', { params });
    return res.data;
  },
  getById: async (id: number) => {
    const res = await api.get(`/activities/${id}`);
    return res.data;
  },
  create: async (data: Partial<Activity>) => {
    const res = await api.post('/activities', data);
    return res.data;
  },
};

export const scheduleService = {
  getAll: async (params?: Record<string, any>) => {
    const res = await api.get('/schedules', { params });
    return res.data;
  },
};

export const contentService = {
  getAll: async (params?: Record<string, any>) => {
    const res = await api.get('/content-plans', { params });
    return res.data;
  },
};

export const locationService = {
  getAll: async () => {
    const res = await api.get('/locations');
    return res.data;
  },
};

export const loanService = {
  getAll: async (params?: Record<string, any>) => {
    const res = await api.get('/equipment-loans', { params });
    return res.data;
  },
};

export const userService = {
  getAll: async (params?: Record<string, any>) => {
    const res = await api.get('/users', { params });
    return res.data;
  },
};

export const reportService = {
  getAll: async (params?: Record<string, any>) => {
    const res = await api.get('/reports', { params });
    return res.data;
  },
};
