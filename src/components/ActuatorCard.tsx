import { useState } from 'react';
import { Volume2, Power, Send, Clock } from 'lucide-react';
import type { Actuator } from '@/types';
import { actuatorApi } from '@/services';
import { Button } from './ui/Button';
import { useToast } from '@/context/ToastContext';
import { Badge } from './ui/Badge';

interface ActuatorCardProps {
  actuator: Actuator;
  onChanged?: () => void;
}

const DURATIONS = [
  { label: '1 sec', value: 1 },
  { label: '3 sec', value: 3 },
  { label: '5 sec', value: 5 },
  { label: '10 sec', value: 10 },
  { label: '30 sec', value: 30 },
  { label: 'Custom', value: -1 },
];

function isOn(state: string | boolean): boolean {
  return state === true || state === 'true' || state === 'on' || state === 'ON' || state === '1' || state === 'HIGH';
}

export function ActuatorCard({ actuator, onChanged }: ActuatorCardProps) {
  const { show } = useToast();
  const [duration, setDuration] = useState(5);
  const [customDuration, setCustomDuration] = useState(5);
  const [sending, setSending] = useState<'ON' | 'OFF' | null>(null);

  const active = isOn(actuator.state);
  const isBuzzer = actuator.type === 'buzzer';

  const sendCommand = async (command: 'ON' | 'OFF') => {
    setSending(command);
    try {
      const dur = command === 'ON' ? (duration === -1 ? customDuration : duration) : undefined;
      await actuatorApi.sendCommand(actuator._id, { command, ...(dur ? { duration: dur } : {}) });
      show(`Command sent to ESP32: ${command}${dur ? ` for ${dur}s` : ''}`, 'success');
      onChanged?.();
    } catch (err) {
      const msg = err && typeof err === 'object' && 'message' in err ? (err as { message: string }).message : 'Failed to send command';
      show(msg, 'error');
    } finally {
      setSending(null);
    }
  };

  return (
    <div
      className={`relative overflow-hidden rounded-xl border p-6 transition-all ${
        active
          ? 'bg-accent-amber/5 border-accent-amber/30 shadow-glow-amber'
          : 'glass-card hover:border-white/10'
      }`}
    >
      {active && <div className="absolute inset-0 grid-bg opacity-20" />}

      <div className="relative flex items-start justify-between mb-5">
        <div className="flex items-center gap-3">
          <div
            className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
              active ? 'bg-accent-amber/20' : 'bg-ink-700/80 border border-white/5'
            }`}
          >
            <Volume2 className={`w-6 h-6 ${active ? 'text-accent-amber animate-pulse' : 'text-gray-500'}`} />
          </div>
          <div>
            <h3 className="font-semibold text-white text-base">{actuator.name}</h3>
            <p className="text-xs text-gray-500 font-mono capitalize">{actuator.type} · GPIO {actuator.gpio}</p>
          </div>
        </div>
        <Badge variant={active ? 'warning' : 'default'} dot>
          {active ? 'ON' : 'OFF'}
        </Badge>
      </div>

      <div className="relative space-y-4">
        {isBuzzer && (
          <div>
            <label className="flex items-center gap-1.5 text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">
              <Clock className="w-3.5 h-3.5" />
              Duration
            </label>
            <div className="flex flex-wrap gap-2">
              {DURATIONS.map((d) => (
                <button
                  key={d.value}
                  onClick={() => setDuration(d.value)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    duration === d.value
                      ? 'bg-accent-cyan/20 text-accent-cyan border border-accent-cyan/40'
                      : 'bg-ink-700/50 text-gray-400 border border-white/5 hover:border-white/10'
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>
            {duration === -1 && (
              <div className="mt-2 flex items-center gap-2">
                <input
                  type="number"
                  min={1}
                  max={60}
                  value={customDuration}
                  onChange={(e) => setCustomDuration(Math.max(1, Math.min(60, Number(e.target.value))))}
                  className="w-20 bg-ink-700/50 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-accent-cyan/50"
                />
                <span className="text-xs text-gray-500">seconds (1-60)</span>
              </div>
            )}
          </div>
        )}

        <div className="flex gap-3">
          <Button
            onClick={() => sendCommand('ON')}
            loading={sending === 'ON'}
            disabled={sending !== null}
            variant={active ? 'secondary' : 'primary'}
            className="flex-1"
          >
            <Power className="w-4 h-4" />
            Turn ON
          </Button>
          <Button
            onClick={() => sendCommand('OFF')}
            loading={sending === 'OFF'}
            disabled={sending !== null}
            variant={active ? 'danger' : 'outline'}
            className="flex-1"
          >
            <Power className="w-4 h-4" />
            Turn OFF
          </Button>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-gray-500 pt-1">
          <Send className="w-3 h-3" />
          Commands are sent via REST API → MQTT → ESP32
        </div>
      </div>
    </div>
  );
}
