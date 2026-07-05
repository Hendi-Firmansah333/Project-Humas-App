import { User } from '@/types';

const USER_KEY = 'humass_user';
const TOKEN_KEY = 'humass_token';

export function getStoredUser(): User | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as User;
  } catch {
    return null;
  }
}

export function syncUserSession(user: User) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearUserSession() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(TOKEN_KEY);
}

export function isAdminUser(user: User | null): boolean {
  return user?.role === 'ADMIN';
}