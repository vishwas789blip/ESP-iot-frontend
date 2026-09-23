import { useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Cpu,
  Settings,
  Waves,
  Volume2,
  Zap,
  Activity,
  Radio,
  Save,
  Pencil,
  Power,
} from 'lucide-react';
import { useRealtimeData } from '@/hooks/useRealtimeData';
import { useRealtime } from '@/context/RealtimeContext';
import { deviceApi, sensorApi, actuatorApi, automationApi, eventApi } from '@/services';
import { useToast } from '@/context/ToastContext';
import type { Device, Sensor, Actuator, Automation, AppEvent, DeviceConfig } from '@/types';
import { StatusBadge } from '@/components/StatusBadge';
import { SensorCard } from '@/components/SensorCard';
import { ActuatorCard } from '@/components/ActuatorCard';
import { AutomationCard } from '@/components/AutomationCard';
import { EventTimeline } from '@/components/EventTimeline';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Toggle } from '@/components/ui/Toggle';
import { Badge } from '@/components/ui/Badge';
import { CardSkeleton } from '@/components/ui/LoadingSkeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { Modal } from '@/components/ui/Modal';

type Tab = 'overview' | 'sensors' | 'actuators' | 'automations' | 'events' | 'configuration';

const tabs: { key: Tab; label: string; icon: typeof Activity }[] = [
  { key: 'overview', label: 'Overview', icon: Activity },
  { key: 'sensors', label: 'Sensors', icon: Waves },
  { key: 'actuators', label: 'Actuators', icon: Volume2 },
  { key: 'automations', label: 'Automations', icon: Zap },
  { key: 'events', label: 'Events', icon: Radio },
  { key: 'configuration', label: 'Configuration', icon: Settings },
];

