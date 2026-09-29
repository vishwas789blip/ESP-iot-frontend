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

type BackendSensor = Omit<Sensor, 'parameters'> & { config?: Record<string, unknown> };

function normalizeSensor(sensor: BackendSensor): Sensor {
  return {
    ...sensor,
    parameters: sensor.config ?? {},
  };
}

function toBackendInput(data: Partial<CreateSensorInput>) {
  const { parameters, ...rest } = data;
  return {
    ...rest,
    ...(parameters !== undefined ? { config: parameters } : {}),
  };
}

export const sensorApi = {
  listByDevice: async (deviceId: string, signal?: AbortSignal): Promise<Sensor[]> => {
    const response = await apiClient.get<ApiResponse<BackendSensor[]>>(`/devices/${deviceId}/sensors`, signal);
    return unwrapApiData(response).map(normalizeSensor);
  },

  create: async (deviceId: string, data: CreateSensorInput): Promise<Sensor> => {
    const response = await apiClient.post<ApiResponse<BackendSensor>>(
      `/devices/${deviceId}/sensors`,
      toBackendInput(data),
    );
    return normalizeSensor(unwrapApiData(response));
  },

  get: async (id: string, signal?: AbortSignal): Promise<Sensor> => {
    const response = await apiClient.get<ApiResponse<BackendSensor>>(`/sensors/${id}`, signal);
    return normalizeSensor(unwrapApiData(response));
  },

  update: async (id: string, data: Partial<CreateSensorInput>): Promise<Sensor> => {
    const response = await apiClient.put<ApiResponse<BackendSensor>>(`/sensors/${id}`, toBackendInput(data));
    return normalizeSensor(unwrapApiData(response));
  },

  remove: async (id: string): Promise<{ message: string }> => {
    const response = await apiClient.delete<ApiResponse<{ message: string }>>(`/sensors/${id}`);
    return unwrapApiData(response);
  },
};
