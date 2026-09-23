import { useRealtime } from '@/context/RealtimeContext';

export function useBackendStatus() {
  const { connectionState, mqttConnected } = useRealtime();
  const connected = connectionState === 'connected';
  return { connected, connectionState, mqttConnected, recheck: () => {} };
}
