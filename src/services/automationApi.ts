import { apiClient } from './apiClient';
import { unwrapApiData, type ApiResponse } from './apiTypes';
import type { Automation } from '@/types';

export interface CreateAutomationInput {
  deviceId: string;
  name: string;
  conditions: Automation['conditions'];
  actions: Automation['actions'];
  enabled?: boolean;
}

export interface TestAutomationResult {
  tested: boolean;
  triggered: boolean;
  automationId: string;
  automationName: string;
  sensorId: string;
  sensorName: string;
  gpio: number;
  simulatedValue?: unknown;
  topic: string;
  message: string;
}

export const automationApi = {
  list: async (signal?: AbortSignal): Promise<Automation[]> => {
    const response = await apiClient.get<ApiResponse<Automation[]>>('/automations', signal);
    return unwrapApiData(response);
  },

  get: async (id: string, signal?: AbortSignal): Promise<Automation> => {
    const response = await apiClient.get<ApiResponse<Automation>>(`/automations/${id}`, signal);
    return unwrapApiData(response);
  },

  create: async (data: CreateAutomationInput): Promise<Automation> => {
    const response = await apiClient.post<ApiResponse<Automation>>('/automations', data);
    return unwrapApiData(response);
  },

  update: async (id: string, data: Partial<CreateAutomationInput>): Promise<Automation> => {
    const response = await apiClient.put<ApiResponse<Automation>>(`/automations/${id}`, data);
    return unwrapApiData(response);
  },

  remove: async (id: string): Promise<{ message: string }> => {
    const response = await apiClient.delete<ApiResponse<{ message: string }>>(`/automations/${id}`);
    return unwrapApiData(response);
  },

  toggle: async (id: string): Promise<Automation> => {
    const response = await apiClient.patch<ApiResponse<Automation>>(`/automations/${id}/toggle`);
    return unwrapApiData(response);
  },

  test: async (id: string): Promise<TestAutomationResult> => {
    const response = await apiClient.post<ApiResponse<TestAutomationResult>>(
      `/automations/${id}/test`,
    );
    return unwrapApiData(response);
  },
};
