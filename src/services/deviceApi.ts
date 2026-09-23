import { apiClient } from './apiClient';
import type { Device, DeviceConfig } from '@/types';

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface CreateDeviceInput {
  deviceId: string;
  name: string;
  description?: string;
  connectionType?: string;
  ipAddress?: string;
  firmwareVersion?: string;
}

export const deviceApi = {
  list: async (signal?: AbortSignal): Promise<Device[]> => {
    const response = await apiClient.get<ApiResponse<Device[]>>('/devices', signal);
    return response.data;
  },

  get: async (id: string, signal?: AbortSignal): Promise<Device> => {
    const response = await apiClient.get<ApiResponse<Device>>(
      `/devices/${id}`,
      signal,
    );
    return response.data;
  },

  create: async (data: CreateDeviceInput): Promise<Device> => {
    const response = await apiClient.post<ApiResponse<Device>>(
      '/devices',
      data,
    );
    return response.data;
  },

  update: async (
    id: string,
    data: Partial<CreateDeviceInput>,
  ): Promise<Device> => {
    const response = await apiClient.put<ApiResponse<Device>>(
      `/devices/${id}`,
      data,
    );
    return response.data;
  },

  remove: async (id: string): Promise<{ message: string }> => {
    const response = await apiClient.delete<ApiResponse<{ message: string }>>(
      `/devices/${id}`,
    );
    return response.data;
  },

  heartbeat: async (
    id: string,
  ): Promise<{ message: string; status: string }> => {
    const response = await apiClient.post<
      ApiResponse<{ message: string; status: string }>
    >(`/devices/${id}/heartbeat`);

    return response.data;
  },

  getConfig: async (
    id: string,
    signal?: AbortSignal,
  ): Promise<DeviceConfig> => {
    const response = await apiClient.get<ApiResponse<DeviceConfig>>(
      `/devices/${id}/config`,
      signal,
    );

    return response.data;
  },

  updateConfig: async (
    id: string,
    config: DeviceConfig,
  ): Promise<DeviceConfig> => {
    const response = await apiClient.put<ApiResponse<DeviceConfig>>(
      `/devices/${id}/config`,
      config,
    );

    return response.data;
  },
};