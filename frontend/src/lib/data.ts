import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from './auth';

export interface Branch {
  id: string;
  name: string;
  region: string;
  address: string;
}

export interface Device {
  id: string;
  name: string;
  branchId: string;
  branchName: string;
  status: 'online' | 'offline';
  incidentStatus: 'safe' | 'vandalism';
  ipAddress?: string;
  province?: string;
  district?: string;
  sector?: string;
  cell?: string;
  location: {
    lat: number;
    lng: number;
    address: string;
  };
  lastData: string;
}

interface DataState {
  users: User[];
  branches: Branch[];
  devices: Device[];
  isLoading: boolean;
  
  fetchUsers: () => Promise<void>;
  addUser: (user: Omit<User, 'id'>) => Promise<boolean>;
  updateUser: (id: string, updates: Partial<User>) => Promise<boolean>;
  disableUser: (id: string) => Promise<boolean>;
  enableUser: (id: string) => Promise<boolean>;
  secureUpdateUser: (id: string, payload: {
    fullName?: string;
    email?: string;
    role?: string;
    branchName?: string;
    adminCurrentPassword: string;
    otp: string;
    newUserPassword?: string;
  }) => Promise<{ success: boolean; message: string }>;
  
  fetchBranches: () => Promise<void>;
  addBranch: (branch: Omit<Branch, 'id'>) => Promise<boolean>;
  
  fetchProvinces: () => Promise<string[]>;
  fetchDistricts: (province: string) => Promise<string[]>;
  fetchSectors: (province: string, district: string) => Promise<string[]>;
  fetchCells: (province: string, district: string, sector: string) => Promise<string[]>;
  
  fetchDevices: () => Promise<void>;
  addDevice: (device: { 
    serialNumber: string; 
    branchId: string; 
    branchName: string;
    ipAddress?: string;
    province?: string;
    district?: string;
    sector?: string;
    cell?: string;
    address: string;
    lat: number;
    lng: number;
  }) => Promise<boolean>;
  removeDevice: (id: string) => Promise<boolean>;

  requestPasswordReset: (email: string) => Promise<{ success: boolean; message: string }>;
  resetPassword: (payload: { email: string; otp: string; newPassword: string }) => Promise<{ success: boolean; message: string }>;
  requestPasswordChange: (currentPassword: string) => Promise<{ success: boolean; message: string }>;
  changePasswordWithOtp: (payload: { currentPassword: string; otp: string; newPassword: string }) => Promise<{ success: boolean; message: string }>;
}

const API_BASE = 'http://localhost:3000/api';

const getHeaders = () => {
  const auth = JSON.parse(localStorage.getItem('auth-storage') || '{}');
  const token = auth.state?.token;
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
  };
};

