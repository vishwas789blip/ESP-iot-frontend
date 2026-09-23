import { useState, useMemo } from 'react';
import { Activity, Filter } from 'lucide-react';
import { useRealtimeData } from '@/hooks/useRealtimeData';
import { useRealtime } from '@/context/RealtimeContext';
import { eventApi } from '@/services';
import type { AppEvent, EventType } from '@/types';
import { EventTimeline } from '@/components/EventTimeline';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { CardSkeleton } from '@/components/ui/LoadingSkeleton';

const filters: { value: EventType | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'system', label: 'System' },
  { value: 'sensor', label: 'Sensor' },
  { value: 'actuator', label: 'Actuator' },
  { value: 'automation', label: 'Automation' },
  { value: 'device', label: 'Device' },
  { value: 'config', label: 'Config' },
  { value: 'firmware', label: 'Firmware' },
];

export function EventsPage() {
  const [filter, setFilter] = useState<EventType | 'all'>('all');
  const { events: liveEvents, setInitialEvents } = useRealtime();

  const { loading, error, refetch } = useRealtimeData<AppEvent[]>({
    fetcher: (signal) => eventApi.list(signal),
    onLoaded: setInitialEvents,
  });

  const filtered = useMemo(() => {
    if (filter === 'all') return liveEvents;
    return liveEvents.filter((e) => e.type === filter);
  }, [liveEvents, filter]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
        <p className="text-sm text-gray-500">Live system event log and activity timeline</p>
        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="w-4 h-4 text-gray-500" />
          {filters.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                filter === f.value
                  ? 'bg-accent-cyan/20 text-accent-cyan border border-accent-cyan/40'
                  : 'bg-ink-700/50 text-gray-400 border border-white/5 hover:border-white/10'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <CardSkeleton />
      ) : error ? (
        <ErrorState message="Unable to load events from backend" onRetry={refetch} />
      ) : filtered.length > 0 ? (
        <div className="glass-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-white uppercase tracking-wide flex items-center gap-2">
              <Activity className="w-4 h-4 text-accent-blue" />
              {filtered.length} {filtered.length === 1 ? 'Event' : 'Events'}
            </h3>
            <Button variant="ghost" size="sm" onClick={refetch}>Refresh</Button>
          </div>
          <EventTimeline events={filtered} />
        </div>
      ) : (
        <div className="glass-card">
          <EmptyState icon={Activity} title="No events found" description={filter === 'all' ? "No system events have been recorded yet." : `No ${filter} events found.`} />
        </div>
      )}
    </div>
  );
}
