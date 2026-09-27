import { Link } from 'react-router-dom';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  CircuitBoard,
  Wifi,
  Waves,
  Volume2,
  Zap,
  Activity,
  ArrowRight,
  Power,
  Cpu,
  Radio,
} from 'lucide-react';
import { useRealtimeData } from '@/hooks/useRealtimeData';
import { useRealtime } from '@/context/RealtimeContext';
import { deviceApi, sensorApi, actuatorApi, automationApi, eventApi } from '@/services';
import type { Device, Sensor, Actuator, Automation, AppEvent } from '@/types';
import { StatCard } from '@/components/StatCard';
import { StatusBadge } from '@/components/StatusBadge';
import { SensorCard } from '@/components/SensorCard';
import { ActuatorCard } from '@/components/ActuatorCard';
import { AutomationCard } from '@/components/AutomationCard';
import { EventTimeline } from '@/components/EventTimeline';
import { CardSkeleton, StatCardSkeleton } from '@/components/ui/LoadingSkeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { Button } from '@/components/ui/Button';

export function DashboardPage() {
  const {
    events: liveEvents,
    devices: liveDevices,
    sensors: liveSensors,
    actuators: liveActuators,
    automations: liveAutomations,
    setInitialDevices,
    setInitialSensors,
    setInitialActuators,
    setInitialAutomations,
    setInitialEvents,
  } = useRealtime();

  const {
    data: devices,
    loading: devicesLoading,
    error: devicesError,
    refetch: refetchDevices,
  } = useRealtimeData<Device[]>({
    fetcher: (signal) => deviceApi.list(signal),
    onLoaded: setInitialDevices,
  });

  const allDevices = useMemo(
    () => Object.values(liveDevices),
    [liveDevices],
  );

  const primaryDevice = allDevices[0];

  // Stable key that only changes when the SET of device IDs changes —
  // not when a device's fields (status, lastSeen, ipAddress, etc.) get
  // updated over the WebSocket. Without this, every realtime device
  // update was creating a new `allDevices` array, which was creating
  // new loadSensors/loadActuators callbacks, which was re-firing the
  // effects below and re-hitting the REST API on every telemetry tick —
  // this is what was making the dashboard look like it kept reloading.
  const deviceIdsKey = useMemo(
    () => allDevices.map((d) => d._id).sort().join(','),
    [allDevices],
  );

  // Lets loadSensors/loadActuators read the latest device list without
  // needing it as a reactive dependency.
  const allDevicesRef = useRef(allDevices);
  allDevicesRef.current = allDevices;

  const [sensorsLoading, setSensorsLoading] = useState(false);
  const [sensorsError, setSensorsError] = useState<unknown>(null);

  const [actuatorsLoading, setActuatorsLoading] = useState(false);
  const [actuatorsError, setActuatorsError] = useState<unknown>(null);

  const loadSensors = useCallback(async () => {
    const currentDevices = allDevicesRef.current;
    if (currentDevices.length === 0) {
      setSensorsLoading(false);
      return;
    }

    setSensorsLoading(true);
    setSensorsError(null);

    try {
      await Promise.all(
        currentDevices.map(async (device) => {
          const sensors = await sensorApi.listByDevice(device._id);
          setInitialSensors(device._id, sensors);
        }),
      );
    } catch (error) {
      console.error('[Dashboard] Failed to load sensors:', error);
      setSensorsError(error);
    } finally {
      setSensorsLoading(false);
    }
  }, [setInitialSensors]);

  const loadActuators = useCallback(async () => {
    const currentDevices = allDevicesRef.current;
    if (currentDevices.length === 0) {
      setActuatorsLoading(false);
      return;
    }

    setActuatorsLoading(true);
    setActuatorsError(null);

    try {
      await Promise.all(
        currentDevices.map(async (device) => {
          const actuators = await actuatorApi.listByDevice(device._id);
          setInitialActuators(device._id, actuators);
        }),
      );
    } catch (error) {
      console.error('[Dashboard] Failed to load actuators:', error);
      setActuatorsError(error);
    } finally {
      setActuatorsLoading(false);
    }
  }, [setInitialActuators]);

  // Refetch only when the SET of devices actually changes (added/removed),
  // not on every field update coming through the realtime context.
  useEffect(() => {
    void loadSensors();
  }, [deviceIdsKey, loadSensors]);

  useEffect(() => {
    void loadActuators();
  }, [deviceIdsKey, loadActuators]);

  const refetchSensors = loadSensors;
  const refetchActuators = loadActuators;

  const { loading: automationsLoading } = useRealtimeData<Automation[]>({
    fetcher: (signal) => automationApi.list(signal),
    onLoaded: setInitialAutomations,
  });

  const {
    loading: eventsLoading,
    error: eventsError,
    refetch: refetchEvents,
  } = useRealtimeData<AppEvent[]>({
    fetcher: (signal) => eventApi.list(signal),
    onLoaded: setInitialEvents,
  });

  void refetchDevices;

  const onlineCount = allDevices.filter(
    (d) => d.status === 'online',
  ).length;

  const sensorsArray = Object.values(liveSensors);
  const actuatorsArray = Object.values(liveActuators);
  const automationsArray = Object.values(liveAutomations);
  const activeAutomations = automationsArray.filter((a) => a.enabled);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard
          icon={CircuitBoard}
          label="Devices"
          value={allDevices.length}
          loading={devicesLoading && allDevices.length === 0}
          color="cyan"
        />

        <StatCard
          icon={Wifi}
          label="Online"
          value={onlineCount}
          loading={devicesLoading && allDevices.length === 0}
          color="green"
        />
        <StatCard icon={Waves} label="Sensors" value={sensorsArray.length} loading={sensorsLoading} color="blue" />
        <StatCard icon={Volume2} label="Actuators" value={actuatorsArray.length} loading={actuatorsLoading} color="amber" />
        <StatCard icon={Zap} label="Automations" value={activeAutomations.length} loading={automationsLoading} color="violet" />
        <StatCard icon={Activity} label="Events" value={liveEvents.length} loading={eventsLoading} color="red" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {devicesLoading && allDevices.length === 0 ? (
            <CardSkeleton />
          ) : devicesError && allDevices.length === 0 ? (
            <ErrorState message="Unable to load device data" onRetry={refetchDevices} />
          ) : primaryDevice ? (
            <div className="glass-card p-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-40 h-40 bg-accent-cyan/5 rounded-full blur-3xl" />
              <div className="relative flex items-start justify-between mb-5">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-xl bg-accent-cyan/20 border border-accent-cyan/30 flex items-center justify-center">
                    <Cpu className="w-7 h-7 text-accent-cyan" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">{primaryDevice.name}</h2>
                    <p className="text-xs text-gray-500 font-mono">{primaryDevice.deviceId}</p>
                  </div>
                </div>
                <StatusBadge status={primaryDevice.status} />
              </div>

              <div className="relative grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
                <div className="p-3 rounded-lg bg-ink-700/40">
                  <p className="text-xs text-gray-500 uppercase tracking-wide">IP Address</p>
                  <p className="text-sm text-white font-mono mt-1">{primaryDevice.ipAddress || '—'}</p>
                </div>
                <div className="p-3 rounded-lg bg-ink-700/40">
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Firmware</p>
                  <p className="text-sm text-white mt-1">{primaryDevice.firmwareVersion || '—'}</p>
                </div>
                <div className="p-3 rounded-lg bg-ink-700/40">
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Connection</p>
                  <p className="text-sm text-white mt-1">{primaryDevice.connectionType || 'WiFi'}</p>
                </div>
                <div className="p-3 rounded-lg bg-ink-700/40">
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Last Seen</p>
                  <p className="text-sm text-white mt-1">
                    {primaryDevice.lastSeen ? new Date(primaryDevice.lastSeen).toLocaleTimeString() : '—'}
                  </p>
                </div>
              </div>

              <Link to={`/devices/${primaryDevice._id}`}>
                <Button variant="outline" size="sm">
                  View Device Details
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          ) : (
            <div className="glass-card p-6">
              <EmptyState
                icon={CircuitBoard}
                title="No devices registered"
                description="Add your first ESP32 device to start monitoring and controlling hardware."
                action={
                  <Link to="/devices">
                    <Button variant="primary" size="sm">
                      Add Device
                    </Button>
                  </Link>
                }
              />
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-white uppercase tracking-wide flex items-center gap-2">
                <Radio className="w-4 h-4 text-accent-cyan" />
                Live Sensor Status
              </h3>
              {primaryDevice && (
                <Link to="/sensors" className="text-xs text-accent-cyan hover:text-accent-cyan/80">
                  View all →
                </Link>
              )}
            </div>
            {sensorsLoading ? (
              <div className="grid md:grid-cols-2 gap-4">
                <CardSkeleton />
                <CardSkeleton />
              </div>
            ) : sensorsError ? (
              <ErrorState message="Unable to load sensors" onRetry={refetchSensors} />
            ) : sensorsArray.length > 0 ? (
              <div className="grid md:grid-cols-2 gap-4">
                {sensorsArray.slice(0, 4).map((s) => (
                  <SensorCard key={s._id} sensor={s} />
                ))}
              </div>
            ) : (
              <div className="glass-card">
                <EmptyState icon={Waves} title="No sensors configured" description="Sensors will appear here once registered on the backend." />
              </div>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-white uppercase tracking-wide flex items-center gap-2">
                <Power className="w-4 h-4 text-accent-amber" />
                Actuator Status
              </h3>
              {primaryDevice && (
                <Link to="/actuators" className="text-xs text-accent-cyan hover:text-accent-cyan/80">
                  View all →
                </Link>
              )}
            </div>
            {actuatorsLoading ? (
              <div className="grid md:grid-cols-2 gap-4">
                <CardSkeleton />
                <CardSkeleton />
              </div>
            ) : actuatorsError ? (
              <ErrorState message="Unable to load actuators" onRetry={refetchActuators} />
            ) : actuatorsArray.length > 0 ? (
              <div className="grid md:grid-cols-2 gap-4">
                {actuatorsArray.slice(0, 4).map((a) => (
                  <ActuatorCard key={a._id} actuator={a} onChanged={() => refetchActuators()} />
                ))}
              </div>
            ) : (
              <div className="glass-card">
                <EmptyState icon={Volume2} title="No actuators configured" description="Actuators will appear here once registered on the backend." />
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="glass-card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-white uppercase tracking-wide flex items-center gap-2">
                <Zap className="w-4 h-4 text-accent-green" />
                Active Automations
              </h3>
              <Link to="/automations" className="text-xs text-accent-cyan hover:text-accent-cyan/80">
                Manage →
              </Link>
            </div>
            {automationsLoading ? (
              <div className="space-y-3">
                <StatCardSkeleton />
                <StatCardSkeleton />
              </div>
            ) : activeAutomations.length > 0 ? (
              <div className="space-y-3">
                {activeAutomations.slice(0, 3).map((a) => (
                  <AutomationCard key={a._id} automation={a} onToggled={() => {}} />
                ))}
              </div>
            ) : (
              <EmptyState icon={Zap} title="No active automations" description="Create automation rules to automate your devices." />
            )}
          </div>

          <div className="glass-card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-white uppercase tracking-wide flex items-center gap-2">
                <Activity className="w-4 h-4 text-accent-blue" />
                Recent Events
              </h3>
              <Link to="/events" className="text-xs text-accent-cyan hover:text-accent-cyan/80">
                View all →
              </Link>
            </div>
            {eventsLoading ? (
              <div className="space-y-3">
                <StatCardSkeleton />
                <StatCardSkeleton />
                <StatCardSkeleton />
              </div>
            ) : eventsError ? (
              <ErrorState message="Unable to load events" onRetry={refetchEvents} />
            ) : liveEvents.length > 0 ? (
              <EventTimeline events={liveEvents} limit={6} />
            ) : (
              <EmptyState icon={Activity} title="No events yet" description="System events will appear here as devices report activity." />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}