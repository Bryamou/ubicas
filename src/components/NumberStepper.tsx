import { Minus, Plus } from 'lucide-react';

interface NumberStepperProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
}

export function NumberStepper({ label, value, onChange, min = 0, max = 20 }: NumberStepperProps) {
  return (
    <div className="flex items-center justify-between rounded-input border border-border bg-white px-3 py-2">
      <span className="text-sm font-medium text-ink">{label}</span>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => onChange(Math.max(min, value - 1))}
          disabled={value <= min}
          className="flex h-8 w-8 items-center justify-center rounded-full border border-border text-ink hover:bg-surface-muted disabled:opacity-30"
          aria-label={`Reducir ${label}`}
        >
          <Minus size={14} />
        </button>
        <span className="w-4 text-center text-sm font-semibold text-ink">{value}</span>
        <button
          type="button"
          onClick={() => onChange(Math.min(max, value + 1))}
          disabled={value >= max}
          className="flex h-8 w-8 items-center justify-center rounded-full border border-border text-ink hover:bg-surface-muted disabled:opacity-30"
          aria-label={`Aumentar ${label}`}
        >
          <Plus size={14} />
        </button>
      </div>
    </div>
  );
}
