import { NavLink } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';
import clsx from 'clsx';

export interface SidebarItem {
  to: string;
  label: string;
  icon: LucideIcon;
  end?: boolean;
}

interface PanelSidebarProps {
  items: SidebarItem[];
}

export function PanelSidebar({ items }: PanelSidebarProps) {
  return (
    <aside className="w-full shrink-0 border-b border-border bg-white md:w-64 md:border-b-0 md:border-r">
      <nav className="flex gap-1 overflow-x-auto p-3 md:flex-col md:overflow-visible">
        {items.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              clsx(
                'flex shrink-0 items-center gap-3 rounded-input px-3 py-2.5 text-sm font-medium transition',
                isActive
                  ? 'bg-brand-soft text-brand'
                  : 'text-ink-light hover:bg-surface-muted hover:text-ink'
              )
            }
          >
            <Icon size={18} />
            <span className="whitespace-nowrap">{label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
