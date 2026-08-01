import { useEffect, useRef, useState } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export interface MultiSelectOption {
  value: string;
  label: string;
}

interface MultiSelectDropdownProps {
  options: MultiSelectOption[];
  selected: string[];
  onChange: (values: string[]) => void;
  placeholder: string;
  className?: string;
  /** Texto de la opción que marca/desmarca todo. Por defecto "Todos". */
  allLabel?: string;
}

function CheckboxMark({ checked }: { checked: boolean }) {
  return (
    <span
      className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
        checked ? 'border-brand bg-brand text-white' : 'border-border bg-white'
      }`}
    >
      {checked && <Check size={11} />}
    </span>
  );
}

/** Dropdown de selección múltiple con checkboxes y una opción "Todos" que
 * marca o desmarca todo de una vez. El botón muestra un resumen: el label
 * de la única opción elegida, "Todos" si están todas marcadas, o "N
 * seleccionados" en cualquier otro caso. */
export function MultiSelectDropdown({
  options,
  selected,
  onChange,
  placeholder,
  className,
  allLabel = 'Todos',
}: MultiSelectDropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  const allSelected = selected.length === options.length && options.length > 0;

  const toggleAll = () => onChange(allSelected ? [] : options.map((o) => o.value));

  const toggleOne = (value: string) => {
    onChange(selected.includes(value) ? selected.filter((v) => v !== value) : [...selected, value]);
  };

  const summary = allSelected
    ? allLabel
    : selected.length === 0
      ? placeholder
      : selected.length === 1
        ? (options.find((o) => o.value === selected[0])?.label ?? placeholder)
        : `${selected.length} seleccionados`;

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
        <div className="absolute z-50 mt-1 max-h-72 w-64 max-w-[90vw] overflow-y-auto rounded-input border border-border bg-white p-2 shadow-soft">
          <button
            type="button"
            onClick={toggleAll}
            className="flex w-full items-center gap-2 rounded-input px-2 py-1.5 text-left text-sm font-semibold text-ink hover:bg-surface-muted"
          >
            <CheckboxMark checked={allSelected} />
            {allLabel}
          </button>
          <hr className="my-1 border-border" />
          {options.map((o) => (
            <button
              type="button"
              key={o.value}
              onClick={() => toggleOne(o.value)}
              className="flex w-full items-center gap-2 rounded-input px-2 py-1.5 text-left text-sm text-ink hover:bg-surface-muted"
            >
              <CheckboxMark checked={selected.includes(o.value)} />
              {o.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
