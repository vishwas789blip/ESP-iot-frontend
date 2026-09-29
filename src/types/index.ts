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
  protocolVersion?: string;
  telemetryInterval?: number;
  mqttKeepAlive?: number;
  autoReconnect?: boolean;
  maxAutomations?: number;
  supportedInterfaces?: HardwareInterface[];
  sensors?: Array<Record<string, unknown>>;
  actuators?: Array<Record<string, unknown>>;
  automations?: Array<Record<string, unknown>>;
  [key: string]: unknown;
}

// ---------------------------------------------------------------------------
// NEW: Hardware interface (sensor/actuator kis tarah ESP32 se juda hai)
// HardwareConfigFields.tsx ke dropdown ki values isi se match honi chahiye.
// ---------------------------------------------------------------------------
export type HardwareInterface = 'gpio' | 'pwm' | 'adc' | 'i2c' | 'spi' | 'uart' | 'virtual' | 'custom';

// NEW: Sensor aur Actuator dono ke common hardware fields
export interface HardwareConfig {
  interface?: HardwareInterface;                 // default 'gpio'
  gpio?: number;                                 // single pin (gpio/pwm/adc)
  pins?: Record<string, number | string>;        // multi-pin, e.g. { sda: 21, scl: 22 }
  address?: string;                              // I2C address / UART port
  parameters?: Record<string, unknown>;          // extra settings, e.g. { activeLow: true }
}

export type SensorType = 'pir' | 'temperature' | 'humidity' | 'light' | 'analog' | 'digital' | string;
export type SensorStatus = 'active' | 'inactive' | 'error' | 'warning';

export interface Sensor extends HardwareConfig {
  _id: string;
  deviceId: string;
  name: string;
  type: SensorType;
  value: string | number | boolean | null;
  unit?: string;
  status: SensorStatus;
  lastUpdated?: string;
}

export type ActuatorType = 'buzzer' | 'relay' | 'led' | 'motor' | 'servo' | 'fan' | 'switch' | 'custom' | string;

export interface Actuator extends HardwareConfig {
  _id: string;
  deviceId: string;
  name: string;
  type: ActuatorType;
  state: string | boolean;
  unit?: string;
  lastActivated?: string;
}

export interface CommandPayload {
  command: string;
  value?: boolean | number | string;   // NEW: PWM duty, servo angle, etc.
  duration?: number;                   // auto-off seconds
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