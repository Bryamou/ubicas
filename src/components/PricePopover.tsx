import { useEffect, useRef, useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { FormattedNumberInput } from '@/components/FormattedNumberInput';

interface PricePopoverProps {
  currency: 'PEN' | 'USD';
  minPrice: string;
  maxPrice: string;
  onApply: (currency: 'PEN' | 'USD', min: string, max: string) => void;
  onClear: () => void;
}

/** Filtro de precio como botón + panel desplegable (moneda, desde, hasta,
 * Limpiar / Ver resultados), en vez de estar siempre visible en línea. */
export function PricePopover({ currency, minPrice, maxPrice, onApply, onClear }: PricePopoverProps) {
  const [open, setOpen] = useState(false);
  const [draftCurrency, setDraftCurrency] = useState(currency);
  const [draftMin, setDraftMin] = useState(minPrice);
  const [draftMax, setDraftMax] = useState(maxPrice);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  const openPanel = () => {
    setDraftCurrency(currency);
    setDraftMin(minPrice);
    setDraftMax(maxPrice);
    setOpen(true);
  };

  const isActive = !!(minPrice || maxPrice);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => (open ? setOpen(false) : openPanel())}
        className="flex h-11 w-full items-center justify-between gap-2 rounded-input border border-border bg-white px-3 text-sm font-semibold text-ink"
      >
        <span>Precio</span>
        <span className="flex items-center gap-1.5">
          {isActive && <span className="h-1.5 w-1.5 rounded-full bg-brand" />}
          {open ? <ChevronUp size={15} className="text-ink-light" /> : <ChevronDown size={15} className="text-ink-light" />}
        </span>
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-1 w-72 max-w-[90vw] rounded-card border border-border bg-white p-4 shadow-soft">
          <p className="mb-3 text-sm font-bold text-ink">Precio</p>

          <div className="mb-3 flex gap-4">
            <label className="flex items-center gap-2 text-sm text-ink">
              <input
                type="radio"
                checked={draftCurrency === 'PEN'}
                onChange={() => setDraftCurrency('PEN')}
                className="h-4 w-4 accent-brand"
              />
              Soles
            </label>
            <label className="flex items-center gap-2 text-sm text-ink">
              <input
                type="radio"
                checked={draftCurrency === 'USD'}
                onChange={() => setDraftCurrency('USD')}
                className="h-4 w-4 accent-brand"
              />
              USD
            </label>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <FormattedNumberInput placeholder="Desde" value={draftMin} onValueChange={(v) => setDraftMin(v ? String(v) : '')} />
            <FormattedNumberInput placeholder="Hasta" value={draftMax} onValueChange={(v) => setDraftMax(v ? String(v) : '')} />
          </div>

          <div className="mt-4 flex gap-3">
            <button
              type="button"
              onClick={() => {
                setDraftMin('');
                setDraftMax('');
                onClear();
                setOpen(false);
              }}
              className="flex-1 rounded-input border border-border py-2 text-sm font-semibold text-ink hover:bg-surface-muted"
            >
              Limpiar
            </button>
            <button
              type="button"
              onClick={() => {
                onApply(draftCurrency, draftMin, draftMax);
                setOpen(false);
              }}
              className="flex-1 rounded-input bg-brand py-2 text-sm font-semibold text-white hover:bg-brand-hover"
            >
              Ver resultados
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
