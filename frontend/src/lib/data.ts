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
  securityContacts?: any[];
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
  updateBranch: (id: string, updates: Partial<Branch>) => Promise<boolean>;
  deleteBranch: (id: string) => Promise<boolean>;
  
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

  incidents: any[];
  fetchIncidents: (branchId?: string, deviceId?: string) => Promise<void>;
  fetchAssignedIncidents: () => Promise<void>;
  fetchIncidentById: (id: string) => Promise<any>;
  addIncident: (incident: any) => Promise<boolean>;
  updateIncidentStatus: (id: string, status: string) => Promise<boolean>;
  broadcastIncidentAlert: (id: string, message: string) => Promise<boolean>;
  broadcastWhatsappAlert: (id: string, message: string) => Promise<boolean>;

  securityContacts: any[];
  fetchSecurityContacts: (branchId?: string) => Promise<void>;
  addSecurityContact: (contact: any) => Promise<boolean>;
  updateSecurityContact: (id: string, contact: any) => Promise<boolean>;
  deleteSecurityContact: (id: string) => Promise<boolean>;
  linkContactToDevice: (contactId: string, deviceId: string) => Promise<boolean>;
  unlinkContactFromDevice: (contactId: string, deviceId: string) => Promise<boolean>;

  requestPasswordReset: (email: string) => Promise<{ success: boolean; message: string }>;
  resetPassword: (payload: { email: string; otp: string; newPassword: string }) => Promise<{ success: boolean; message: string }>;
  requestPasswordChange: (currentPassword: string) => Promise<{ success: boolean; message: string }>;
  changePasswordWithOtp: (payload: { currentPassword: string; otp: string; newPassword: string }) => Promise<{ success: boolean; message: string }>;

  // Alarm Control
  isAlarmActive: boolean;
  setAlarmActive: (active: boolean) => void;
  lastAlarmStopTimestamp: number;
  stopAlarm: () => void;
  resetAlarmStopTimestamp: () => void;
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
      incidents: [],
      securityContacts: [],
      isLoading: false,
      isAlarmActive: false,
      lastAlarmStopTimestamp: 0,
      setAlarmActive: (active) => set({ isAlarmActive: active }),
      stopAlarm: () => set({ isAlarmActive: false, lastAlarmStopTimestamp: Date.now() }),
      resetAlarmStopTimestamp: () => set({ lastAlarmStopTimestamp: 0 }),

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

      updateBranch: async (id, updates) => {
        try {
          const response = await fetch(`${API_BASE}/branches/${id}`, {
            method: 'PATCH',
            headers: getHeaders(),
            body: JSON.stringify(updates),
          });
          if (response.ok) {
            await get().fetchBranches();
            return true;
          }
          return false;
        } catch (error) { return false; }
      },

      deleteBranch: async (id) => {
        try {
          const response = await fetch(`${API_BASE}/branches/${id}`, {
            method: 'DELETE',
            headers: getHeaders(),
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
          const response = await fetch(`${API_BASE}/locations/districts?province=${encodeURIComponent(province)}`, { headers: getHeaders() });
          if (response.ok) return await response.json();
          return [];
        } catch (error) { return []; }
      },

      fetchSectors: async (province, district) => {
        try {
          const response = await fetch(`${API_BASE}/locations/sectors?province=${encodeURIComponent(province)}&district=${encodeURIComponent(district)}`, { headers: getHeaders() });
          if (response.ok) return await response.json();
          return [];
        } catch (error) { return []; }
      },

      fetchCells: async (province, district, sector) => {
        try {
          const response = await fetch(`${API_BASE}/locations/cells?province=${encodeURIComponent(province)}&district=${encodeURIComponent(district)}&sector=${encodeURIComponent(sector)}`, { headers: getHeaders() });
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
              location: { lat: d.lat, lng: d.lng, address: d.address },
              securityContacts: d.securityContacts
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

      fetchIncidents: async (branchId, deviceId) => {
        try {
          let url = `${API_BASE}/incidents`;
          const params = new URLSearchParams();
          if (deviceId) params.append('deviceId', deviceId);
          else if (branchId) params.append('branchId', branchId);
          
          if (params.toString()) url += `?${params.toString()}`;
          
          const response = await fetch(url, { headers: getHeaders() });
          if (response.ok) {
            const data = await response.json();
            set({ incidents: data.map((i: any) => ({
              ...i,
              id: i.id,
              ticketId: `INC-${i.id.split('-')[0].toUpperCase()}`,
              branchId: i.device?.branchId || i.branchId, // Ensure branchId is captured from the nested device
              location: `${i.deviceId} · ${i.device?.district || 'Unknown'}`,
              deviceName: i.device?.name || 'Unknown',
              time: i.time,
              deviceId: i.deviceId,
              deviceIp: i.device?.ipAddress,
              aiClass: i.aiClass,
              aiConfidence: i.aiConfidence,
              alertStatus: i.alertStatus,
              videoPath: i.videoPath,
              status: i.status.toLowerCase(), // ACTIVE, PENDING, SOLVED -> active, pending, solved
              // Derived fields for UI compatibility
              severity: i.alertStatus ? 'critical' : 'warning',
              type: i.alertStatus ? 'HIGHLY SUSPICIOUS' : (i.aiClass?.toString().trim().toUpperCase() === 'THIEF' ? 'HIGHLY SUSPICIOUS' : (i.aiClass || 'AI Detection'))
            })) });
          }
        } catch (error) { console.error('Fetch incidents error:', error); }
      },

      fetchAssignedIncidents: async () => {
        try {
          const response = await fetch(`${API_BASE}/incidents/assigned`, { headers: getHeaders() });
          if (response.ok) {
            const data = await response.json();
            set({ incidents: data.map((i: any) => ({
              ...i,
              id: i.id,
              ticketId: `INC-${i.id.split('-')[0].toUpperCase()}`,
              branchId: i.device?.branchId || i.branchId,
              location: `${i.deviceId} · ${i.device?.district || 'Unknown'}`,
              deviceName: i.device?.name || 'Unknown',
              time: i.time,
              deviceId: i.deviceId,
              deviceIp: i.device?.ipAddress,
              aiClass: i.aiClass,
              aiConfidence: i.aiConfidence,
              alertStatus: i.alertStatus,
              videoPath: i.videoPath,
              status: i.status.toLowerCase(),
              severity: i.alertStatus ? 'critical' : 'warning',
              type: i.alertStatus ? 'HIGHLY SUSPICIOUS' : (i.aiClass?.toString().trim().toUpperCase() === 'THIEF' ? 'HIGHLY SUSPICIOUS' : (i.aiClass || 'AI Detection'))
            })) });
          }
        } catch (error) { console.error('Fetch incidents error:', error); }
      },

      fetchIncidentById: async (id) => {
        try {
          const response = await fetch(`${API_BASE}/incidents/${id}`, { headers: getHeaders() });
          if (response.ok) {
            const i = await response.json();
            return {
              ...i,
              ticketId: `INC-${i.id.split('-')[0].toUpperCase()}`,
              status: i.status?.toLowerCase() || 'active',
              severity: i.alertStatus ? 'critical' : 'warning',
              type: i.aiClass || 'AI Detection'
            };
          }
          return null;
        } catch (error) { 
          console.error('Fetch incident by id error:', error);
          return null;
        }
      },

      addIncident: async (incident) => {
        try {
          const response = await fetch(`${API_BASE}/incidents`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(incident),
          });
          if (response.ok) {
            await get().fetchIncidents();
            return true;
          }
          return false;
        } catch (error) { return false; }
      },

      updateIncidentStatus: async (id, status) => {
        try {
          const response = await fetch(`${API_BASE}/incidents/${id}/status`, {
            method: 'PATCH',
            headers: getHeaders(),
            body: JSON.stringify({ status: status.toUpperCase() }),
          });
          if (response.ok) {
            await get().fetchIncidents();
            return true;
          }
          return false;
        } catch (error) { return false; }
      },

      broadcastIncidentAlert: async (id, message) => {
        try {
          const response = await fetch(`${API_BASE}/incidents/${id}/broadcast`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ message }),
          });
          return response.ok;
        } catch (error) { 
          console.error('Broadcast alert error:', error);
          return false; 
        }
      },

      broadcastWhatsappAlert: async (id, message) => {
        try {
          const response = await fetch(`${API_BASE}/incidents/${id}/broadcast-whatsapp`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ message }),
          });
          return response.ok;
        } catch (error) { 
          console.error('WhatsApp broadcast alert error:', error);
          return false; 
        }
      },

      fetchSecurityContacts: async (branchId) => {
        try {
          const url = branchId ? `${API_BASE}/security-contacts?branchId=${branchId}` : `${API_BASE}/security-contacts`;
          const response = await fetch(url, { headers: getHeaders() });
          if (response.ok) {
            const data = await response.json();
            set({ securityContacts: data });
          }
        } catch (error) { console.error('Fetch security contacts error:', error); }
      },

      addSecurityContact: async (contact) => {
        try {
          const response = await fetch(`${API_BASE}/security-contacts`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(contact),
          });
          if (response.ok) {
            await get().fetchSecurityContacts();
            return true;
          }
          return false;
        } catch (error) { return false; }
      },

      updateSecurityContact: async (id, contact) => {
        try {
          const response = await fetch(`${API_BASE}/security-contacts/${id}`, {
            method: 'PATCH',
            headers: getHeaders(),
            body: JSON.stringify(contact),
          });
          if (response.ok) {
            await get().fetchSecurityContacts();
            return true;
          }
          return false;
        } catch (error) { return false; }
      },

      deleteSecurityContact: async (id) => {
        try {
          const response = await fetch(`${API_BASE}/security-contacts/${id}`, {
            method: 'DELETE',
            headers: getHeaders(),
          });
          if (response.ok) {
            await get().fetchSecurityContacts();
            return true;
          }
          return false;
        } catch (error) { return false; }
      },

      linkContactToDevice: async (contactId, deviceId) => {
        try {
          const response = await fetch(`${API_BASE}/security-contacts/${contactId}/link/${deviceId}`, {
            method: 'POST',
            headers: getHeaders(),
          });
          if (response.ok) {
            await get().fetchSecurityContacts();
            await get().fetchDevices();
            return true;
          }
          return false;
        } catch (error) { return false; }
      },

      unlinkContactFromDevice: async (contactId, deviceId) => {
        try {
          const response = await fetch(`${API_BASE}/security-contacts/${contactId}/unlink/${deviceId}`, {
            method: 'POST',
            headers: getHeaders(),
          });
          if (response.ok) {
            await get().fetchSecurityContacts();
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
          const body: any = {};
          if (currentPassword) body.currentPassword = currentPassword;
          
          const response = await fetch(`${API_BASE}/auth/request-password-change`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(body),
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
    { 
      name: 'data-storage',
      partialize: (state) => Object.fromEntries(
        Object.entries(state).filter(([key]) => !['isAlarmActive'].includes(key))
      ),
    }
  )
);
