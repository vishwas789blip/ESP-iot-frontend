import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { useBackendStatus } from '@/hooks/useBackendStatus';
import { getApiUrl } from '@/services';
import { getWsUrl } from '@/context/RealtimeContext';
import { User, Server, Bell, Shield, Cpu, Mail, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Toggle } from '@/components/ui/Toggle';
import { Badge } from '@/components/ui/Badge';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';

export function SettingsPage() {
  const { user, logout } = useAuth();
  const { show } = useToast();
  const navigate = useNavigate();
  const { connected, connectionState, mqttConnected } = useBackendStatus();
  const [notifications, setNotifications] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const handleLogout = () => {
    logout();
    show('Signed out successfully', 'success');
    navigate('/login');
  };

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Profile */}
      <div className="glass-card p-6">
        <h3 className="text-base font-semibold text-white flex items-center gap-2 mb-5">
          <User className="w-5 h-5 text-accent-cyan" />
          Profile
        </h3>
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-2xl bg-accent-cyan/30 flex items-center justify-center text-2xl font-bold text-white">
            {user?.name?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div>
            <p className="text-lg font-semibold text-white">{user?.name || 'User'}</p>
            <p className="text-sm text-gray-500">{user?.email}</p>
          </div>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <Input label="Name" value={user?.name || ''} disabled />
          <Input label="Email" value={user?.email || ''} disabled icon={<Mail className="w-4 h-4" />} />
        </div>
      </div>

      {/* Backend Connection */}
      <div className="glass-card p-6">
        <h3 className="text-base font-semibold text-white flex items-center gap-2 mb-5">
          <Server className="w-5 h-5 text-accent-green" />
          Backend Connection
        </h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 rounded-lg bg-ink-700/40">
            <div className="flex items-center gap-3">
              <span className={`w-2.5 h-2.5 rounded-full ${connected ? 'bg-accent-green animate-pulse' : connectionState === 'reconnecting' ? 'bg-accent-amber' : 'bg-accent-red'}`} />
              <div>
                <p className="text-sm text-white">WebSocket Status</p>
                <p className="text-xs text-gray-500">
                  {connected ? 'Connected — receiving live updates' : connectionState === 'reconnecting' ? 'Reconnecting…' : 'Disconnected'}
                </p>
              </div>
            </div>
            <Badge variant={connected ? 'success' : connectionState === 'reconnecting' ? 'warning' : 'error'} dot>
              {connected ? 'Live' : connectionState === 'reconnecting' ? 'Reconnecting' : 'Offline'}
            </Badge>
          </div>
          <div className="flex items-center justify-between p-3 rounded-lg bg-ink-700/40">
            <div className="flex items-center gap-3">
              <span className={`w-2.5 h-2.5 rounded-full ${mqttConnected ? 'bg-accent-green' : 'bg-accent-red'}`} />
              <div>
                <p className="text-sm text-white">MQTT Bridge</p>
                <p className="text-xs text-gray-500">
                  {mqttConnected ? 'Backend connected to MQTT broker' : 'MQTT broker not connected'}
                </p>
              </div>
            </div>
            <Badge variant={mqttConnected ? 'success' : 'error'} dot>
              {mqttConnected ? 'Connected' : 'Offline'}
            </Badge>
          </div>
          <Input label="API Base URL" value={getApiUrl()} disabled />
          <Input label="WebSocket URL" value={getWsUrl()} disabled />
          <p className="text-xs text-gray-500">Configured via VITE_API_URL environment variable</p>
        </div>
      </div>

      {/* Preferences */}
      <div className="glass-card p-6">
        <h3 className="text-base font-semibold text-white flex items-center gap-2 mb-5">
          <Bell className="w-5 h-5 text-accent-amber" />
          Preferences
        </h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 rounded-lg bg-ink-700/40">
            <div>
              <p className="text-sm text-white">Push Notifications</p>
              <p className="text-xs text-gray-500">Receive alerts for device events</p>
            </div>
            <Toggle checked={notifications} onChange={setNotifications} />
          </div>
          <div className="flex items-center justify-between p-3 rounded-lg bg-ink-700/40">
            <div>
              <p className="text-sm text-white">Auto-Refresh Data</p>
              <p className="text-xs text-gray-500">Live updates via WebSocket</p>
            </div>
            <Toggle checked={autoRefresh} onChange={setAutoRefresh} />
          </div>
        </div>
      </div>

      {/* System Info */}
      <div className="glass-card p-6">
        <h3 className="text-base font-semibold text-white flex items-center gap-2 mb-5">
          <Cpu className="w-5 h-5 text-accent-blue" />
          System Information
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-lg bg-ink-700/40">
            <p className="text-xs text-gray-500 uppercase">Platform</p>
            <p className="text-sm text-white mt-1">ESP32 IoT</p>
          </div>
          <div className="p-3 rounded-lg bg-ink-700/40">
            <p className="text-xs text-gray-500 uppercase">Architecture</p>
            <p className="text-sm text-white mt-1">React + REST + WebSocket</p>
          </div>
          <div className="p-3 rounded-lg bg-ink-700/40">
            <p className="text-xs text-gray-500 uppercase">MQTT Protocol</p>
            <p className="text-sm text-white mt-1">Backend Bridge</p>
          </div>
          <div className="p-3 rounded-lg bg-ink-700/40">
            <p className="text-xs text-gray-500 uppercase">Auth Method</p>
            <p className="text-sm text-white mt-1">JWT Bearer</p>
          </div>
        </div>
      </div>

      {/* Security */}
      <div className="glass-card p-6">
        <h3 className="text-base font-semibold text-white flex items-center gap-2 mb-5">
          <Shield className="w-5 h-5 text-accent-violet" />
          Security
        </h3>
        <p className="text-sm text-gray-400 mb-4">
          Your JWT token is stored securely in the browser. It is automatically sent with every API request
          and cleared on logout.
        </p>
        <Button variant="danger" onClick={handleLogout}>
          <LogOut className="w-4 h-4" />
          Sign Out
        </Button>
      </div>
    </div>
  );
}
