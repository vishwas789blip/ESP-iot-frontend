import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  CircuitBoard,
  Waves,
  Volume2,
  Zap,
  Activity,
  Download,
  Bot,
  Settings,
  LogOut,
  ChevronLeft,
  Cpu,
  X,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useState } from 'react';

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/devices', label: 'Devices', icon: CircuitBoard },
  { to: '/sensors', label: 'Sensors', icon: Waves },
  { to: '/actuators', label: 'Actuators', icon: Volume2 },
  { to: '/automations', label: 'Automations', icon: Zap },
  { to: '/events', label: 'Events', icon: Activity },
  { to: '/firmware', label: 'Firmware', icon: Download },
  { to: '/ai-assistant', label: 'AI Assistant', icon: Bot },
  { to: '/settings', label: 'Settings', icon: Settings },
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  mobileOpen: boolean;
  onMobileClose: () => void;
}

export function Sidebar({ collapsed, onToggle, mobileOpen, onMobileClose }: SidebarProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [confirmLogout, setConfirmLogout] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const sidebarContent = (
    <>
      <div className={`flex items-center gap-3 px-4 h-16 border-b border-white/5 ${collapsed ? 'justify-center' : ''}`}>
        <div className="w-9 h-9 rounded-xl bg-accent-cyan/20 border border-accent-cyan/30 flex items-center justify-center shrink-0">
          <Cpu className="w-5 h-5 text-accent-cyan" />
        </div>
        {!collapsed && (
          <div className="flex-1 min-w-0">
            <p className="font-bold text-white text-sm leading-tight">ESP32 IoT</p>
            <p className="text-[10px] text-gray-500 uppercase tracking-wider">Command Center</p>
          </div>
        )}
        <button
          onClick={onToggle}
          className="hidden lg:flex p-1.5 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition-colors"
        >
          <ChevronLeft className={`w-4 h-4 transition-transform ${collapsed ? 'rotate-180' : ''}`} />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1 scrollbar-thin">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={onMobileClose}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all relative group ${
                isActive
                  ? 'bg-accent-cyan/10 text-accent-cyan shadow-glow'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              } ${collapsed ? 'justify-center lg:justify-center' : ''}`
            }
            title={collapsed ? item.label : undefined}
          >
            {({ isActive }) => (
              <>
                {isActive && !collapsed && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-accent-cyan rounded-full" />
                )}
                <item.icon className="w-5 h-5 shrink-0" />
                {!collapsed && <span>{item.label}</span>}
                {collapsed && (
                  <span className="hidden lg:block absolute left-full ml-2 px-2 py-1 rounded-md bg-ink-700 text-xs text-white opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50">
                    {item.label}
                  </span>
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-white/5 p-3">
        <div className={`flex items-center gap-3 p-2 rounded-lg ${collapsed ? 'justify-center lg:justify-center' : ''}`}>
          <div className="w-9 h-9 rounded-full bg-accent-cyan/30 flex items-center justify-center shrink-0 text-sm font-semibold text-white">
            {user?.name?.charAt(0).toUpperCase() || 'U'}
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{user?.name || 'User'}</p>
              <p className="text-xs text-gray-500 truncate">{user?.email}</p>
            </div>
          )}
          {!collapsed && (
            <button
              onClick={() => setConfirmLogout(true)}
              className="p-1.5 rounded-lg text-gray-400 hover:text-accent-red hover:bg-accent-red/10 transition-colors"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {confirmLogout && (
        <div className="absolute inset-0 bg-ink-900/80 backdrop-blur-sm z-10 flex items-center justify-center p-4">
          <div className="glass-card p-5 max-w-xs w-full text-center">
            <LogOut className="w-8 h-8 text-accent-red mx-auto mb-3" />
            <p className="text-white font-semibold mb-1">Log out?</p>
            <p className="text-xs text-gray-500 mb-4">You will need to sign in again.</p>
            <div className="flex gap-2">
              <button
                onClick={() => setConfirmLogout(false)}
                className="flex-1 px-3 py-2 text-sm rounded-lg hover:bg-white/5 text-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleLogout}
                className="flex-1 px-3 py-2 text-sm rounded-lg bg-accent-red/20 text-accent-red hover:bg-accent-red/30 transition-colors"
              >
                Log out
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );

  return (
    <>
      <aside
        className={`hidden lg:flex flex-col bg-ink-850 border-r border-white/5 transition-all duration-300 fixed inset-y-0 left-0 z-30 ${
          collapsed ? 'w-[68px]' : 'w-64'
        }`}
      >
        {sidebarContent}
      </aside>

      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onMobileClose} />
          <aside className="absolute inset-y-0 left-0 w-64 bg-ink-850 border-r border-white/5 flex flex-col animate-slide-in-right">
            <button
              onClick={onMobileClose}
              className="absolute top-4 right-3 p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/5"
            >
              <X className="w-5 h-5" />
            </button>
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  );
}
