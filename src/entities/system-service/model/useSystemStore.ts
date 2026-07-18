import { create } from 'zustand';
import { apiService } from '@/shared/api';
import type { ServiceHealthItem, ServiceStatus } from '@/shared/api/types';

interface SystemState {
  systemStatus: ServiceStatus;
  services: ServiceHealthItem[];
  isChecking: boolean;
  checkSystemHealth: () => Promise<void>;
}

export const useSystemStore = create<SystemState>((set) => ({
  systemStatus: 'unknown',
  services: [],
  isChecking: false,

  checkSystemHealth: async () => {
    set({ isChecking: true });
    try {
      const response = await apiService.getHealth();
      set({
        systemStatus: response.status,
        services: response.services,
        isChecking: false,
      });
    } catch {
      set({
        systemStatus: 'failed',
        services: [],
        isChecking: false
      });
    }
  },
}));