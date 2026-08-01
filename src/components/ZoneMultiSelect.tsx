import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Search, X, Check } from 'lucide-react';
import { LIMA_DISTRICT_COORDS } from '@/lib/limaDistricts';

const DISTRICT_OPTIONS = Object.keys(LIMA_DISTRICT_COORDS)
  .filter((k) => k !== 'lima' && k !== 'cercado de lima')
  .map((k) => k.replace(/\b\w/g, (c) => c.toUpperCase()))
  .sort((a, b) => a.localeCompare(b));

interface ZoneMultiSelectProps {
  selected: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  className?: string;
  /** Si es true, elegir una zona reemplaza cualquier selección previa
   * (para campos de una sola ubicación, ej. al publicar un inmueble). */
  single?: boolean;
}

function ChipPill({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="flex shrink-0 items-center gap-1 rounded-full border border-brand/30 bg-brand-soft px-2.5 py-1 text-sm font-medium text-ink">
      {label}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
        aria-label={`Quitar ${label}`}
        className="flex h-4 w-4 items-center justify-center rounded-full bg-brand text-white"
      >
        <X size={10} />
      </button>
    </span>
  );
}

/**
 * Selector de ubicaciones: las zonas elegidas quedan como chips DENTRO del
 * mismo campo (no debajo, no ocultas), se puede seguir escribiendo para
 * agregar más a continuación, y cuando ya no caben más chips en la línea,
 * las que sobran se colapsan en una etiqueta "+N ubicaciones más".
 */
export function ZoneMultiSelect({ selected, onChange, placeholder, className, single }: ZoneMultiSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [visibleCount, setVisibleCount] = useState(selected.length);
  const ref = useRef<HTMLDivElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery('');
      }
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  // Mide cuántos chips caben en una sola línea y colapsa el resto en "+N".
  useLayoutEffect(() => {
    const wrap = wrapRef.current;
    const measure = measureRef.current;
    if (!wrap || !measure || selected.length === 0) {
      setVisibleCount(selected.length);
      return;
    }
    const available = wrap.clientWidth - 96; // reserva para ícono + input + margen
    const chipEls = Array.from(measure.children) as HTMLElement[];
    let used = 0;
    let count = 0;
    for (const el of chipEls) {
      used += el.offsetWidth + 6;
      if (used > available) break;
      count++;
    }
    setVisibleCount(Math.max(count, 1));
  }, [selected]);

  const suggestions = DISTRICT_OPTIONS.filter(
    (d) => !selected.includes(d) && (query.trim() ? d.toLowerCase().includes(query.trim().toLowerCase()) : true)
  ).slice(0, 8);

  const add = (value: string) => {
    if (single) {
      onChange([value]);
      setOpen(false);
    } else {
      onChange([...selected, value]);
    }
    setQuery('');
  };

  const remove = (value: string) => onChange(selected.filter((v) => v !== value));

  const hiddenCount = selected.length - visibleCount;

  return (
    <div className="relative" ref={ref}>
      <div
        ref={wrapRef}
        onClick={() => setOpen(true)}
        className={
          className ??
          'flex h-11 w-full cursor-text items-center gap-1.5 overflow-hidden rounded-input border border-border bg-white px-3'
        }
      >
        <Search size={15} className="shrink-0 text-ink-light" />

        {/* Clon invisible solo para medir el ancho real de cada chip */}
        <div ref={measureRef} className="pointer-events-none invisible absolute left-0 top-0 flex gap-1.5" aria-hidden="true">
          {selected.map((d) => (
            <ChipPill key={d} label={d} onRemove={() => {}} />
          ))}
        </div>

        {selected.slice(0, visibleCount).map((d) => (
          <ChipPill key={d} label={d} onRemove={() => remove(d)} />
        ))}
        {hiddenCount > 0 && (
          <span className="shrink-0 whitespace-nowrap rounded-full bg-surface-muted px-2.5 py-1 text-xs font-semibold text-ink-light">
            +{hiddenCount} ubicaciones más
          </span>
        )}

        <input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder={selected.length === 0 ? (placeholder ?? 'Ingresa ubicaciones') : ''}
          className="min-w-[40px] flex-1 bg-transparent text-sm text-ink placeholder:text-ink-light/60 focus:outline-none"
        />
      </div>

      {open && suggestions.length > 0 && (
        <div className="absolute z-50 mt-1 w-72 max-w-[90vw] overflow-hidden rounded-input border border-border bg-white shadow-soft">
          <div className="max-h-64 overflow-y-auto p-2">
            {suggestions.map((d) => (
              <button
                type="button"
                key={d}
                onClick={() => add(d)}
                className="flex w-full items-center gap-2 rounded-input px-2 py-1.5 text-left text-sm text-ink hover:bg-surface-muted"
              >
                <Check size={12} className="text-transparent" />
                {d}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
