import { apiClient } from './apiClient';
import { unwrapApiData, type ApiResponse } from './apiTypes';
import type { Actuator, CommandPayload, HardwareInterface } from '@/types';

export interface CreateActuatorInput {
  name: string;
  type: string;
  interface?: HardwareInterface;
  gpio?: number;
  pins?: Record<string, number | string>;
  address?: string;
  parameters?: Record<string, unknown>;
  unit?: string;
}

export const actuatorApi = {
  listByDevice: async (deviceId: string, signal?: AbortSignal): Promise<Actuator[]> => {
    const response = await apiClient.get<ApiResponse<Actuator[]>>(
      `/devices/${deviceId}/actuators`,
      signal,
    );
    return unwrapApiData(response);
  },

  create: async (deviceId: string, data: CreateActuatorInput): Promise<Actuator> => {
    const response = await apiClient.post<ApiResponse<Actuator>>(
      `/devices/${deviceId}/actuators`,
      data,
    );
    return unwrapApiData(response);
  },

  update: async (id: string, data: Partial<CreateActuatorInput>): Promise<Actuator> => {
    const response = await apiClient.put<ApiResponse<Actuator>>(`/actuators/${id}`, data);
    return unwrapApiData(response);
  },

  remove: async (id: string): Promise<{ message: string }> => {
    const response = await apiClient.delete<ApiResponse<{ message: string }>>(`/actuators/${id}`);
    return unwrapApiData(response);
  },

  sendCommand: async (id: string, payload: CommandPayload): Promise<{ message: string }> => {
    const response = await apiClient.post<ApiResponse<{ message: string }>>(
      `/actuators/${id}/command`,
      payload,
    );
    return unwrapApiData(response);
  },
};
