'use client';

import React, { createContext, useContext, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { usePathname, useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import { User } from '@/types/cms';
import { useMe } from '@/hooks/use-auth';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  refresh: async () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const queryClient = useQueryClient();
  const { data: user, isLoading } = useMe();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user && pathname !== '/login') {
      Cookies.remove('alpha_auth_token');
      router.push('/login');
    }
  }, [user, isLoading, pathname, router]);

  const refresh = async () => {
    await queryClient.invalidateQueries({ queryKey: ['me'] });
  };

  return (
    <AuthContext.Provider
      value={{ user: user || null, loading: isLoading, refresh }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
