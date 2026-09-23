import { useState, useMemo, useCallback } from 'react';
import { Volume2, Search, Plus } from 'lucide-react';
import { useRealtimeData } from '@/hooks/useRealtimeData';
import { useRealtime } from '@/context/RealtimeContext';
import { deviceApi, actuatorApi } from '@/services';
import { useToast } from '@/context/ToastContext';
import type { Device, Actuator } from '@/types';
import { ActuatorCard } from '@/components/ActuatorCard';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { CardSkeleton } from '@/components/ui/LoadingSkeleton';

export function ActuatorsPage() {
  const { show } = useToast();
  const { actuators: liveActuators, devices: liveDevices, setInitialDevices, setInitialActuators } = useRealtime();
  const [search, setSearch] = useState('');
  const [deviceFilter, setDeviceFilter] = useState('all');
  const [addOpen, setAddOpen] = useState(false);
  const [addDeviceId, setAddDeviceId] = useState('');
  const [formData, setFormData] = useState({ name: '', type: 'buzzer', gpio: '27' });

  const { loading: devicesLoading } = useRealtimeData<Device[]>({
    fetcher: (signal) => deviceApi.list(signal),
    onLoaded: setInitialDevices,
  });

  const fetchActuators = useCallback(async (signal: AbortSignal) => {
    const allDevices = await deviceApi.list(signal);
    const all: Actuator[] = [];
    for (const d of allDevices) {
      try {
        const a = await actuatorApi.listByDevice(d._id, signal);
        all.push(...a);
        setInitialActuators(d._id, a);
      } catch { /* device may have no actuators */ }
    }
    return all;
  }, [setInitialActuators]);

  const { loading, error, refetch } = useRealtimeData<Actuator[]>({
    fetcher: fetchActuators,
  });

  const devices = useMemo(() => Object.values(liveDevices), [liveDevices]);
  const actuatorsArray = useMemo(() => Object.values(liveActuators), [liveActuators]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return actuatorsArray.filter(
      (a) =>
        (deviceFilter === 'all' || a.deviceId === deviceFilter) &&
        (a.name.toLowerCase().includes(q) || a.type.toLowerCase().includes(q)),
    );
  }, [actuatorsArray, search, deviceFilter]);

  const handleCreate = async () => {
    try {
      await actuatorApi.create(addDeviceId, {
        name: formData.name,
        type: formData.type,
        gpio: Number(formData.gpio),
      });
      show('Actuator created', 'success');
      setAddOpen(false);
      setFormData({ name: '', type: 'buzzer', gpio: '27' });
      refetch();
    } catch (err) {
      const msg = err && typeof err === 'object' && 'message' in err ? (err as { message: string }).message : 'Failed to create actuator';
      show(msg, 'error');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
        <p className="text-sm text-gray-500">Control actuators connected to your ESP32 devices in real time</p>
        <div className="flex flex-wrap gap-3">
          <Input
            placeholder="Search actuators…"
            icon={<Search className="w-4 h-4" />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="sm:w-48"
          />
          <Select
            value={deviceFilter}
            onChange={(e) => setDeviceFilter(e.target.value)}
            options={[
              { value: 'all', label: 'All Devices' },
              ...devices.map((d) => ({ value: d.deviceId, label: d.name })),
            ]}
            className="sm:w-40"
          />
          <Button onClick={() => { setAddDeviceId(devices[0]?._id || ''); setAddOpen(true); }} disabled={!devices.length}>
            <Plus className="w-4 h-4" />
            Add Actuator
          </Button>
        </div>
      </div>

      {loading && actuatorsArray.length === 0 && devices.length === 0 ? (
        <div className="grid md:grid-cols-2 gap-4">
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : error && actuatorsArray.length === 0 ? (
        <ErrorState message="Unable to load actuators from backend" onRetry={refetch} />
      ) : filtered.length > 0 ? (
        <div className="grid md:grid-cols-2 gap-4">
          {filtered.map((a) => (
            <ActuatorCard key={a._id} actuator={a} onChanged={refetch} />
          ))}
        </div>
      ) : search || deviceFilter !== 'all' ? (
        <div className="glass-card">
          <EmptyState icon={Search} title="No actuators found" description="Try adjusting your search or filter." />
        </div>
      ) : (
        <div className="glass-card">
          <EmptyState
            icon={Volume2}
            title="No actuators configured"
            description="Register actuators like buzzers, relays, or LEDs to control your ESP32 outputs."
            action={devices.length ? <Button onClick={() => { setAddDeviceId(devices[0]._id); setAddOpen(true); }}>Add Actuator</Button> : <span className="text-sm text-gray-500">Add a device first</span>}
          />
        </div>
      )}

      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Register Actuator">
        <div className="space-y-4">
          <Select
            label="Device"
            value={addDeviceId}
            onChange={(e) => setAddDeviceId(e.target.value)}
            options={devices.map((d) => ({ value: d._id, label: d.name }))}
          />
          <Input label="Actuator Name" placeholder="Main Buzzer" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
          <Select
            label="Type"
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
            options={[
              { value: 'buzzer', label: 'Buzzer' },
              { value: 'relay', label: 'Relay' },
              { value: 'led', label: 'LED' },
              { value: 'motor', label: 'Motor' },
              { value: 'switch', label: 'Switch' },
            ]}
          />
          <Input label="GPIO Pin" type="number" placeholder="27" value={formData.gpio} onChange={(e) => setFormData({ ...formData, gpio: e.target.value })} />
          <div className="flex gap-3 justify-end pt-2">
            <Button variant="ghost" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={!formData.name || !addDeviceId}>Register Actuator</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
