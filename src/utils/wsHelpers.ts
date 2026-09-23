import type { AppEvent } from '@/types';

export function wsEventToAppEvent(event: Record<string, unknown>): AppEvent {
  const payload =
    event.event && typeof event.event === 'object'
      ? (event.event as Record<string, unknown>)
      : event;

  const eventType = String(
    payload.eventType ??
    payload.type ??
    'system',
  );

  const message = String(
    payload.message ??
    event.message ??
    'WebSocket event received',
  );

  const timestamp = String(
    payload.timestamp ??
    payload.createdAt ??
    event.timestamp ??
    new Date().toISOString(),
  );

  const severity = String(
    payload.severity ??
    'info',
  );

  const deviceId =
    payload.deviceId !== undefined
      ? String(payload.deviceId)
      : event.deviceId !== undefined
        ? String(event.deviceId)
        : undefined;

  const deviceName =
    payload.deviceName !== undefined
      ? String(payload.deviceName)
      : event.deviceName !== undefined
        ? String(event.deviceName)
        : undefined;

  return {
    _id: String(
      payload._id ??
      payload.id ??
      payload.eventId ??
      `${Date.now()}-${Math.random()}`,
    ),
    deviceId,
    deviceName,
    type: [
      'system',
      'sensor',
      'actuator',
      'automation',
      'device',
      'config',
      'firmware',
    ].includes(eventType)
      ? (eventType as AppEvent['type'])
      : 'system',
    message,
    timestamp,
    severity: ['info', 'warning', 'error', 'success'].includes(severity)
      ? (severity as AppEvent['severity'])
      : 'info',
  };
}

export function normalizeEntityId(entity: Record<string, unknown>): string {
  return String(entity._id ?? entity.id ?? '');
}
