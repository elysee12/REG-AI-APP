import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Role = 'HQ_ADMIN' | 'BRANCH_USER';

export interface User {
  id: string;
  fullName: string;
  email: string;
  password?: string;
  role: Role;
  branchId?: number;
  branchName: string;
  region: string;
  status: 'enabled' | 'disabled';
  mustChangePassword?: boolean;
}

interface AuthState {
  user: User | null;
  token: string | null;
  lastActivity: number;
  login: (email: string, pass: string) => Promise<boolean>;
  logout: () => void;
  setUser: (user: User | null) => void;
  updateActivity: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      lastActivity: Date.now(),
      login: async (email, password) => {
        try {
          const response = await fetch('http://localhost:3000/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
          });

          if (!response.ok) return false;

          const data = await response.json();
          set({ user: data.user, token: data.access_token, lastActivity: Date.now() });
          return true;
        } catch (error) {
          console.error('Login error:', error);
          return false;
        }
      },
      logout: () => {
        set({ user: null, token: null });
        if (typeof window !== 'undefined') {
          localStorage.removeItem('auth-storage');
          window.location.href = '/login';
        }
      },
      setUser: (user) => set({ user }),
      updateActivity: () => set({ lastActivity: Date.now() }),
    }),
    {
      name: 'auth-storage',
    }
  )
);
