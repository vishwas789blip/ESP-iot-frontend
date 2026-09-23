import type { Device, Sensor, Actuator, Automation, DeviceStatus, AppEvent } from './index';

export type WsMessageType =
  | 'telemetry'
  | 'device_status'
  | 'event'
  | 'rule_update'
  | 'device_update'
  | 'connection_status'
  | 'error'
  | 'sensor_update'
  | 'actuator_update'
  | 'automation_update'
  | 'device_snapshot'
  | 'sensor_snapshot'
  | 'actuator_snapshot'
  | 'automation_snapshot'
  | 'event_snapshot'
  | 'pong';

export interface WsTelemetry {
  type: 'telemetry';
  deviceId: string;
  data: {
    pir?: boolean;
    pirState?: boolean;
    buzzer?: boolean;
    readings?: Record<string, unknown>;
    [key: string]: unknown;
  };
  timestamp: string | number;
}

export interface WsDeviceStatus {
  type: 'device_status';
  deviceId: string;
  status: DeviceStatus | 'online' | 'offline';
  timestamp?: string | number;
}

export interface WsEvent {
  type: 'event';
  event?: Record<string, unknown>;
  deviceId?: string;
  data?: {
    eventType: string;
    message: string;
    [key: string]: unknown;
  };
  timestamp?: string | number;
}

export interface WsRuleUpdate {
  type: 'rule_update';
  deviceId: string;
  rules: Automation[];
}

export interface WsDeviceUpdate {
  type: 'device_update';
  device: Device;
}

export interface WsConnectionStatus {
  type: 'connection_status';
  status: 'connected' | 'disconnected';
  mqtt?: 'connected' | 'disconnected';
}

export interface WsSensorUpdate {
  type: 'sensor_update';
  sensor: Sensor;
}

export interface WsActuatorUpdate {
  type: 'actuator_update';
  actuator: Actuator;
}

export interface WsAutomationUpdate {
  type: 'automation_update';
  automation: Automation;
}

export interface WsDeviceSnapshot {
  type: 'device_snapshot';
  devices: Device[];
  timestamp?: string;
}

export interface WsSensorSnapshot {
  type: 'sensor_snapshot';
  sensors: Sensor[];
  timestamp?: string;
}

export interface WsActuatorSnapshot {
  type: 'actuator_snapshot';
  actuators: Actuator[];
  timestamp?: string;
}

export interface WsAutomationSnapshot {
  type: 'automation_snapshot';
  automations: Automation[];
  timestamp?: string;
}

export interface WsEventSnapshot {
  type: 'event_snapshot';
  events: AppEvent[] | Record<string, unknown>[];
  timestamp?: string;
}

export interface WsError {
  type: 'error';
  message: string;
}

export interface WsPong {
  type: 'pong';
  timestamp?: string;
}

export type WsMessage =
  | WsTelemetry
  | WsDeviceStatus
  | WsEvent
  | WsRuleUpdate
  | WsDeviceUpdate
  | WsConnectionStatus
  | WsSensorUpdate
  | WsActuatorUpdate
  | WsAutomationUpdate
  | WsDeviceSnapshot
  | WsSensorSnapshot
  | WsActuatorSnapshot
  | WsAutomationSnapshot
  | WsEventSnapshot
  | WsError
  | WsPong;

export type WsConnectionState = 'connected' | 'reconnecting' | 'disconnected';