export function DeviceDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const { show } = useToast();
  const {
    devices: liveDevices,
    sensors: liveSensors,
    actuators: liveActuators,
    automations: liveAutomations,
    events: liveEvents,
    setInitialDevices,
    setInitialSensors,
    setInitialActuators,
    setInitialAutomations,
    setInitialEvents,
  } = useRealtime();

  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [editOpen, setEditOpen] = useState(false);
  const [config, setConfig] = useState<DeviceConfig | null>(null);
  const [savingConfig, setSavingConfig] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', description: '', ipAddress: '', firmwareVersion: '' });

  const { loading, error, refetch } = useRealtimeData<Device>({
    fetcher: (signal) => deviceApi.get(id!, signal),
    onLoaded: (d) => {
      setInitialDevices([d]);
      if (!config && d.config) setConfig(d.config);
    },
    enabled: !!id,
  });

  const { loading: sensorsLoading } = useRealtimeData<Sensor[]>({
    fetcher: (signal) => sensorApi.listByDevice(id!, signal),
    onLoaded: (s) => id && setInitialSensors(id, s),
    enabled: !!id,
  });

  const { loading: actuatorsLoading, refetch: refetchActuators } = useRealtimeData<Actuator[]>({
    fetcher: (signal) => actuatorApi.listByDevice(id!, signal),
    onLoaded: (a) => id && setInitialActuators(id, a),
    enabled: !!id,
  });

  const { refetch: refetchAutomations } = useRealtimeData<Automation[]>({
    fetcher: (signal) => automationApi.list(signal),
    onLoaded: setInitialAutomations,
    enabled: !!id,
  });

  const { loading: eventsLoading } = useRealtimeData<AppEvent[]>({
    fetcher: (signal) => eventApi.list(signal),
    onLoaded: setInitialEvents,
    enabled: !!id,
  });

  const device = id ? liveDevices[id] : undefined;
  const deviceSensors = useMemo(
    () => Object.values(liveSensors).filter((s) => s.deviceId === id),
    [liveSensors, id],
  );
  const deviceActuators = useMemo(
    () => Object.values(liveActuators).filter((a) => a.deviceId === id),
    [liveActuators, id],
  );
  const deviceAutomations = useMemo(
    () => Object.values(liveAutomations).filter((a) => a.deviceId === id),
    [liveAutomations, id],
  );
  const deviceEvents = useMemo(
    () => liveEvents.filter((e) => e.deviceId === id),
    [liveEvents, id],
  );

  const handleEdit = async () => {
    try {
      await deviceApi.update(id!, editForm);
      show('Device updated', 'success');
      setEditOpen(false);
      refetch();
    } catch (err) {
      const msg = err && typeof err === 'object' && 'message' in err ? (err as { message: string }).message : 'Update failed';
      show(msg, 'error');
    }
  };

  const openEdit = () => {
    if (device) {
      setEditForm({
        name: device.name,
        description: device.description || '',
        ipAddress: device.ipAddress || '',
        firmwareVersion: device.firmwareVersion || '',
      });
      setEditOpen(true);
    }
  };

  const handleSaveConfig = async () => {
    if (!config) return;
    setSavingConfig(true);
    try {
      await deviceApi.updateConfig(id!, config);
      show('Configuration saved to ESP32', 'success');
      refetch();
    } catch (err) {
      const msg = err && typeof err === 'object' && 'message' in err ? (err as { message: string }).message : 'Failed to save config';
      show(msg, 'error');
    } finally {
      setSavingConfig(false);
    }
  };

  const handleHeartbeat = async () => {
    try {
      await deviceApi.heartbeat(id!);
      show('Heartbeat sent to ESP32', 'success');
      refetch();
    } catch (err) {
      const msg = err && typeof err === 'object' && 'message' in err ? (err as { message: string }).message : 'Heartbeat failed';
      show(msg, 'error');
    }
  };

  if (loading && !device) return <CardSkeleton />;
  if (error && !device) return <ErrorState message="Unable to load device data" onRetry={refetch} />;
  if (!device) return <EmptyState icon={Cpu} title="Device not found" description="This device may have been deleted." />;

  return (
    <div className="space-y-6">
      <Link to="/devices" className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Back to Devices
      </Link>

      {/* Device Header */}
      <div className="glass-card p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-accent-cyan/5 rounded-full blur-3xl" />
        <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-accent-cyan/20 border border-accent-cyan/30 flex items-center justify-center">
              <Cpu className="w-8 h-8 text-accent-cyan" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-white">{device.name}</h1>
                <StatusBadge status={device.status} />
              </div>
              <p className="text-sm text-gray-500 font-mono mt-0.5">{device.deviceId}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleHeartbeat}>
              <Power className="w-4 h-4" />
              Test Connection
            </Button>
            <Button variant="secondary" size="sm" onClick={openEdit}>
              <Pencil className="w-4 h-4" />
              Edit
            </Button>
          </div>
        </div>

        <div className="relative grid grid-cols-2 md:grid-cols-4 gap-3 mt-5 pt-5 border-t border-white/5">
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide">IP Address</p>
            <p className="text-sm text-white font-mono mt-1">{device.ipAddress || '—'}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide">Firmware</p>
            <p className="text-sm text-white mt-1">{device.firmwareVersion || '—'}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide">Connection</p>
            <p className="text-sm text-white mt-1">{device.connectionType || 'WiFi'}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide">Last Seen</p>
            <p className="text-sm text-white mt-1">
              {device.lastSeen ? new Date(device.lastSeen).toLocaleString() : 'Never'}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto scrollbar-thin border-b border-white/5 pb-px">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-lg whitespace-nowrap transition-colors relative ${
              activeTab === tab.key
                ? 'text-accent-cyan bg-accent-cyan/5'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
            {activeTab === tab.key && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent-cyan rounded-full" />
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="animate-fade-in">
        {activeTab === 'overview' && (
          <div className="grid lg:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-white uppercase tracking-wide flex items-center gap-2">
                <Waves className="w-4 h-4 text-accent-cyan" />
                Sensors ({deviceSensors.length})
              </h3>
              {sensorsLoading && deviceSensors.length === 0 ? (
                <CardSkeleton />
              ) : deviceSensors.length > 0 ? (
                <div className="space-y-3">
                  {deviceSensors.slice(0, 2).map((s) => (
                    <SensorCard key={s._id} sensor={s} />
                  ))}
                </div>
              ) : (
                <div className="glass-card">
                  <EmptyState icon={Waves} title="No sensors" description="No sensors registered for this device." />
                </div>
              )}
            </div>
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-white uppercase tracking-wide flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-accent-amber" />
                Actuators ({deviceActuators.length})
              </h3>
              {actuatorsLoading && deviceActuators.length === 0 ? (
                <CardSkeleton />
              ) : deviceActuators.length > 0 ? (
                <div className="space-y-3">
                  {deviceActuators.slice(0, 2).map((a) => (
                    <ActuatorCard key={a._id} actuator={a} onChanged={() => refetchActuators()} />
                  ))}
                </div>
              ) : (
                <div className="glass-card">
                  <EmptyState icon={Volume2} title="No actuators" description="No actuators registered for this device." />
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'sensors' && (
          <div>
            {sensorsLoading && deviceSensors.length === 0 ? (
              <div className="grid md:grid-cols-2 gap-4">
                <CardSkeleton />
                <CardSkeleton />
              </div>
            ) : deviceSensors.length > 0 ? (
              <div className="grid md:grid-cols-2 gap-4">
                {deviceSensors.map((s) => (
                  <SensorCard key={s._id} sensor={s} />
                ))}
              </div>
            ) : (
              <div className="glass-card">
                <EmptyState icon={Waves} title="No sensors configured" description="Register sensors on the backend to monitor device inputs." />
              </div>
            )}
          </div>
        )}

        {activeTab === 'actuators' && (
          <div>
            {actuatorsLoading && deviceActuators.length === 0 ? (
              <div className="grid md:grid-cols-2 gap-4">
                <CardSkeleton />
                <CardSkeleton />
              </div>
            ) : deviceActuators.length > 0 ? (
              <div className="grid md:grid-cols-2 gap-4">
                {deviceActuators.map((a) => (
                  <ActuatorCard key={a._id} actuator={a} onChanged={() => refetchActuators()} />
                ))}
              </div>
            ) : (
              <div className="glass-card">
                <EmptyState icon={Volume2} title="No actuators configured" description="Register actuators on the backend to control device outputs." />
              </div>
            )}
          </div>
        )}

        {activeTab === 'automations' && (
          <div>
            {deviceAutomations.length > 0 ? (
              <div className="grid md:grid-cols-2 gap-4">
                {deviceAutomations.map((a) => (
                  <AutomationCard key={a._id} automation={a} onToggled={() => refetchAutomations()} />
                ))}
              </div>
            ) : (
              <div className="glass-card">
                <EmptyState
                  icon={Zap}
                  title="No automations for this device"
                  description="Create automation rules to automate sensor-triggered actions."
                  action={<Link to="/automations"><Button variant="primary" size="sm">Create Automation</Button></Link>}
                />
              </div>
            )}
          </div>
        )}

        {activeTab === 'events' && (
          <div className="glass-card p-5">
            {eventsLoading ? (
              <CardSkeleton />
            ) : deviceEvents.length > 0 ? (
              <EventTimeline events={deviceEvents} />
            ) : (
              <EmptyState icon={Activity} title="No events for this device" description="Device events will appear here as activity is reported." />
            )}
          </div>
        )}

        {activeTab === 'configuration' && (
          <div className="max-w-2xl space-y-6">
            <div className="glass-card p-6 space-y-6">
              <div>
                <h3 className="text-base font-semibold text-white mb-1">ESP32 Remote Configuration</h3>
                <p className="text-sm text-gray-500">Changes are sent to the ESP32 via the backend MQTT bridge.</p>
              </div>

              <div className="flex items-center justify-between p-4 rounded-xl bg-ink-700/40 border border-white/5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-accent-cyan/10 flex items-center justify-center">
                    <Waves className="w-5 h-5 text-accent-cyan" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">PIR Motion Sensor</p>
                    <p className="text-xs text-gray-500">GPIO 26 — Enable/disable motion detection</p>
                  </div>
                </div>
                <Toggle
                  checked={config?.pirEnabled ?? true}
                  onChange={(checked) => setConfig({ ...config, pirEnabled: checked } as DeviceConfig)}
                />
              </div>

              <div className="p-4 rounded-xl bg-ink-700/40 border border-white/5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-accent-amber/10 flex items-center justify-center">
                    <Volume2 className="w-5 h-5 text-accent-amber" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">Buzzer Duration</p>
                    <p className="text-xs text-gray-500">GPIO 27 — Default duration in seconds</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min={1}
                    max={60}
                    value={config?.buzzerDuration ?? 5}
                    onChange={(e) => setConfig({ ...config, buzzerDuration: Number(e.target.value) } as DeviceConfig)}
                    className="flex-1 accent-accent-cyan"
                  />
                  <div className="flex items-center gap-1.5 bg-ink-700 px-3 py-1.5 rounded-lg">
                    <span className="text-lg font-bold text-white tabular-nums">{config?.buzzerDuration ?? 5}</span>
                    <span className="text-xs text-gray-500">sec</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2 border-t border-white/5">
                <Button variant="ghost" onClick={() => setConfig(device.config || { pirEnabled: true, buzzerDuration: 5 })}>
                  Reset
                </Button>
                <Button onClick={handleSaveConfig} loading={savingConfig}>
                  <Save className="w-4 h-4" />
                  Save Configuration
                </Button>
              </div>
            </div>

            <div className="glass-card p-4">
              <p className="text-xs text-gray-500">
                <Badge variant="cyan" className="mr-2">JSON Preview</Badge>
                Configuration payload sent to ESP32:
              </p>
              <pre className="text-xs text-accent-cyan font-mono mt-2 p-3 bg-ink-900/60 rounded-lg overflow-x-auto">
{JSON.stringify(config || { pirEnabled: true, buzzerDuration: 5 }, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </div>

      <Modal open={editOpen} onClose={() => setEditOpen(false)} title="Edit Device">
        <div className="space-y-4">
          <Input label="Name" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
          <Input label="Description" value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} />
          <Input label="IP Address" value={editForm.ipAddress} onChange={(e) => setEditForm({ ...editForm, ipAddress: e.target.value })} />
          <Input label="Firmware Version" value={editForm.firmwareVersion} onChange={(e) => setEditForm({ ...editForm, firmwareVersion: e.target.value })} />
          <div className="flex gap-3 justify-end pt-2">
            <Button variant="ghost" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button onClick={handleEdit}>Save Changes</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
