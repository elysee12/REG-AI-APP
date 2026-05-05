import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from './auth';
import { 
  getProvinces, 
  getDistricts, 
  getSectors, 
  getCells, 
  getVillages,
  getDistrictCenter 
} from './locations';
import { API_BASE } from './config';

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
  village?: string;
  location: {
    lat: number;
    lng: number;
    address: string;
  };
  cameraConnected?: boolean;
  esp32Connected?: boolean;
  gpsSatellites?: number;
  lastData: string;
  securityContacts?: any[];
}

export interface Technician {
  id: string;
  staffId: string;
  fullName: string;
  email: string;
  phone: string;
  role: string;
  branchId: string;
  branchName?: string;
  status: string;
  profileImage?: string;
}

interface DataState {
  users: User[];
  branches: Branch[];
  devices: Device[];
  technicians: Technician[];
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
  fetchVillages: (province: string, district: string, sector: string, cell: string) => Promise<string[]>;
  
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
    village?: string;
    address: string;
    lat: number;
    lng: number;
  }) => Promise<boolean>;
  updateDevice: (id: string, updates: {
    name?: string;
    branchId?: string;
    ipAddress?: string;
    province?: string;
    district?: string;
    sector?: string;
    cell?: string;
    village?: string;
    address?: string;
    lat?: number;
    lng?: number;
  }) => Promise<boolean>;
  removeDevice: (id: string) => Promise<boolean>;

  fetchTechnicians: () => Promise<void>;
  addTechnician: (technician: FormData) => Promise<{ success: boolean; message?: string }>;
  updateTechnician: (id: string, updates: FormData) => Promise<{ success: boolean; message?: string }>;
  deleteTechnician: (id: string) => Promise<boolean>;

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

const getHeaders = () => {
  if (typeof window === 'undefined') return {};
  
  const authStr = localStorage.getItem('auth-storage');
  const auth = authStr ? JSON.parse(authStr) : {};
  const token = auth.state?.token;
  return {
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
  };
};

const handleUnauthorized = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('auth-storage');
    window.location.href = '/login?error=session_expired';
  }
};

const secureFetch = async (url: string, options: RequestInit = {}) => {
  const bodyIsFormData = options.body instanceof FormData;
  const response = await fetch(url, {
    ...options,
    headers: {
      ...getHeaders(),
      ...(!bodyIsFormData ? { 'Content-Type': 'application/json' } : {}),
      ...options.headers,
    },
  });

  if (response.status === 401) {
    handleUnauthorized();
    throw new Error('Unauthorized');
  }

  return response;
};

