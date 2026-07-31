import { useEffect, useRef, useState } from 'react';
import { ChevronDown, Check, Search } from 'lucide-react';
import { LIMA_DISTRICT_COORDS } from '@/lib/limaDistricts';

const DISTRICT_OPTIONS = Object.keys(LIMA_DISTRICT_COORDS)
  .filter((k) => k !== 'lima' && k !== 'cercado de lima')
  .map((k) => k.replace(/\b\w/g, (c) => c.toUpperCase()))
  .sort((a, b) => a.localeCompare(b));

interface DistrictMultiSelectProps {
  selected: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  className?: string;
}

/** Selección múltiple de distritos, con un campo de búsqueda para filtrar
 * la lista mientras se escribe. Misma fuente de datos que el mapa y el
 * autocompletado simple (ver nota sobre Google Places/Mapbox en
 * DistrictAutocomplete.tsx). */
export function DistrictMultiSelect({ selected, onChange, placeholder, className }: DistrictMultiSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  const filtered = DISTRICT_OPTIONS.filter((d) => d.toLowerCase().includes(query.trim().toLowerCase()));

  const toggle = (value: string) => {
    onChange(selected.includes(value) ? selected.filter((v) => v !== value) : [...selected, value]);
  };

  const summary =
    selected.length === 0
      ? (placeholder ?? 'Departamentos o distritos')
      : selected.length === 1
        ? selected[0]
        : `${selected.length} distritos seleccionados`;

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={
          className ??
          'flex h-11 w-full items-center justify-between gap-2 rounded-input border border-border bg-white px-3 text-sm text-ink'
        }
      >
        <span className="truncate">{summary}</span>
        <ChevronDown size={15} className="shrink-0 text-ink-light" />
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-72 overflow-hidden rounded-input border border-border bg-white shadow-soft">
          <div className="flex items-center gap-2 border-b border-border px-3 py-2">
            <Search size={14} className="text-ink-light" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar distrito…"
              className="w-full text-sm text-ink placeholder:text-ink-light/60 focus:outline-none"
            />
          </div>
          <div className="max-h-64 overflow-y-auto p-2">
            {filtered.length === 0 ? (
              <p className="px-2 py-3 text-center text-xs text-ink-light">Sin resultados</p>
            ) : (
              filtered.map((d) => (
                <button
                  type="button"
                  key={d}
                  onClick={() => toggle(d)}
                  className="flex w-full items-center gap-2 rounded-input px-2 py-1.5 text-left text-sm text-ink hover:bg-surface-muted"
                >
                  <span
                    className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                      selected.includes(d) ? 'border-brand bg-brand text-white' : 'border-border bg-white'
                    }`}
                  >
                    {selected.includes(d) && <Check size={11} />}
                  </span>
                  {d}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
