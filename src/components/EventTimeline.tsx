import type { AppEvent, EventType } from '@/types';
import {
  Cpu,
  Waves,
  Volume2,
  Zap,
  Settings,
  Download,
  Power,
  type LucideIcon,
} from 'lucide-react';

const iconMap: Record<EventType, LucideIcon> = {
  system: Cpu,
  sensor: Waves,
  actuator: Volume2,
  automation: Zap,
  device: Power,
  config: Settings,
  firmware: Download,
};

const colorMap: Record<EventType, string> = {
  system: 'text-accent-blue bg-accent-blue/10',
  sensor: 'text-accent-cyan bg-accent-cyan/10',
  actuator: 'text-accent-amber bg-accent-amber/10',
  automation: 'text-accent-green bg-accent-green/10',
  device: 'text-accent-violet bg-accent-violet/10',
  config: 'text-gray-400 bg-gray-500/10',
  firmware: 'text-accent-red bg-accent-red/10',
};

interface EventTimelineProps {
  events: AppEvent[];
  limit?: number;
}

export function EventTimeline({ events, limit }: EventTimelineProps) {
  const displayed = limit ? events.slice(0, limit) : events;

  if (displayed.length === 0) {
    return (
      <div className="text-center py-8 text-sm text-gray-500">No events recorded</div>
    );
  }

  return (
    <div className="relative">
      <div className="absolute left-5 top-2 bottom-2 w-px bg-gradient-to-b from-white/10 via-white/5 to-transparent" />
      <div className="space-y-1">
        {displayed.map((event, i) => {
          const Icon = iconMap[event.type] || Cpu;
          const color = colorMap[event.type] || colorMap.system;
          return (
            <div
              key={event._id || i}
              className="relative flex items-start gap-4 p-3 rounded-lg hover:bg-white/5 transition-colors animate-fade-in"
              style={{ animationDelay: `${i * 30}ms` }}
            >
              <div className={`relative z-10 w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
                <Icon className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-200">{event.message}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-gray-500 capitalize">{event.type}</span>
                  {event.deviceName && (
                    <>
                      <span className="text-xs text-gray-600">·</span>
                      <span className="text-xs text-gray-500">{event.deviceName}</span>
                    </>
                  )}
                  <span className="text-xs text-gray-600">·</span>
                  <span className="text-xs text-gray-500">
                    {new Date(event.timestamp).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
