import type { DeviceStatus } from '@/types';

const config: Record<
  string,
  { label: string; color: string; bg: string; ring: string; pulse: boolean }
> = {
  online: {
    label: 'Online',
    color: 'text-accent-green',
    bg: 'bg-accent-green/10',
    ring: 'ring-accent-green/30',
    pulse: true,
  },
  offline: { label: 'Offline', color: 'text-gray-400', bg: 'bg-gray-500/10', ring: 'ring-gray-500/30', pulse: false },
  warning: {
    label: 'Warning',
    color: 'text-accent-amber',
    bg: 'bg-accent-amber/10',
    ring: 'ring-accent-amber/30',
    pulse: false,
  },
  error: { label: 'Error', color: 'text-accent-red', bg: 'bg-accent-red/10', ring: 'ring-accent-red/30', pulse: true },
  active: {
    label: 'Active',
    color: 'text-accent-green',
    bg: 'bg-accent-green/10',
    ring: 'ring-accent-green/30',
    pulse: true,
  },
  inactive: {
    label: 'Inactive',
    color: 'text-gray-400',
    bg: 'bg-gray-500/10',
    ring: 'ring-gray-500/30',
    pulse: false,
  },
  normal: {
    label: 'Normal',
    color: 'text-accent-green',
    bg: 'bg-accent-green/10',
    ring: 'ring-accent-green/30',
    pulse: false,
  },
  healthy: { label: 'Healthy', color: 'text-accent-green', bg: 'bg-accent-green/10', ring: 'ring-accent-green/30', pulse: false },
  stale: { label: 'Stale', color: 'text-accent-amber', bg: 'bg-accent-amber/10', ring: 'ring-accent-amber/30', pulse: false },
  unknown: { label: 'Unknown', color: 'text-gray-400', bg: 'bg-gray-500/10', ring: 'ring-gray-500/30', pulse: false },
  invalid: { label: 'Invalid', color: 'text-accent-red', bg: 'bg-accent-red/10', ring: 'ring-accent-red/30', pulse: false },
  unverified: { label: 'Unverified', color: 'text-accent-amber', bg: 'bg-accent-amber/10', ring: 'ring-accent-amber/30', pulse: false },
};

export function StatusDot({ status, size = 'md' }: { status: DeviceStatus | string; size?: 'sm' | 'md' | 'lg' }) {
  const c = config[status] || config.offline;
  const dimensions = { sm: 'w-2 h-2', md: 'w-2.5 h-2.5', lg: 'w-3 h-3' };

  return (
    <span className="relative inline-flex">
      {c.pulse && (
        <span
          className={`absolute inset-0 rounded-full ${c.color.replace('text-', 'bg-')} animate-pulse-ring`}
        />
      )}
      <span className={`relative rounded-full ${dimensions[size]} ${c.color.replace('text-', 'bg-')}`} />
    </span>
  );
}

export function StatusBadge({ status, size = 'md' }: { status: DeviceStatus | string; size?: 'sm' | 'md' }) {
  const c = config[status] || config.offline;
  const padding = size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full ${padding} font-medium border ${c.bg} ${c.color} ring-1 ${c.ring}`}
    >
      <StatusDot status={status} size="sm" />
      {c.label}
    </span>
  );
}