export const useDataStore = create<DataState>()(
  persist(
    (set, get) => ({
      users: [],
      branches: [],
      devices: [],
      technicians: [],
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
          const response = await secureFetch(`${API_BASE}/users`);
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
          
          const response = await secureFetch(`${API_BASE}/users`, {
            method: 'POST',
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

          const response = await secureFetch(`${API_BASE}/users/${id}`, {
            method: 'PATCH',
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

          const response = await secureFetch(`${API_BASE}/users/${id}/secure-update`, {
            method: 'PATCH',
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
          const response = await secureFetch(`${API_BASE}/branches`);
          if (response.ok) {
            const data = await response.json();
            set({ branches: data.map((b: any) => ({ ...b, id: String(b.id) })) });
          }
        } catch (error) { console.error('Fetch branches error:', error); }
      },

      addBranch: async (branch) => {
        try {
          const response = await secureFetch(`${API_BASE}/branches`, {
            method: 'POST',
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
          const response = await secureFetch(`${API_BASE}/branches/${id}`, {
            method: 'PATCH',
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
          const response = await secureFetch(`${API_BASE}/branches/${id}`, {
            method: 'DELETE',
          });
          if (response.ok) {
            await get().fetchBranches();
            return true;
          }
          return false;
        } catch (error) { return false; }
      },

      fetchProvinces: async () => {
        return getProvinces();
      },

      fetchDistricts: async (province) => {
        return getDistricts(province);
      },

      fetchSectors: async (province, district) => {
        return getSectors(province, district);
      },

      fetchCells: async (province, district, sector) => {
        return getCells(province, district, sector);
      },

      fetchVillages: async (province, district, sector, cell) => {
        return getVillages(province, district, sector, cell);
      },

      fetchDevices: async () => {
        try {
          const response = await secureFetch(`${API_BASE}/devices`);
          if (response.ok) {
            const data = await response.json();
            set({ devices: data.map((d: any) => {
              // Heuristic: If device is in Kigali but its district is elsewhere, use district center
              const districtCenter = getDistrictCenter(d.district) || getDistrictCenter(d.province);
              const isDefaultKigali = Math.abs(d.lat - (-1.9441)) < 0.001 && Math.abs(d.lng - 30.0619) < 0.001;
              const isKigaliArea = d.district?.toLowerCase().includes('kigali') || 
                                  d.district?.toLowerCase().includes('nyarugenge') || 
                                  d.district?.toLowerCase().includes('gasabo') || 
                                  d.district?.toLowerCase().includes('kicukiro') ||
                                  d.province?.toLowerCase().includes('kigali');
              
              const finalLat = (isDefaultKigali && !isKigaliArea && districtCenter) ? districtCenter.lat : d.lat;
              const finalLng = (isDefaultKigali && !isKigaliArea && districtCenter) ? districtCenter.lng : d.lng;

              return {
                ...d,
                branchId: String(d.branchId),
                branchName: d.branch?.name,
                location: { lat: finalLat, lng: finalLng, address: d.address },
                securityContacts: d.securityContacts
              };
            }) });
          }
        } catch (error) { console.error('Fetch devices error:', error); }
      },

      addDevice: async (device) => {
        try {
          const response = await secureFetch(`${API_BASE}/devices`, {
            method: 'POST',
            body: JSON.stringify({
              id: device.serialNumber,
              branchId: parseInt(device.branchId),
              ipAddress: device.ipAddress,
              province: device.province,
              district: device.district,
              sector: device.sector,
              cell: device.cell,
              village: device.village,
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

      updateDevice: async (id, updates) => {
        try {
          const body: any = { ...updates };
          if (updates.branchId) body.branchId = parseInt(updates.branchId);
          
          const response = await secureFetch(`${API_BASE}/devices/${id}`, {
            method: 'PATCH',
            body: JSON.stringify(body),
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
          const response = await secureFetch(`${API_BASE}/devices/${id}`, {
            method: 'DELETE',
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
          
          const response = await secureFetch(url);
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
              pirSensor: i.pirSensor,
              servoPosition: i.servoPosition,
              gpsLatitude: i.gpsLatitude,
              gpsLongitude: i.gpsLongitude,
              aiSummary: i.aiSummary,
              // Derived fields for UI compatibility
              severity: i.alertStatus ? 'critical' : 'warning',
              type: i.aiClass || 'SUSPICIOUS'
            })) });
          }
        } catch (error) { console.error('Fetch incidents error:', error); }
      },

      fetchAssignedIncidents: async () => {
        try {
          const response = await secureFetch(`${API_BASE}/incidents/assigned`);
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
              pirSensor: i.pirSensor,
              servoPosition: i.servoPosition,
              gpsLatitude: i.gpsLatitude,
              gpsLongitude: i.gpsLongitude,
              aiSummary: i.aiSummary,
              severity: i.alertStatus ? 'critical' : 'warning',
              type: i.aiClass || 'SUSPICIOUS'
            })) });
          }
        } catch (error) { console.error('Fetch incidents error:', error); }
      },

      fetchIncidentById: async (id) => {
        try {
          const response = await secureFetch(`${API_BASE}/incidents/${id}`);
          if (response.ok) {
            const i = await response.json();
            return {
              ...i,
              ticketId: `INC-${i.id.split('-')[0].toUpperCase()}`,
              status: i.status?.toLowerCase() || 'active',
              pirSensor: i.pirSensor,
              servoPosition: i.servoPosition,
              gpsLatitude: i.gpsLatitude,
              gpsLongitude: i.gpsLongitude,
              aiSummary: i.aiSummary,
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
          const response = await secureFetch(`${API_BASE}/incidents`, {
            method: 'POST',
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
          const response = await secureFetch(`${API_BASE}/incidents/${id}/status`, {
            method: 'PATCH',
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
          const response = await secureFetch(`${API_BASE}/incidents/${id}/broadcast`, {
            method: 'POST',
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
          const response = await secureFetch(`${API_BASE}/incidents/${id}/broadcast-whatsapp`, {
            method: 'POST',
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
          const response = await secureFetch(url);
          if (response.ok) {
            const data = await response.json();
            set({ securityContacts: data });
          }
        } catch (error) { console.error('Fetch security contacts error:', error); }
      },

      addSecurityContact: async (contact) => {
        try {
          const response = await secureFetch(`${API_BASE}/security-contacts`, {
            method: 'POST',
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
          const response = await secureFetch(`${API_BASE}/security-contacts/${id}`, {
            method: 'PATCH',
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
          const response = await secureFetch(`${API_BASE}/security-contacts/${id}`, {
            method: 'DELETE',
          });
          if (response.ok) {
            await get().fetchSecurityContacts();
            return true;
          }
          return false;
        } catch (error) { return false; }
      },

      fetchTechnicians: async () => {
        try {
          const response = await secureFetch(`${API_BASE}/technicians`);
          if (response.ok) {
            const data = await response.json();
            set({ technicians: data.map((t: any) => ({
              ...t,
              branchId: String(t.branchId),
              branchName: t.branch?.name
            })) });
          }
        } catch (error) { console.error('Fetch technicians error:', error); }
      },

      addTechnician: async (formData) => {
        try {
          const response = await secureFetch(`${API_BASE}/technicians`, {
            method: 'POST',
            body: formData,
          });
          if (response.ok) {
            await get().fetchTechnicians();
            return { success: true };
          }

          let message = 'Could not add technician.';
          try {
            const data = await response.json();
            message = data?.message || JSON.stringify(data);
          } catch {
            message = await response.text();
          }
          console.error('Add technician error:', message);
          return { success: false, message };
        } catch (error) {
          console.error('Add technician request error:', error);
          return { success: false, message: 'Network error while adding technician.' };
        }
      },

      updateTechnician: async (id, formData) => {
        try {
          const response = await secureFetch(`${API_BASE}/technicians/${id}`, {
            method: 'PATCH',
            body: formData,
          });
          if (response.ok) {
            await get().fetchTechnicians();
            return { success: true };
          }

          let message = 'Could not update technician.';
          try {
            const data = await response.json();
            message = data?.message || JSON.stringify(data);
          } catch {
            message = await response.text();
          }
          console.error('Update technician error:', message);
          return { success: false, message };
        } catch (error) {
          console.error('Update technician request error:', error);
          return { success: false, message: 'Network error while updating technician.' };
        }
      },

      deleteTechnician: async (id) => {
        try {
          const response = await secureFetch(`${API_BASE}/technicians/${id}`, {
            method: 'DELETE',
          });
          if (response.ok) {
            await get().fetchTechnicians();
            return true;
          }
          return false;
        } catch (error) { return false; }
      },

      linkContactToDevice: async (contactId, deviceId) => {
        try {
          const response = await secureFetch(`${API_BASE}/security-contacts/${contactId}/link/${deviceId}`, {
            method: 'POST',
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
          const response = await secureFetch(`${API_BASE}/security-contacts/${contactId}/unlink/${deviceId}`, {
            method: 'POST',
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
          const response = await secureFetch(`${API_BASE}/auth/request-password-reset`, {
            method: 'POST',
            body: JSON.stringify({ email }),
          });
          return await response.json();
        } catch (error) {
          return { success: false, message: 'Failed to connect to server' };
        }
      },

      resetPassword: async (payload) => {
        try {
          const response = await secureFetch(`${API_BASE}/auth/reset-password`, {
            method: 'POST',
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
          
          const response = await secureFetch(`${API_BASE}/auth/request-password-change`, {
            method: 'POST',
            body: JSON.stringify(body),
          });
          return await response.json();
        } catch (error) {
          return { success: false, message: 'Failed to connect to server' };
        }
      },

      changePasswordWithOtp: async (payload) => {
        try {
          const response = await secureFetch(`${API_BASE}/auth/change-password-with-otp`, {
            method: 'POST',
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
