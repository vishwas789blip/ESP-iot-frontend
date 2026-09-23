import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import type {
  Device,
  Sensor,
  Actuator,
  Automation,
  AppEvent,
  DeviceStatus,
} from '@/types';
import type { WsMessage, WsConnectionState } from '@/types/websocket';
import { getToken } from '@/services/apiClient';
import { env } from '@/config/env';
import { normalizeEntityId, wsEventToAppEvent } from '@/utils/wsHelpers';

const MAX_EVENTS = 100;

const WS_BASE = env.wsUrl;


export function getWsUrl(): string {
  return WS_BASE;
}

interface RealtimeContextValue {
  connectionState: WsConnectionState;
  mqttConnected: boolean;
  events: AppEvent[];
  devices: Record<string, Device>;
  sensors: Record<string, Sensor>;
  actuators: Record<string, Actuator>;
  automations: Record<string, Automation>;
  telemetry: Record<string, { readings: Record<string, unknown>; timestamp: number }>;
  setInitialDevices: (devices: Device[]) => void;
  setInitialSensors: (deviceId: string, sensors: Sensor[]) => void;
  setInitialActuators: (deviceId: string, actuators: Actuator[]) => void;
  setInitialAutomations: (automations: Automation[]) => void;
  setInitialEvents: (events: AppEvent[]) => void;
  upsertDevice: (device: Device) => void;
  upsertSensor: (sensor: Sensor) => void;
  upsertActuator: (actuator: Actuator) => void;
  upsertAutomation: (automation: Automation) => void;
  removeAutomation: (id: string) => void;
  clearAll: () => void;
}

const RealtimeContext = createContext<RealtimeContextValue | undefined>(undefined);

