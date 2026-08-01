import { useEffect, useRef, useState } from 'react';
import { ChevronDown, ChevronUp, Check } from 'lucide-react';

interface SortOption {
  value: string;
  label: string;
}

interface SortDropdownProps {
  options: SortOption[];
  value: string;
  onChange: (value: string) => void;
}

/** Botón que siempre muestra "Ordenar" como título (no el valor elegido);
 * las opciones solo aparecen cuando se abre el panel. */
export function SortDropdown({ options, value, onChange }: SortDropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex h-11 w-full items-center justify-between gap-2 rounded-input border border-border bg-white px-3 text-sm font-semibold text-ink"
      >
        <span>Ordenar</span>
        {open ? <ChevronUp size={15} className="text-ink-light" /> : <ChevronDown size={15} className="text-ink-light" />}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-1 w-56 overflow-hidden rounded-input border border-border bg-white shadow-soft">
          {options.map((o) => (
            <button
              type="button"
              key={o.value}
              onClick={() => {
                onChange(o.value);
                setOpen(false);
              }}
              className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm text-ink hover:bg-surface-muted"
            >
              {o.label}
              {value === o.value && <Check size={14} className="text-brand" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
