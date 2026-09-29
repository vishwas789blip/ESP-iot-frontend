import { useState, useMemo, useCallback } from 'react';
import { Waves, Search } from 'lucide-react';
import { useRealtimeData } from '@/hooks/useRealtimeData';
import { useRealtime } from '@/context/RealtimeContext';
import { deviceApi, sensorApi } from '@/services';
import { useToast } from '@/context/ToastContext';
import type { Device, Sensor, HardwareInterface } from '@/types';
import { SensorCard } from '@/components/SensorCard';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { CardSkeleton } from '@/components/ui/LoadingSkeleton';
import { HardwareConfigFields, parseJsonObject } from '@/components/HardwareConfigFields';

export function SensorsPage() {
  const { show } = useToast();
  const { sensors: liveSensors, devices: liveDevices, setInitialDevices, setInitialSensors } = useRealtime();
  const [search, setSearch] = useState('');
  const [deviceFilter, setDeviceFilter] = useState('all');
  const [addOpen, setAddOpen] = useState(false);
  const [addDeviceId, setAddDeviceId] = useState('');

  const { loading: devicesLoading } = useRealtimeData<Device[]>({
    fetcher: (signal) => deviceApi.list(signal),
    onLoaded: setInitialDevices,
  });

  const fetchSensors = useCallback(async (signal: AbortSignal) => {
    const allDevices = await deviceApi.list(signal);
    const all: Sensor[] = [];
    for (const d of allDevices) {
      try {
        const s = await sensorApi.listByDevice(d._id, signal);
        all.push(...s);
        setInitialSensors(d._id, s);
      } catch { /* device may have no sensors */ }
    }
    return all;
  }, [setInitialSensors]);

  const { loading, error, refetch } = useRealtimeData<Sensor[]>({
    fetcher: fetchSensors,
  });

  const devices = useMemo(() => Object.values(liveDevices), [liveDevices]);
  const sensorsArray = useMemo(() => Object.values(liveSensors), [liveSensors]);

  const [formData, setFormData] = useState({
    name: '', type: 'pir', interfaceType: 'gpio' as HardwareInterface,
    gpio: '26', pinsJson: '', address: '', parametersJson: '', unit: '',
  });

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return sensorsArray.filter(
      (s) =>
        (deviceFilter === 'all' || s.deviceId === deviceFilter) &&
        (s.name.toLowerCase().includes(q) || s.type.toLowerCase().includes(q)),
    );
  }, [sensorsArray, search, deviceFilter]);

  const handleCreate = async () => {
    try {
      const pins = parseJsonObject(formData.pinsJson, 'Pins');
      const parameters = parseJsonObject(formData.parametersJson, 'Parameters');
      await sensorApi.create(addDeviceId, {
        name: formData.name.trim(),
        type: formData.type,
        interface: formData.interfaceType,
        gpio: formData.gpio.trim() ? Number(formData.gpio) : undefined,
        pins,
        address: formData.address.trim() || undefined,
        parameters,
        unit: formData.unit.trim() || undefined,
      });
      show('Sensor created', 'success');
      setAddOpen(false);
      setFormData({ name: '', type: 'pir', interfaceType: 'gpio', gpio: '26', pinsJson: '', address: '', parametersJson: '', unit: '' });
      refetch();
    } catch (err) {
      const msg = err && typeof err === 'object' && 'message' in err ? (err as { message: string }).message : 'Failed to create sensor';
      show(msg, 'error');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
        <p className="text-sm text-gray-500">Monitor all sensors across your devices in real time</p>
        <div className="flex flex-wrap gap-3">
          <Input
            placeholder="Search sensors…"
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
              ...devices.map((d) => ({ value: d._id, label: d.name })),
            ]}
            className="sm:w-40"
          />
          <Button onClick={() => { setAddDeviceId(devices[0]?._id || ''); setAddOpen(true); }} disabled={!devices.length}>
            Add Sensor
          </Button>
        </div>
      </div>

      {loading && sensorsArray.length === 0 && devices.length === 0 ? (
        <div className="grid md:grid-cols-2 gap-4">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : error && sensorsArray.length === 0 ? (
        <ErrorState message="Unable to load sensors from backend" onRetry={refetch} />
      ) : filtered.length > 0 ? (
        <div className="grid md:grid-cols-2 gap-4">
          {filtered.map((s) => (
            <SensorCard key={s._id} sensor={s} />
          ))}
        </div>
      ) : search || deviceFilter !== 'all' ? (
        <div className="glass-card">
          <EmptyState icon={Search} title="No sensors found" description="Try adjusting your search or filter." />
        </div>
      ) : (
        <div className="glass-card">
          <EmptyState
            icon={Waves}
            title="No sensors configured"
            description="Register sensors on your ESP32 devices to start monitoring inputs."
            action={devices.length ? <Button onClick={() => { setAddDeviceId(devices[0]._id); setAddOpen(true); }}>Add Sensor</Button> : <span className="text-sm text-gray-500">Add a device first</span>}
          />
        </div>
      )}

      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Register Sensor">
        <div className="space-y-4">
          <Select
            label="Device"
            value={addDeviceId}
            onChange={(e) => setAddDeviceId(e.target.value)}
            options={devices.map((d) => ({ value: d._id, label: d.name }))}
          />
          <Input label="Sensor Name" placeholder="PIR Motion Sensor" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
          <Select
            label="Type"
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
            options={[
              { value: 'pir', label: 'PIR Motion' },
              { value: 'temperature', label: 'Temperature' },
              { value: 'humidity', label: 'Humidity' },
              { value: 'light', label: 'Light' },
              { value: 'analog', label: 'Analog' },
              { value: 'digital', label: 'Digital' },
            ]}
          />
          <HardwareConfigFields
            interfaceType={formData.interfaceType}
            onInterfaceChange={(interfaceType) => setFormData({ ...formData, interfaceType })}
            gpio={formData.gpio}
            onGpioChange={(gpio) => setFormData({ ...formData, gpio })}
            pinsJson={formData.pinsJson}
            onPinsChange={(pinsJson) => setFormData({ ...formData, pinsJson })}
            address={formData.address}
            onAddressChange={(address) => setFormData({ ...formData, address })}
            parametersJson={formData.parametersJson}
            onParametersChange={(parametersJson) => setFormData({ ...formData, parametersJson })}
          />
          <Input label="Unit (optional)" placeholder="°C, %, raw, boolean" value={formData.unit} onChange={(e) => setFormData({ ...formData, unit: e.target.value })} />
          <div className="flex gap-3 justify-end pt-2">
            <Button variant="ghost" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={!formData.name || !addDeviceId}>Register Sensor</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
