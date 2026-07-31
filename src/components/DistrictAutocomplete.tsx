import { useEffect, useRef, useState } from 'react';
import { MapPin } from 'lucide-react';
import { LIMA_DISTRICT_COORDS } from '@/lib/limaDistricts';

const DISTRICT_OPTIONS = Object.keys(LIMA_DISTRICT_COORDS)
  .filter((k) => k !== 'lima' && k !== 'cercado de lima')
  .map((k) => k.replace(/\b\w/g, (c) => c.toUpperCase()));

interface DistrictAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

/**
 * Autocompletado de distritos de Lima. Nota: el PDD original pide que las
 * sugerencias vengan de Google Places o Mapbox; ambas requieren una API key
 * de pago que no está configurada en este proyecto. Mientras tanto, este
 * componente sugiere sobre la lista de distritos ya integrada en la app
 * (misma que usa el mapa). Si más adelante quieres conectar Google Places o
 * Mapbox, este es el único componente que habría que reemplazar.
 */
export function DistrictAutocomplete({ value, onChange, placeholder, className }: DistrictAutocompleteProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  const suggestions = value.trim()
    ? DISTRICT_OPTIONS.filter((d) => d.toLowerCase().includes(value.trim().toLowerCase())).slice(0, 6)
    : DISTRICT_OPTIONS.slice(0, 6);

  return (
    <div className="relative" ref={ref}>
      <input
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        placeholder={placeholder ?? 'Distrito o zona'}
        className={
          className ??
          'h-11 w-full rounded-input border border-border bg-white px-3 text-sm text-ink placeholder:text-ink-light/60 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20'
        }
      />
      {open && suggestions.length > 0 && (
        <div className="absolute z-50 mt-1 w-full overflow-hidden rounded-input border border-border bg-white shadow-soft">
          {suggestions.map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => {
                onChange(d);
                setOpen(false);
              }}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-ink hover:bg-surface-muted"
            >
              <MapPin size={14} className="text-brand" />
              {d}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
