import { useState, useRef, useEffect } from 'react';
import { Menu, Bell, ChevronDown, Wifi, WifiOff, Loader2 } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { useBackendStatus } from '@/hooks/useBackendStatus';
import { useRealtime } from '@/context/RealtimeContext';
import { useAuth } from '@/context/AuthContext';

const pageTitles: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/devices': 'Devices',
  '/sensors': 'Sensors',
  '/actuators': 'Actuators',
  '/automations': 'Automations',
  '/events': 'Events',
  '/firmware': 'Firmware',
  '/ai-assistant': 'AI Assistant',
  '/settings': 'Settings',
};

interface TopBarProps {
  onMenuClick: () => void;
  collapsed: boolean;
}

export function TopBar({ onMenuClick, collapsed }: TopBarProps) {
  const location = useLocation();
  const { user } = useAuth();
  const { connected, connectionState, mqttConnected } = useBackendStatus();
  const { events } = useRealtime();
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  const recentEvents = events.slice(0, 5);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const pageTitle = pageTitles[location.pathname] || (() => {
    if (location.pathname.startsWith('/devices/')) return 'Device Details';
    return 'Dashboard';
  })();

  const statusIcon = connectionState === 'connected' ? (
    <Wifi className="w-4 h-4 text-accent-green" />
  ) : connectionState === 'reconnecting' ? (
    <Loader2 className="w-4 h-4 text-accent-amber animate-spin" />
  ) : (
    <WifiOff className="w-4 h-4 text-accent-red" />
  );

  const statusText = connectionState === 'connected'
    ? 'Live'
    : connectionState === 'reconnecting'
    ? 'Reconnecting'
    : 'Disconnected';

  const statusColor = connectionState === 'connected'
    ? 'bg-accent-green animate-pulse'
    : connectionState === 'reconnecting'
    ? 'bg-accent-amber'
    : 'bg-accent-red';

  return (
    <header
      className={`fixed top-0 right-0 z-20 h-16 bg-ink-850 border-b border-white/5 flex items-center px-4 lg:px-6 gap-4 transition-all duration-300 left-0 ${
        collapsed ? 'lg:left-[68px]' : 'lg:left-64'
      }`}
    >
      <button
        onClick={onMenuClick}
        className="lg:hidden p-2 rounded-lg hover:bg-white/5 text-gray-400"
      >
        <Menu className="w-5 h-5" />
      </button>

      <div className="flex-1 min-w-0">
        <h1 className="text-base lg:text-lg font-semibold text-white truncate">{pageTitle}</h1>
      </div>

      <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-ink-700/50 border border-white/5">
        {statusIcon}
        <span className="text-xs font-medium text-gray-400">{statusText}</span>
        <span className={`w-2 h-2 rounded-full ${statusColor}`} />
        {connected && (
          <span className="text-[10px] text-gray-600 ml-1 border-l border-white/5 pl-2">
            MQTT {mqttConnected ? '🟢' : '🔴'}
          </span>
        )}
      </div>

      <div className="relative" ref={notifRef}>
        <button
          onClick={() => setNotifOpen(!notifOpen)}
          className="relative p-2 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition-colors"
        >
          <Bell className="w-5 h-5" />
          {recentEvents.length > 0 && (
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-accent-cyan animate-pulse" />
          )}
        </button>

        {notifOpen && (
          <div className="absolute right-0 top-full mt-2 w-80 glass-card border border-white/10 rounded-xl shadow-2xl overflow-hidden animate-scale-in">
            <div className="px-4 py-3 border-b border-white/5">
              <p className="text-sm font-semibold text-white">Recent Events</p>
            </div>
            <div className="max-h-64 overflow-y-auto scrollbar-thin">
              {recentEvents.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-6">No recent events</p>
              ) : (
                recentEvents.map((e, i) => (
                  <div key={e._id || i} className="px-4 py-2.5 border-b border-white/5 last:border-0 hover:bg-white/5">
                    <p className="text-xs text-gray-300">{e.message}</p>
                    <p className="text-[10px] text-gray-600 mt-0.5">{new Date(e.timestamp).toLocaleString()}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 pl-3 border-l border-white/5">
        <div className="w-8 h-8 rounded-full bg-accent-cyan/30 flex items-center justify-center text-xs font-semibold text-white shrink-0">
          {user?.name?.charAt(0).toUpperCase() || 'U'}
        </div>
        <div className="hidden md:block">
          <p className="text-xs font-medium text-white leading-tight">{user?.name || 'User'}</p>
          <p className="text-[10px] text-gray-500">{user?.email}</p>
        </div>
        <ChevronDown className="hidden md:block w-4 h-4 text-gray-500" />
      </div>
    </header>
  );
}
