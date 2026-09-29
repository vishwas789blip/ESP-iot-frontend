import { Radio, Waves, Gauge } from 'lucide-react';
import type { Sensor } from '@/types';
import { StatusBadge } from './StatusBadge';

interface SensorCardProps {
  sensor: Sensor;
  onClick?: () => void;
}

function formatValue(sensor: Sensor): { display: string; isBinary: boolean; active: boolean } {
  const v = sensor.value;
  // Only treat as a binary/motion-style sensor when the value is actually
  // boolean-shaped, or the sensor is explicitly a PIR — never based on a
  // numeric reading coincidentally equaling 1 (e.g. 1°C, 1 lux, etc.).
  const isBinary = String(sensor.type).toLowerCase() === 'pir' || typeof v === 'boolean' || v === 'true' || v === 'false' || v === 'HIGH' || v === 'LOW';
  if (isBinary) {
    const active = v === true || v === 'true' || v === 1 || v === '1' || v === 'HIGH';
    const label = String(sensor.type).toLowerCase() === 'pir'
      ? (active ? 'MOTION DETECTED' : 'NO MOTION')
      : (active ? 'ACTIVE' : 'INACTIVE');
    return { display: label, isBinary: true, active };
  }
  return { display: v == null ? '—' : String(v), isBinary: false, active: false };
}

export function SensorCard({ sensor, onClick }: SensorCardProps) {
  const { display, isBinary, active } = formatValue(sensor);

  if (isBinary) {
    return (
      <div
        onClick={onClick}
        className={`relative overflow-hidden rounded-xl border p-6 transition-all cursor-pointer ${
          active
            ? 'bg-accent-cyan/5 border-accent-cyan/30 shadow-glow'
            : 'glass-card hover:border-white/10'
        }`}
      >
        {active && (
          <div className="absolute inset-0 grid-bg opacity-30" />
        )}
        <div className="relative flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
                active ? 'bg-accent-cyan/20' : 'bg-ink-700/80 border border-white/5'
              }`}
            >
              <Waves className={`w-6 h-6 ${active ? 'text-accent-cyan' : 'text-gray-500'}`} />
            </div>
            <div>
              <h3 className="font-semibold text-white text-base">{sensor.name}</h3>
              <p className="text-xs text-gray-500 font-mono capitalize">{sensor.type} · GPIO {sensor.gpio}</p>
            </div>
          </div>
          <StatusBadge status={sensor.status} size="sm" />
        </div>

        <div className="relative flex flex-col items-center justify-center py-6">
          {active ? (
            <>
              <div className="relative">
                <span className="absolute inset-0 rounded-full bg-accent-cyan/40 animate-pulse-ring" />
                <div className="relative w-20 h-20 rounded-full bg-accent-cyan/20 border-2 border-accent-cyan flex items-center justify-center">
                  <Radio className="w-9 h-9 text-accent-cyan animate-pulse" />
                </div>
              </div>
              <p className="text-xl font-bold text-accent-cyan mt-4 tracking-wide">{display}</p>
              {sensor.lastUpdated && (
                <p className="text-xs text-gray-500 mt-1">
                  {new Date(sensor.lastUpdated).toLocaleTimeString()}
                </p>
              )}
            </>
          ) : (
            <>
              <div className="w-20 h-20 rounded-full bg-ink-700/60 border-2 border-white/5 flex items-center justify-center">
                <Radio className="w-9 h-9 text-gray-600" />
              </div>
              <p className="text-xl font-bold text-gray-500 mt-4 tracking-wide">{display}</p>
              <p className="text-xs text-gray-600 mt-1">Monitoring</p>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={onClick}
      className="glass-card p-5 hover:border-accent-cyan/20 transition-all cursor-pointer group"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-ink-700/80 border border-white/5 flex items-center justify-center group-hover:border-accent-cyan/30 transition-colors">
            <Gauge className="w-6 h-6 text-accent-blue" />
          </div>
          <div>
            <h3 className="font-semibold text-white text-base">{sensor.name}</h3>
            <p className="text-xs text-gray-500 font-mono capitalize">{sensor.type} · GPIO {sensor.gpio}</p>
          </div>
        </div>
        <StatusBadge status={sensor.status} size="sm" />
      </div>
      <div className="flex items-end justify-between pt-3 border-t border-white/5">
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wide">Current Value</p>
          <p className="text-2xl font-bold text-white tabular-nums mt-1">
            {display}
            {sensor.unit && <span className="text-sm text-gray-500 ml-1">{sensor.unit}</span>}
          </p>
        </div>
        {sensor.lastUpdated && (
          <p className="text-xs text-gray-600">{new Date(sensor.lastUpdated).toLocaleTimeString()}</p>
        )}
      </div>
    </div>
  );
}