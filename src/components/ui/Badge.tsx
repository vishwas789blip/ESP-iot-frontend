import type { ReactNode } from 'react';

type BadgeVariant = 'default' | 'success' | 'warning' | 'error' | 'info' | 'cyan';

interface BadgeProps {
  variant?: BadgeVariant;
  size?: 'sm' | 'md';
  children: ReactNode;
  className?: string;
  dot?: boolean;
}

const styles: Record<BadgeVariant, string> = {
  default: 'bg-ink-600 text-gray-300 border-white/5',
  success: 'bg-accent-green/10 text-accent-green border-accent-green/30',
  warning: 'bg-accent-amber/10 text-accent-amber border-accent-amber/30',
  error: 'bg-accent-red/10 text-accent-red border-accent-red/30',
  info: 'bg-accent-blue/10 text-accent-blue border-accent-blue/30',
  cyan: 'bg-accent-cyan/10 text-accent-cyan border-accent-cyan/30',
};

const dotColors: Record<BadgeVariant, string> = {
  default: 'bg-gray-400',
  success: 'bg-accent-green',
  warning: 'bg-accent-amber',
  error: 'bg-accent-red',
  info: 'bg-accent-blue',
  cyan: 'bg-accent-cyan',
};

export function Badge({ variant = 'default', size = 'md', children, className = '', dot }: BadgeProps) {
  const sizing = size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs';
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-medium border ${sizing} ${styles[variant]} ${className}`}
    >
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${dotColors[variant]}`} />}
      {children}
    </span>
  );
}
