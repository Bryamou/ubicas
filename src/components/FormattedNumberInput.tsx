import { useEffect, useState } from 'react';

interface FormattedNumberInputProps {
  onValueChange: (value: number | null) => void;
  placeholder?: string;
  className?: string;
  /** Valor inicial (ej. leído de la URL) para reflejarlo formateado. */
  value?: string;
}

/** Input numérico que formatea con separador de miles en vivo (ej. 650000
 * -> 650,000), sin ninguna lógica de moneda — la moneda se elige aparte
 * en un select contiguo. */
export function FormattedNumberInput({ onValueChange, placeholder, className, value }: FormattedNumberInputProps) {
  const [display, setDisplay] = useState(value ? Number(value).toLocaleString('es-PE') : '');

  useEffect(() => {
    setDisplay(value ? Number(value).toLocaleString('es-PE') : '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const handleChange = (raw: string) => {
    const digits = raw.replace(/[^0-9]/g, '');
    setDisplay(digits ? Number(digits).toLocaleString('es-PE') : '');
    onValueChange(digits ? Number(digits) : null);
  };

  return (
    <input
      value={display}
      onChange={(e) => handleChange(e.target.value)}
      placeholder={placeholder}
      inputMode="numeric"
      className={
        className ??
        'h-11 w-full rounded-input border border-border bg-white px-3 text-sm text-ink placeholder:text-ink-light/60 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20'
      }
    />
  );
}
