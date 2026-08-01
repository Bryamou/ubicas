import type { LucideIcon } from 'lucide-react';

interface CardOption {
  value: string;
  label: string;
  icon: LucideIcon;
}

interface CardSelectProps {
  options: CardOption[];
  value: string;
  onChange: (value: string) => void;
}

export function CardSelect({ options, value, onChange }: CardSelectProps) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      {options.map(({ value: v, label, icon: Icon }) => (
        <button
          type="button"
          key={v}
          onClick={() => onChange(v)}
          className={`flex flex-col items-center gap-2 rounded-input border-2 px-2 py-4 text-center transition ${
            value === v ? 'border-brand bg-brand-soft text-brand' : 'border-border text-ink-light hover:border-brand/40'
          }`}
        >
          <Icon size={22} />
          <span className="text-xs font-semibold">{label}</span>
        </button>
      ))}
    </div>
  );
}