export function RealtimeProvider({ children }: { children: ReactNode }) {
  const [connectionState, setConnectionState] = useState<WsConnectionState>('disconnected');
  const [mqttConnected, setMqttConnected] = useState(false);
  const [events, setEvents] = useState<AppEvent[]>([]);
  const [devices, setDevices] = useState<Record<string, Device>>({});
  const [sensors, setSensors] = useState<Record<string, Sensor>>({});
  const [actuators, setActuators] = useState<Record<string, Actuator>>({});
  const [automations, setAutomations] = useState<Record<string, Automation>>({});
  const [telemetry, setTelemetry] = useState<Record<string, { readings: Record<string, unknown>; timestamp: number }>>({});

  const wsRef = useRef<WebSocket | null>(null);
  const devicesRef = useRef<Record<string, Device>>({});
  const reconnectAttemptRef = useRef(0);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);

  devicesRef.current = devices;

  const handleMessage = useCallback((raw: string) => {
    let msg: WsMessage;
    try {
      msg = JSON.parse(raw) as WsMessage;
    } catch {
      return;
    }
    if (!msg || typeof msg.type !== 'string') return;

    switch (msg.type) {
      case 'device_snapshot': {
        const snapshotDevices = Array.isArray(msg.devices) ? msg.devices : [];

        setDevices(() => {
          const next: Record<string, Device> = {};

          for (const raw of snapshotDevices) {
            const device = raw as Device;
            const id = normalizeEntityId(device as unknown as Record<string, unknown>);

            if (id) {
              next[id] = { ...device, _id: id };
            }
          }

          return next;
        });

        break;
      }
      case 'event_snapshot': {
        const snapshotEvents = Array.isArray(msg.events) ? msg.events : [];

        setEvents(
          snapshotEvents
            .map((event) =>
              wsEventToAppEvent({
                type: 'event',
                event,
                timestamp: new Date().toISOString(),
              }),
            )
            .slice(0, MAX_EVENTS),
        );

        break;
      }
      case 'sensor_snapshot': {
        const list = Array.isArray(msg.sensors) ? msg.sensors : [];

        setSensors(() => {
          const next: Record<string, Sensor> = {};

          for (const raw of list) {
            const sensor = raw as Sensor;
            const id = normalizeEntityId(sensor as unknown as Record<string, unknown>);

            if (id) {
              next[id] = {
                ...sensor,
                _id: id,
                deviceId: String(sensor.deviceId),
              };
            }
          }

          return next;
        });

        break;
      }
      case 'actuator_snapshot': {
        const list = Array.isArray(msg.actuators) ? msg.actuators : [];

        setActuators(() => {
          const next: Record<string, Actuator> = {};

          for (const raw of list) {
            const actuator = raw as Actuator;
            const id = normalizeEntityId(actuator as unknown as Record<string, unknown>);

            if (id) {
              next[id] = {
                ...actuator,
                _id: id,
                deviceId: String(actuator.deviceId),
              };
            }
          }

          return next;
        });

        break;
      }
      case 'automation_snapshot': {
        const list = Array.isArray(msg.automations) ? msg.automations : [];

        setAutomations(() => {
          const next: Record<string, Automation> = {};

          for (const raw of list) {
            const automation = raw as Automation;
            const id = normalizeEntityId(automation as unknown as Record<string, unknown>);

            if (id) {
              next[id] = {
                ...automation,
                _id: id,
                deviceId: String(automation.deviceId),
              };
            }
          }

          return next;
        });

        break;
      }
      case 'connection_status': {
        setConnectionState(msg.status === 'connected' ? 'connected' : 'reconnecting');
        setMqttConnected(msg.mqtt === 'connected');
        break;
      }
      case 'device_status': {
        const { deviceId, status } = msg;
        setDevices((prev) => {
          const existing = Object.values(prev).find((d) => d.deviceId === deviceId);
          if (!existing) return prev;
          return {
            ...prev,
            [existing._id]: { ...existing, status: status as DeviceStatus, lastSeen: new Date().toISOString() },
          };
        });
        break;
      }
      case 'device_update': {
        const d = msg.device;
        setDevices((prev) => ({ ...prev, [d._id]: { ...prev[d._id], ...d } }));
        break;
      }
      case 'telemetry': {
        const { deviceId: hardwareDeviceId, data, timestamp } = msg;
        const parsedTimestamp =
          typeof timestamp === 'string'
            ? Date.parse(timestamp)
            : Number(timestamp);

        const eventTimestamp =
          Number.isFinite(parsedTimestamp) && parsedTimestamp > 0
            ? parsedTimestamp
            : Date.now();

        const readings =
          data.readings && typeof data.readings === 'object'
            ? { ...data.readings, ...data }
            : { ...data };

        delete readings.readings;

        setTelemetry((prev) => ({
          ...prev,
          [hardwareDeviceId]: {
            readings,
            timestamp: eventTimestamp,
          },
        }));

        const device = Object.values(devicesRef.current).find(
          (entry) => entry.deviceId === hardwareDeviceId,
        );

        if (!device) break;

        const mongoDeviceId = device._id;
        const pir =
          typeof readings.pir === 'boolean'
            ? readings.pir
            : typeof readings.pirState === 'boolean'
              ? readings.pirState
              : undefined;
        const buzzer =
          typeof readings.buzzer === 'boolean' ? readings.buzzer : undefined;

        // Keep entity state in sync without nesting state updates inside another updater.
        if (pir !== undefined) {
          setSensors((prev) => {
            const next = { ...prev };
            for (const sensor of Object.values(next)) {
              if (sensor.deviceId === mongoDeviceId && sensor.type === 'pir') {
                next[sensor._id] = {
                  ...sensor,
                  value: pir,
                  lastUpdated: new Date(eventTimestamp).toISOString(),
                  status: pir ? 'active' : 'inactive',
                };
              }
            }
            return next;
          });
        }

        if (buzzer !== undefined) {
          setActuators((prev) => {
            const next = { ...prev };
            for (const actuator of Object.values(next)) {
              if (actuator.deviceId === mongoDeviceId && actuator.type === 'buzzer') {
                next[actuator._id] = {
                  ...actuator,
                  state: buzzer,
                  lastActivated: buzzer
                    ? new Date(eventTimestamp).toISOString()
                    : actuator.lastActivated,
                };
              }
            }
            return next;
          });
        }

        setDevices((prev) => ({
          ...prev,
          [mongoDeviceId]: {
            ...device,
            status: 'online',
            lastSeen: new Date(eventTimestamp).toISOString(),
          },
        }));

        break;
      }
      case 'sensor_update': {
        const { sensor } = msg;
        const sensorId = normalizeEntityId(sensor as unknown as Record<string, unknown>);

        if (!sensorId) {
          break;
        }

        setSensors((prev) => ({
          ...prev,
          [sensorId]: {
            ...prev[sensorId],
            ...sensor,
            _id: sensorId,
            deviceId: String(sensor.deviceId),
          },
        }));
        break;
      }
      case 'actuator_update': {
        const { actuator } = msg;
        const actuatorId = normalizeEntityId(actuator as unknown as Record<string, unknown>);

        if (!actuatorId) {
          break;
        }

        setActuators((prev) => ({
          ...prev,
          [actuatorId]: {
            ...prev[actuatorId],
            ...actuator,
            _id: actuatorId,
            deviceId: String(actuator.deviceId),
          },
        }));
        break;
      }
      case 'event': {
        const appEvent = wsEventToAppEvent(msg as unknown as Record<string, unknown>);
        setEvents((prev) => [appEvent, ...prev].slice(0, MAX_EVENTS));
        break;
      }
      case 'rule_update':
      case 'automation_update': {
        if (msg.type === 'rule_update') {
          setAutomations(() => {
            const next: Record<string, Automation> = {};
            for (const a of msg.rules) next[a._id] = a;
            return next;
          });
        } else {
          const a = msg.automation;
          setAutomations((prev) => ({ ...prev, [a._id]: a }));
        }
        break;
      }
      case 'error': {
        break;
      }
    }
  }, []);

  const connect = useCallback(() => {
    if (wsRef.current && (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING)) {
      return;
    }

    const token = getToken();
    const url = token ? `${WS_BASE}?token=${encodeURIComponent(token)}` : WS_BASE;

    let ws: WebSocket;
    try {
      ws = new WebSocket(url);
    } catch {
      scheduleReconnect();
      return;
    }
    wsRef.current = ws;

    ws.onopen = () => {
      if (!mountedRef.current) return;
      reconnectAttemptRef.current = 0;
      setConnectionState('connected');
    };

    ws.onmessage = (e) => {
      if (mountedRef.current && typeof e.data === 'string') {
        handleMessage(e.data);
      }
    };

    ws.onerror = () => {
      // onclose will handle reconnect
    };

    ws.onclose = () => {
      if (!mountedRef.current) return;
      setMqttConnected(false);
      setConnectionState('reconnecting');
      scheduleReconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [handleMessage]);

  function scheduleReconnect() {
    if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
    const attempt = reconnectAttemptRef.current;
    const baseDelay = Math.min(1000 * Math.pow(2, attempt), 30000);
    const jitter = Math.floor(Math.random() * 500);
    const delay = baseDelay + jitter;
    reconnectAttemptRef.current = attempt + 1;
    reconnectTimerRef.current = setTimeout(() => {
      if (mountedRef.current) connect();
    }, delay);
  }

useEffect(() => {
  mountedRef.current = true;

  const handleAuthChange = () => {
    const token = getToken();

    if (token) {
      reconnectAttemptRef.current = 0;
      connect();
      return;
    }

    // User logged out
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }

    if (wsRef.current) {
      wsRef.current.onclose = null;
      wsRef.current.close();
      wsRef.current = null;
    }

    setConnectionState('disconnected');
    setMqttConnected(false);

    setEvents([]);
    setDevices({});
    setSensors({});
    setActuators({});
    setAutomations({});
    setTelemetry({});
  };

  // Initial connection if already logged in
  if (getToken()) {
    connect();
  }

  // React immediately to login/logout
  window.addEventListener('auth-token-changed', handleAuthChange);

  return () => {
    mountedRef.current = false;

    window.removeEventListener(
      'auth-token-changed',
      handleAuthChange,
    );

    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }

    if (wsRef.current) {
      wsRef.current.onclose = null;
      wsRef.current.close();
      wsRef.current = null;
    }
  };
}, [connect]);

