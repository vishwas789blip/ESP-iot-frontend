import { apiClient } from './apiClient';
import { unwrapApiData, type ApiResponse } from './apiTypes';
import type { Sensor, HardwareInterface } from '@/types';

export interface CreateSensorInput {
  name: string;
  type: string;
  interface?: HardwareInterface;
  gpio?: number;
  pins?: Record<string, number | string>;
  address?: string;
  parameters?: Record<string, unknown>;
  unit?: string;
}

export const sensorApi = {
  listByDevice: async (deviceId: string, signal?: AbortSignal): Promise<Sensor[]> => {
    const response = await apiClient.get<ApiResponse<Sensor[]>>(
      `/devices/${deviceId}/sensors`,
      signal,
    );
    return unwrapApiData(response);
  },

  create: async (deviceId: string, data: CreateSensorInput): Promise<Sensor> => {
    const response = await apiClient.post<ApiResponse<Sensor>>(
      `/devices/${deviceId}/sensors`,
      data,
    );
    return unwrapApiData(response);
  },

  get: async (id: string, signal?: AbortSignal): Promise<Sensor> => {
    const response = await apiClient.get<ApiResponse<Sensor>>(`/sensors/${id}`, signal);
    return unwrapApiData(response);
  },

  update: async (id: string, data: Partial<CreateSensorInput>): Promise<Sensor> => {
    const response = await apiClient.put<ApiResponse<Sensor>>(`/sensors/${id}`, data);
    return unwrapApiData(response);
  },

  remove: async (id: string): Promise<{ message: string }> => {
    const response = await apiClient.delete<ApiResponse<{ message: string }>>(`/sensors/${id}`);
    return unwrapApiData(response);
  },
};
