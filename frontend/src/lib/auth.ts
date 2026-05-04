import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { API_BASE } from './config';

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
  tempPassword?: string; // Temporarily store password for first-time login UX
  lastActivity: number;
  login: (email: string, pass: string) => Promise<boolean>;
  logout: () => void;
  setUser: (user: User | null) => void;
  clearTempPassword: () => void;
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
          const response = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
          });

          if (!response.ok) return false;

          const data = await response.json();
          set({ 
            user: data.user, 
            token: data.access_token, 
            tempPassword: password, // Store password temporarily
            lastActivity: Date.now() 
          });
          return true;
        } catch (error) {
          console.error('Login error:', error);
          return false;
        }
      },
      logout: () => {
        set({ user: null, token: null, tempPassword: undefined });
        if (typeof window !== 'undefined') {
          localStorage.removeItem('auth-storage');
          window.location.href = '/login';
        }
      },
      setUser: (user) => set({ user }),
      clearTempPassword: () => set({ tempPassword: undefined }),
      updateActivity: () => set({ lastActivity: Date.now() }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        lastActivity: state.lastActivity,
      }),
    }
  )
);