export const useDataStore = create<DataState>()(
  persist(
    (set, get) => ({
      users: [],
      branches: [],
      devices: [],
      isLoading: false,

      fetchUsers: async () => {
        try {
          const response = await fetch(`${API_BASE}/users`, { headers: getHeaders() });
          if (response.ok) {
            const data = await response.json();
            set({ users: data.map((u: any) => ({
              ...u,
              id: String(u.id),
              status: u.status.toLowerCase(),
              branchName: u.branch?.name || (u.role === 'HQ_ADMIN' ? 'Headquarter' : 'None'),
              region: u.branch?.region || (u.role === 'HQ_ADMIN' ? 'All' : 'None')
            })) });
          }
        } catch (error) { console.error('Fetch users error:', error); }
      },

      addUser: async (user) => {
        try {
          const branches = get().branches;
          const branch = branches.find(b => b.name === user.branchName);
          const defaultPassword = `${(user.branchName || 'Reg').split(' ')[0]}@2026`;
          
          const response = await fetch(`${API_BASE}/users`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({
              fullName: user.fullName,
              email: user.email,
              role: user.role,
              status: user.status.toUpperCase(),
              mustChangePassword: user.mustChangePassword,
              branchId: branch ? parseInt(branch.id) : undefined,
              password: defaultPassword,
            }),
          });
          if (response.ok) {
            await get().fetchUsers();
            return true;
          }
          return false;
        } catch (error) { return false; }
      },

      updateUser: async (id, updates) => {
        try {
          const branches = get().branches;
          const body: any = { ...updates };
          
          if (updates.status) {
            body.status = updates.status.toUpperCase();
          }
          
          if (updates.branchName) {
            const branch = branches.find(b => b.name === updates.branchName);
            if (branch) {
              body.branchId = parseInt(branch.id);
            }
          }

          const response = await fetch(`${API_BASE}/users/${id}`, {
            method: 'PATCH',
            headers: getHeaders(),
            body: JSON.stringify(body),
          });
          if (response.ok) {
            await get().fetchUsers();
            return true;
          }
          return false;
        } catch (error) { return false; }
      },

      disableUser: async (id) => get().updateUser(id, { status: 'disabled' as any }),
      enableUser: async (id) => get().updateUser(id, { status: 'enabled' as any }),

      secureUpdateUser: async (id, payload) => {
        try {
          const branches = get().branches;
          const body: any = { ...payload };
          
          if (payload.branchName) {
            const branch = branches.find(b => b.name === payload.branchName);
            if (branch) {
              body.branchId = parseInt(branch.id);
            }
          }

          const response = await fetch(`${API_BASE}/users/${id}/secure-update`, {
            method: 'PATCH',
            headers: getHeaders(),
            body: JSON.stringify(body),
          });
          const data = await response.json();
          if (response.ok) {
            await get().fetchUsers();
            return { success: true, message: 'User updated successfully' };
          }
          return { success: false, message: data.message || 'Failed to update user' };
        } catch (error) {
          return { success: false, message: 'Failed to connect to server' };
        }
      },

      fetchBranches: async () => {
        try {
          const response = await fetch(`${API_BASE}/branches`, { headers: getHeaders() });
          if (response.ok) {
            const data = await response.json();
            set({ branches: data.map((b: any) => ({ ...b, id: String(b.id) })) });
          }
        } catch (error) { console.error('Fetch branches error:', error); }
      },

      addBranch: async (branch) => {
        try {
          const response = await fetch(`${API_BASE}/branches`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(branch),
          });
          if (response.ok) {
            await get().fetchBranches();
            return true;
          }
          return false;
        } catch (error) { return false; }
      },

      fetchProvinces: async () => {
        try {
          const response = await fetch(`${API_BASE}/locations/provinces`, { headers: getHeaders() });
          if (response.ok) return await response.json();
          return [];
        } catch (error) { return []; }
      },

      fetchDistricts: async (province) => {
        try {
          const response = await fetch(`${API_BASE}/locations/districts?province=${province}`, { headers: getHeaders() });
          if (response.ok) return await response.json();
          return [];
        } catch (error) { return []; }
      },

      fetchSectors: async (province, district) => {
        try {
          const response = await fetch(`${API_BASE}/locations/sectors?province=${province}&district=${district}`, { headers: getHeaders() });
          if (response.ok) return await response.json();
          return [];
        } catch (error) { return []; }
      },

      fetchCells: async (province, district, sector) => {
        try {
          const response = await fetch(`${API_BASE}/locations/cells?province=${province}&district=${district}&sector=${sector}`, { headers: getHeaders() });
          if (response.ok) return await response.json();
          return [];
        } catch (error) { return []; }
      },

      fetchDevices: async () => {
        try {
          const response = await fetch(`${API_BASE}/devices`, { headers: getHeaders() });
          if (response.ok) {
            const data = await response.json();
            set({ devices: data.map((d: any) => ({
              ...d,
              branchId: String(d.branchId),
              branchName: d.branch?.name,
              location: { lat: d.lat, lng: d.lng, address: d.address }
            })) });
          }
        } catch (error) { console.error('Fetch devices error:', error); }
      },

      addDevice: async (device) => {
        try {
          const response = await fetch(`${API_BASE}/devices`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({
              id: device.serialNumber,
              branchId: parseInt(device.branchId),
              ipAddress: device.ipAddress,
              province: device.province,
              district: device.district,
              sector: device.sector,
              cell: device.cell,
              address: device.address,
              lat: device.lat,
              lng: device.lng
            }),
          });
          if (response.ok) {
            await get().fetchDevices();
            return true;
          }
          return false;
        } catch (error) { return false; }
      },

      removeDevice: async (id) => {
        try {
          const response = await fetch(`${API_BASE}/devices/${id}`, {
            method: 'DELETE',
            headers: getHeaders(),
          });
          if (response.ok) {
            await get().fetchDevices();
            return true;
          }
          return false;
        } catch (error) { return false; }
      },

      requestPasswordReset: async (email) => {
        try {
          const response = await fetch(`${API_BASE}/auth/request-password-reset`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ email }),
          });
          return await response.json();
        } catch (error) {
          return { success: false, message: 'Failed to connect to server' };
        }
      },

      resetPassword: async (payload) => {
        try {
          const response = await fetch(`${API_BASE}/auth/reset-password`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(payload),
          });
          return await response.json();
        } catch (error) {
          return { success: false, message: 'Failed to connect to server' };
        }
      },

      requestPasswordChange: async (currentPassword) => {
        try {
          const response = await fetch(`${API_BASE}/auth/request-password-change`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ currentPassword }),
          });
          return await response.json();
        } catch (error) {
          return { success: false, message: 'Failed to connect to server' };
        }
      },

      changePasswordWithOtp: async (payload) => {
        try {
          const response = await fetch(`${API_BASE}/auth/change-password-with-otp`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(payload),
          });
          return await response.json();
        } catch (error) {
          return { success: false, message: 'Failed to connect to server' };
        }
      },
    }),
    { name: 'data-storage' }
  )
);
