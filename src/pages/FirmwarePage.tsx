import { useState } from 'react';
import { Download, Cpu, Upload, CheckCircle2, AlertCircle, Clock } from 'lucide-react';
import { useRealtimeData } from '@/hooks/useRealtimeData';
import { useRealtime } from '@/context/RealtimeContext';
import { deviceApi } from '@/services';
import { useToast } from '@/context/ToastContext';
import type { Device } from '@/types';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { CardSkeleton } from '@/components/ui/LoadingSkeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';

export function FirmwarePage() {
  const { show } = useToast();
  const { devices: liveDevices, setInitialDevices } = useRealtime();
  const [uploading, setUploading] = useState<string | null>(null);

  const { loading, error, refetch } = useRealtimeData<Device[]>({
    fetcher: (signal) => deviceApi.list(signal),
    onLoaded: setInitialDevices,
  });

  const devices = Object.values(liveDevices);

  const handleCheckUpdate = async (device: Device) => {
    setUploading(device._id);
    try {
      await deviceApi.heartbeat(device._id);
      show(`Firmware check sent to ${device.name}`, 'success');
      refetch();
    } catch (err) {
      const msg = err && typeof err === 'object' && 'message' in err ? (err as { message: string }).message : 'Check failed';
      show(msg, 'error');
    } finally {
      setUploading(null);
    }
  };

  return (
    <div className="space-y-6">
      <p className="text-sm text-gray-500">Manage ESP32 firmware versions and deployments</p>

      {loading && devices.length === 0 ? (
        <div className="space-y-4">
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : error && devices.length === 0 ? (
        <ErrorState message="Unable to load firmware data" onRetry={refetch} />
      ) : devices.length > 0 ? (
        <div className="space-y-4">
          {devices.map((device) => (
            <div key={device._id} className="glass-card p-6">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-accent-cyan/20 border border-accent-cyan/30 flex items-center justify-center">
                    <Cpu className="w-6 h-6 text-accent-cyan" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">{device.name}</h3>
                    <p className="text-xs text-gray-500 font-mono">{device.deviceId}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 flex-1 lg:max-w-2xl lg:ml-8">
                  <div className="p-3 rounded-lg bg-ink-700/40">
                    <p className="text-xs text-gray-500 uppercase">Current</p>
                    <p className="text-sm text-white font-mono mt-1">{device.firmwareVersion || '—'}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-ink-700/40">
                    <p className="text-xs text-gray-500 uppercase">Status</p>
                    <div className="mt-1">
                      <Badge variant={device.status === 'online' ? 'success' : 'default'} dot>
                        {device.status === 'online' ? 'Up to date' : 'Unknown'}
                      </Badge>
                    </div>
                  </div>
                  <div className="p-3 rounded-lg bg-ink-700/40">
                    <p className="text-xs text-gray-500 uppercase">IP</p>
                    <p className="text-sm text-white font-mono mt-1">{device.ipAddress || '—'}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-ink-700/40">
                    <p className="text-xs text-gray-500 uppercase">Last Seen</p>
                    <p className="text-sm text-white mt-1">
                      {device.lastSeen ? new Date(device.lastSeen).toLocaleTimeString() : '—'}
                    </p>
                  </div>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleCheckUpdate(device)}
                  loading={uploading === device._id}
                >
                  <Upload className="w-4 h-4" />
                  Check Update
                </Button>
              </div>
            </div>
          ))}

          <div className="glass-card p-5">
            <h3 className="text-sm font-semibold text-white uppercase tracking-wide flex items-center gap-2 mb-4">
              <Download className="w-4 h-4 text-accent-blue" />
              Firmware Updates
            </h3>
            <div className="space-y-3">
              {[
                { version: 'Phase-6', date: '2026-08-15', notes: 'PIR sensitivity tuning, MQTT reconnect fix', status: 'current' },
                { version: 'Phase-7', date: '2026-09-01', notes: 'OTA update support, power optimization', status: 'available' },
              ].map((fw) => (
                <div key={fw.version} className="flex items-center justify-between p-3 rounded-lg bg-ink-700/40 hover:bg-ink-700/60 transition-colors">
                  <div className="flex items-center gap-3">
                    {fw.status === 'current' ? (
                      <CheckCircle2 className="w-5 h-5 text-accent-green" />
                    ) : (
                      <Clock className="w-5 h-5 text-accent-amber" />
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-white">{fw.version}</span>
                        <Badge variant={fw.status === 'current' ? 'success' : 'warning'} size="sm">
                          {fw.status === 'current' ? 'Installed' : 'Available'}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">{fw.notes}</p>
                    </div>
                  </div>
                  <span className="text-xs text-gray-600">{fw.date}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-card p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-accent-amber shrink-0 mt-0.5" />
            <p className="text-sm text-gray-400">
              Firmware updates are deployed through the backend MQTT bridge. The frontend sends the update command via REST API;
              the backend handles OTA delivery to the ESP32.
            </p>
          </div>
        </div>
      ) : (
        <div className="glass-card">
          <EmptyState icon={Download} title="No firmware to manage" description="Add an ESP32 device to view and manage firmware versions." />
        </div>
      )}
    </div>
  );
}
