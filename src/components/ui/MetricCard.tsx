import type { ReactNode } from 'react';
import clsx from 'clsx';

interface MetricCardProps {
  label: string;
  value: string | number;
  icon?: ReactNode;
  trend?: { value: string; positive?: boolean };
}

export function MetricCard({ label, value, icon, trend }: MetricCardProps) {
  return (
    <div className="flex flex-col gap-2 rounded-card border border-border bg-white p-5 shadow-card">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-ink-light">{label}</span>
        {icon && <span className="text-brand">{icon}</span>}
      </div>
      <span className="text-2xl font-extrabold text-ink">{value}</span>
      {trend && (
        <span
          className={clsx(
            'text-xs font-semibold',
            trend.positive ? 'text-success' : 'text-ink-light'
          )}
        >
          {trend.value}
        </span>
      )}
    </div>
  );
}
