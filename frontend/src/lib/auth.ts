import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Role = 'HQ_ADMIN' | 'BRANCH_USER';

export interface User {
  id: string;
  fullName: string;
  email: string;
  password?: string;
  role: Role;
  branchName: string;
  region: string;
  status: 'enabled' | 'disabled';
  mustChangePassword?: boolean;
}

interface AuthState {
  user: User | null;
  token: string | null;
  login: (email: string, pass: string) => Promise<boolean>;
  logout: () => void;
  setUser: (user: User | null) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      login: async (email, password) => {
        try {
          const response = await fetch('http://localhost:3000/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
          });

          if (!response.ok) return false;

          const data = await response.json();
          set({ user: data.user, token: data.access_token });
          return true;
        } catch (error) {
          console.error('Login error:', error);
          return false;
        }
      },
      logout: () => set({ user: null, token: null }),
      setUser: (user) => set({ user }),
    }),
    {
      name: 'auth-storage',
    }
  )
);
