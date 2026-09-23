export interface User {
  _id: string;
  name: string;
  email: string;
  createdAt?: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export type DeviceStatus = 'online' | 'offline' | 'warning' | 'error';

export interface Device {
  _id: string;
  userId: string;
  deviceId: string;
  name: string;
  description?: string;
  connectionType: string;
  ipAddress: string;
  firmwareVersion: string;
  status: DeviceStatus;
  lastSeen?: string;
  sensors?: Sensor[];
  actuators?: Actuator[];
  config?: DeviceConfig;
}

export interface DeviceConfig {
  pirEnabled?: boolean;
  buzzerDuration?: number;
  [key: string]: unknown;
}

export type SensorType = 'pir' | 'temperature' | 'humidity' | 'light' | 'analog' | 'digital' | string;
export type SensorStatus = 'active' | 'inactive' | 'error' | 'warning';

export interface Sensor {
  _id: string;
  deviceId: string;
  name: string;
  type: SensorType;
  gpio: number;
  value: string | number | boolean | null;
  unit?: string;
  status: SensorStatus;
  lastUpdated?: string;
}

export type ActuatorType = 'buzzer' | 'relay' | 'led' | 'motor' | 'switch' | string;

export interface Actuator {
  _id: string;
  deviceId: string;
  name: string;
  type: ActuatorType;
  gpio: number;
  state: string | boolean;
  lastActivated?: string;
}

export interface CommandPayload {
  command: string;
  duration?: number;
  [key: string]: unknown;
}

export interface AutomationCondition {
  sensorId?: string;
  sensorName?: string;
  field?: string;
  operator: string;
  value: string | number | boolean;
}

export interface AutomationAction {
  actuatorId?: string;
  actuatorName?: string;
  command: string;
  duration?: number;
}

export interface Automation {
  _id: string;
  userId: string;
  deviceId: string;
  deviceName?: string;
  name: string;
  conditions: AutomationCondition[];
  actions: AutomationAction[];
  enabled: boolean;
  lastExecuted?: string;
  createdAt?: string;
}

export type EventType = 'system' | 'sensor' | 'actuator' | 'automation' | 'device' | 'config' | 'firmware';

export interface AppEvent {
  _id: string;
  deviceId?: string;
  deviceName?: string;
  type: EventType;
  message: string;
  timestamp: string;
  severity?: 'info' | 'warning' | 'error' | 'success';
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface ApiError {
  message: string;
  status?: number;
  code?: string;
}

export interface FirmwareInfo {
  version: string;
  name?: string;
  buildDate?: string;
  status: 'current' | 'update-available' | 'failed' | 'uploading';
  notes?: string;
  size?: number;
}

export interface FirmwareVersion {
  _id: string;
  version: string;
  name: string;
  buildDate: string;
  notes: string;
  size?: number;
  status: 'current' | 'available' | 'deprecated';
  devices?: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}