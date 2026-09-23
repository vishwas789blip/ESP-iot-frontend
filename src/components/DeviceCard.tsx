import { Link } from 'react-router-dom';
import { Wifi, Cpu, Eye, Pencil, Trash2, Activity, Radio, CircuitBoard } from 'lucide-react';
import type { Device } from '@/types';
import { StatusBadge } from './StatusBadge';
import { Badge } from './ui/Badge';

interface DeviceCardProps {
  device: Device;
  sensorCount?: number;
  actuatorCount?: number;
  onDelete?: (device: Device) => void;
  onHeartbeat?: (device: Device) => void;
}

export function DeviceCard({ device, sensorCount, actuatorCount, onDelete, onHeartbeat }: DeviceCardProps) {
  return (
    <div className="glass-card p-5 hover:border-accent-cyan/20 transition-all group relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-accent-cyan/5 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />

      <div className="flex items-start justify-between mb-4 relative">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-ink-700/80 border border-white/5 flex items-center justify-center group-hover:border-accent-cyan/30 transition-colors">
            <CircuitBoard className="w-6 h-6 text-accent-cyan" />
          </div>
          <div>
            <h3 className="font-semibold text-white text-base group-hover:text-accent-cyan transition-colors">
              {device.name}
            </h3>
            <p className="text-xs text-gray-500 font-mono">{device.deviceId}</p>
          </div>
        </div>
        <StatusBadge status={device.status} size="sm" />
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <Wifi className="w-3.5 h-3.5 text-gray-500" />
          <span>{device.connectionType || 'WiFi'}</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-400 font-mono">
          <Radio className="w-3.5 h-3.5 text-gray-500" />
          <span className="truncate">{device.ipAddress || '—'}</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <Cpu className="w-3.5 h-3.5 text-gray-500" />
          <span className="truncate">{device.firmwareVersion || '—'}</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <Activity className="w-3.5 h-3.5 text-gray-500" />
          <span>{device.lastSeen ? new Date(device.lastSeen).toLocaleTimeString() : 'Never'}</span>
        </div>
      </div>

      <div className="flex items-center gap-2 mb-4">
        <Badge variant="cyan">{sensorCount ?? device.sensors?.length ?? 0} Sensors</Badge>
        <Badge variant="info">{actuatorCount ?? device.actuators?.length ?? 0} Actuators</Badge>
      </div>

      <div className="flex items-center gap-2 pt-3 border-t border-white/5">
        <Link
          to={`/devices/${device._id}`}
          className="flex-1 inline-flex items-center justify-center gap-1.5 text-xs font-medium text-accent-cyan hover:bg-accent-cyan/10 px-3 py-2 rounded-lg transition-colors"
        >
          <Eye className="w-3.5 h-3.5" />
          View
        </Link>
        <Link
          to={`/devices/${device._id}/edit`}
          className="inline-flex items-center justify-center gap-1.5 text-xs font-medium text-gray-400 hover:text-white hover:bg-white/5 px-3 py-2 rounded-lg transition-colors"
        >
          <Pencil className="w-3.5 h-3.5" />
        </Link>
        {onHeartbeat && (
          <button
            onClick={() => onHeartbeat(device)}
            className="inline-flex items-center justify-center gap-1.5 text-xs font-medium text-gray-400 hover:text-accent-green hover:bg-accent-green/10 px-3 py-2 rounded-lg transition-colors"
            title="Test connection"
          >
            <Activity className="w-3.5 h-3.5" />
          </button>
        )}
        {onDelete && (
          <button
            onClick={() => onDelete(device)}
            className="inline-flex items-center justify-center gap-1.5 text-xs font-medium text-gray-400 hover:text-accent-red hover:bg-accent-red/10 px-3 py-2 rounded-lg transition-colors"
            title="Delete"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
