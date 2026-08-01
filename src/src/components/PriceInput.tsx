import { useState } from 'react';

interface PriceInputProps {
  onValueChange: (amount: number | null, currency: 'PEN' | 'USD') => void;
  placeholder?: string;
  className?: string;
  /** Si se pasa, ignora la detección de moneda por prefijo y siempre usa
   * esta moneda fija (ej. el buscador simplificado del Home, que solo
   * acepta montos en soles). */
  forceCurrency?: 'PEN' | 'USD';
}

function detectCurrencyAndDigits(raw: string): { currency: 'PEN' | 'USD'; digits: string } {
  const trimmed = raw.trim();
  const upper = trimmed.toUpperCase();
  const isUsd = trimmed.startsWith('$') || upper.startsWith('USD') || upper.startsWith('US$');
  const digits = trimmed.replace(/[^0-9]/g, '');
  return { currency: isUsd ? 'USD' : 'PEN', digits };
}

function formatDisplay(digits: string, currency: 'PEN' | 'USD') {
  if (!digits) return '';
  const symbol = currency === 'USD' ? 'US$' : 'S/';
  return `${symbol} ${Number(digits).toLocaleString('es-PE')}`;
}

/** Input monetario: detecta automáticamente la moneda por el prefijo que
 * escriba el usuario ($ / USD / US$ => dólares, cualquier otro caso =>
 * soles) y formatea con separador de miles mientras escribe. */
export function PriceInput({ onValueChange, placeholder, className, forceCurrency }: PriceInputProps) {
  const [display, setDisplay] = useState('');

  const handleChange = (raw: string) => {
    if (!raw.trim()) {
      setDisplay('');
      onValueChange(null, forceCurrency ?? 'PEN');
      return;
    }

    if (forceCurrency) {
      const digits = raw.replace(/[^0-9]/g, '');
      setDisplay(formatDisplay(digits, forceCurrency));
      onValueChange(digits ? Number(digits) : null, forceCurrency);
      return;
    }

    const { currency, digits } = detectCurrencyAndDigits(raw);
    const formatted = formatDisplay(digits, currency);
    setDisplay(formatted);
    onValueChange(digits ? Number(digits) : null, currency);
  };

  return (
    <input
      value={display}
      onChange={(e) => handleChange(e.target.value)}
      placeholder={placeholder ?? 'Precio máximo'}
      inputMode="numeric"
      className={
        className ??
        'h-11 w-full rounded-input border border-border bg-white px-3 text-sm text-ink placeholder:text-ink-light/60 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20'
      }
    />
  );
}
