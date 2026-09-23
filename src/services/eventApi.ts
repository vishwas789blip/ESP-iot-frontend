import { apiClient } from './apiClient';
import { unwrapApiData, type ApiResponse } from './apiTypes';
import type { AppEvent, EventType } from '@/types';

function normalizeEvent(raw: Record<string, unknown>): AppEvent {
  return {
    _id: String(raw._id ?? raw.id ?? `${Date.now()}-${Math.random()}`),
    deviceId: raw.deviceId ? String(raw.deviceId) : undefined,
    deviceName: raw.deviceName ? String(raw.deviceName) : undefined,
    type: (['system', 'sensor', 'actuator', 'automation', 'device', 'config', 'firmware'].includes(String(raw.type))
      ? raw.type
      : 'system') as EventType,
    message: String(raw.message ?? 'Event received'),
    timestamp: String(raw.timestamp ?? raw.createdAt ?? new Date().toISOString()),
    severity: (['info', 'warning', 'error', 'success'].includes(String(raw.severity))
      ? raw.severity
      : 'info') as AppEvent['severity'],
  };
}

export const eventApi = {
  list: async (signal?: AbortSignal): Promise<AppEvent[]> => {
    const response = await apiClient.get<ApiResponse<Record<string, unknown>[]>>('/events', signal);
    return unwrapApiData(response).map(normalizeEvent);
  },
};

export function isEventType(value: string): value is EventType {
  return ['system', 'sensor', 'actuator', 'automation', 'device', 'config', 'firmware'].includes(value);
}
