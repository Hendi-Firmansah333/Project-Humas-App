'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { User } from '@/types';

export function useAuth() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('humass_user');
    const token = localStorage.getItem('humass_token');

    if (!token || !stored) {
      setUser(null);
    } else {
      try {
        setUser(JSON.parse(stored));
      } catch {
        setUser(null);
      }
    }
    setLoading(false);
  }, []);

  const logout = () => {
    localStorage.removeItem('humass_token');
    localStorage.removeItem('humass_user');
    setUser(null);
    router.push('/login');
  };

  return { user, loading, logout, isAuthenticated: !!user };
}
