import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  trend?: string;
  color?: 'cyan' | 'green' | 'blue' | 'amber' | 'red' | 'violet';
  loading?: boolean;
  children?: ReactNode;
}

const colors = {
  cyan: 'text-accent-cyan bg-accent-cyan/10',
  green: 'text-accent-green bg-accent-green/10',
  blue: 'text-accent-blue bg-accent-blue/10',
  amber: 'text-accent-amber bg-accent-amber/10',
  red: 'text-accent-red bg-accent-red/10',
  violet: 'text-accent-violet bg-accent-violet/10',
};

export function StatCard({ icon: Icon, label, value, trend, color = 'cyan', loading, children }: StatCardProps) {
  return (
    <div className="glass-card p-5 hover:border-white/10 transition-all group">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${colors[color]} group-hover:scale-110 transition-transform`}>
          <Icon className="w-5 h-5" />
        </div>
        {trend && <span className="text-xs text-gray-500">{trend}</span>}
      </div>
      <p className="text-2xl font-bold text-white tabular-nums">
        {loading ? <span className="skeleton h-7 w-12 inline-block rounded" /> : value}
      </p>
      <p className="text-xs text-gray-500 mt-1 uppercase tracking-wide">{label}</p>
      {children}
    </div>
  );
}
