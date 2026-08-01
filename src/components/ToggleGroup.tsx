interface ToggleOption {
  value: string;
  label: string;
}

interface ToggleGroupProps {
  options: ToggleOption[];
  value: string;
  onChange: (value: string) => void;
}

export function ToggleGroup({ options, value, onChange }: ToggleGroupProps) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {options.map((o) => (
        <button
          type="button"
          key={o.value}
          onClick={() => onChange(o.value)}
          className={`h-14 rounded-input border-2 text-base font-bold transition ${
            value === o.value
              ? 'border-brand bg-brand-soft text-brand'
              : 'border-border text-ink-light hover:border-brand/40'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