const setInitialDevices = useCallback((initial: Device[] | undefined | null) => {
  const list = Array.isArray(initial) ? initial : [];

  setDevices(() => {
    const next: Record<string, Device> = {};

    for (const d of list) {
      next[d._id] = d;
    }

    return next;
  });
}, []);

const setInitialSensors = useCallback(
  (_deviceId: string, initial: Sensor[] | undefined | null) => {
    const list = Array.isArray(initial) ? initial : [];

    setSensors((prev) => {
      const next = { ...prev };

      for (const s of list) {
        next[s._id] = s;
      }

      return next;
    });
  },
  [],
);

const setInitialActuators = useCallback(
  (_deviceId: string, initial: Actuator[] | undefined | null) => {
    const list = Array.isArray(initial) ? initial : [];

    setActuators((prev) => {
      const next = { ...prev };

      for (const a of list) {
        next[a._id] = a;
      }

      return next;
    });
  },
  [],
);

  const setInitialAutomations = useCallback((initial: Automation[] | undefined | null) => {
    const list = Array.isArray(initial) ? initial : [];

    setAutomations(() => {
      const next: Record<string, Automation> = {};
      for (const a of list) next[a._id] = a;
      return next;
    });
  }, []);

  const setInitialEvents = useCallback((initial: AppEvent[] | undefined | null) => {
    const list = Array.isArray(initial) ? initial : [];
    setEvents(list.slice(0, MAX_EVENTS));
  }, []);

  const upsertDevice = useCallback((d: Device) => {
    setDevices((prev) => ({ ...prev, [d._id]: { ...prev[d._id], ...d } }));
  }, []);

  const upsertSensor = useCallback((s: Sensor) => {
    setSensors((prev) => ({ ...prev, [s._id]: { ...prev[s._id], ...s } }));
  }, []);

  const upsertActuator = useCallback((a: Actuator) => {
    setActuators((prev) => ({ ...prev, [a._id]: { ...prev[a._id], ...a } }));
  }, []);

  const upsertAutomation = useCallback((a: Automation) => {
    setAutomations((prev) => ({ ...prev, [a._id]: a }));
  }, []);

  const removeAutomation = useCallback((id: string) => {
    setAutomations((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }, []);

  const clearAll = useCallback(() => {
    setEvents([]);
    setDevices({});
    setSensors({});
    setActuators({});
    setAutomations({});
    setTelemetry({});
  }, []);

  return (
    <RealtimeContext.Provider
      value={{
        connectionState,
        mqttConnected,
        events,
        devices,
        sensors,
        actuators,
        automations,
        telemetry,
        setInitialDevices,
        setInitialSensors,
        setInitialActuators,
        setInitialAutomations,
        setInitialEvents,
        upsertDevice,
        upsertSensor,
        upsertActuator,
        upsertAutomation,
        removeAutomation,
        clearAll,
      }}
    >
      {children}
    </RealtimeContext.Provider>
  );
}

export function useRealtime(): RealtimeContextValue {
  const ctx = useContext(RealtimeContext);
  if (!ctx) throw new Error('useRealtime must be used within RealtimeProvider');
  return ctx;
}
