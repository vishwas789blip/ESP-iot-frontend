import { useState, useMemo } from 'react';
import { CircuitBoard, Plus, Search } from 'lucide-react';
import { useRealtimeData } from '@/hooks/useRealtimeData';
import { useRealtime } from '@/context/RealtimeContext';
import { deviceApi } from '@/services';
import { useToast } from '@/context/ToastContext';
import type { Device } from '@/types';
import { DeviceCard } from '@/components/DeviceCard';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { CardSkeleton } from '@/components/ui/LoadingSkeleton';

export function DevicesPage() {
  const { show } = useToast();
  const { devices: liveDevices, setInitialDevices } = useRealtime();
  const [search, setSearch] = useState('');
  const [addOpen, setAddOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Device | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [heartbeatTarget, setHeartbeatTarget] = useState<Device | null>(null);

  const { loading, error, refetch } = useRealtimeData<Device[]>({
    fetcher: (signal) => deviceApi.list(signal),
    onLoaded: setInitialDevices,
  });

  const devices = useMemo(() => Object.values(liveDevices), [liveDevices]);

  const [formData, setFormData] = useState({
    deviceId: 'esp32-',
    name: '',
    description: '',
    connectionType: 'wifi',
    ipAddress: '',
    firmwareVersion: 'Phase-6',
  });

  const filtered = useMemo(() => {
    if (!devices.length) return [];
    const q = search.toLowerCase();
    return devices.filter(
      (d) =>
        d.name.toLowerCase().includes(q) ||
        d.deviceId.toLowerCase().includes(q) ||
        d.ipAddress?.toLowerCase().includes(q),
    );
  }, [devices, search]);

  const handleCreate = async () => {
    try {
      await deviceApi.create(formData);
      show('Device created successfully', 'success');
      setAddOpen(false);
      setFormData({ deviceId: 'esp32-', name: '', description: '', connectionType: 'wifi', ipAddress: '', firmwareVersion: 'Phase-6' });
      refetch();
    } catch (err) {
      const msg = err && typeof err === 'object' && 'message' in err ? (err as { message: string }).message : 'Failed to create device';
      show(msg, 'error');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deviceApi.remove(deleteTarget._id);
      show('Device deleted', 'success');
      setDeleteTarget(null);
      refetch();
    } catch (err) {
      const msg = err && typeof err === 'object' && 'message' in err ? (err as { message: string }).message : 'Failed to delete device';
      show(msg, 'error');
    } finally {
      setDeleting(false);
    }
  };

  const handleHeartbeat = async () => {
    if (!heartbeatTarget) return;
    try {
      await deviceApi.heartbeat(heartbeatTarget._id);
      show('Connection test sent to ESP32', 'success');
      setHeartbeatTarget(null);
      refetch();
    } catch (err) {
      const msg = err && typeof err === 'object' && 'message' in err ? (err as { message: string }).message : 'Heartbeat failed';
      show(msg, 'error');
      setHeartbeatTarget(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">Manage all registered ESP32 devices</p>
        </div>
        <div className="flex gap-3">
          <Input
            placeholder="Search devices…"
            icon={<Search className="w-4 h-4" />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="sm:w-56"
          />
          <Button onClick={() => setAddOpen(true)}>
            <Plus className="w-4 h-4" />
            Add Device
          </Button>
        </div>
      </div>

      {loading && devices.length === 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : error && devices.length === 0 ? (
        <ErrorState message="Backend unavailable. Check that the server is running." onRetry={refetch} />
      ) : filtered.length > 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((d) => (
            <DeviceCard
              key={d._id}
              device={d}
              sensorCount={d.sensors?.length}
              actuatorCount={d.actuators?.length}
              onDelete={setDeleteTarget}
              onHeartbeat={setHeartbeatTarget}
            />
          ))}
        </div>
      ) : search ? (
        <div className="glass-card">
          <EmptyState icon={Search} title="No devices found" description={`No devices match "${search}"`} />
        </div>
      ) : (
        <div className="glass-card">
          <EmptyState
            icon={CircuitBoard}
            title="No devices registered"
            description="Add your ESP32 device to start monitoring sensors and controlling actuators."
            action={
              <Button onClick={() => setAddOpen(true)}>
                <Plus className="w-4 h-4" />
                Add Your First Device
              </Button>
            }
          />
        </div>
      )}

      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Register New Device">
        <div className="space-y-4">
          <Input
            label="Device ID"
            placeholder="esp32-001"
            value={formData.deviceId}
            onChange={(e) => setFormData({ ...formData, deviceId: e.target.value })}
          />
          <Input
            label="Device Name"
            placeholder="ESP32 Main Controller"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
          <Input
            label="Description"
            placeholder="PIR motion sensor + buzzer"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />
          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Connection Type"
              value={formData.connectionType}
              onChange={(e) => setFormData({ ...formData, connectionType: e.target.value })}
              options={[
                { value: 'wifi', label: 'WiFi' },
                { value: 'bluetooth', label: 'Bluetooth' },
                { value: 'mqtt', label: 'MQTT' },
              ]}
            />
            <Input
              label="IP Address"
              placeholder="10.70.201.101"
              value={formData.ipAddress}
              onChange={(e) => setFormData({ ...formData, ipAddress: e.target.value })}
            />
          </div>
          <Input
            label="Firmware Version"
            placeholder="Phase-6"
            value={formData.firmwareVersion}
            onChange={(e) => setFormData({ ...formData, firmwareVersion: e.target.value })}
          />
          <div className="flex gap-3 justify-end pt-2">
            <Button variant="ghost" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={!formData.deviceId || !formData.name}>
              Register Device
            </Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Device?"
        message={`This will permanently remove "${deleteTarget?.name}" and all associated data. This cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
      />

      <ConfirmDialog
        open={!!heartbeatTarget}
        title="Test Connection?"
        message={`Send a heartbeat to "${heartbeatTarget?.name}" to verify the ESP32 is reachable.`}
        confirmLabel="Send Heartbeat"
        variant="primary"
        onConfirm={handleHeartbeat}
        onCancel={() => setHeartbeatTarget(null)}
      />
    </div>
  );
}
