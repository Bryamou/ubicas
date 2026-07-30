interface LogoProps {
  className?: string;
  /** Altura en px. Mínimo recomendado por la guía de marca: 24px. */
  height?: number;
}

/**
 * Wordmark oficial de Ubicas (ícono + "UBICAS"), tal como fue entregado
 * como recurso gráfico. No se redibuja ni se sustituye por texto
 * tipografiado, y no se distorsiona ni recolorea por separado.
 */
export function Logo({ className = '', height = 32 }: LogoProps) {
  return (
    <img
      src="/logo.png"
      alt="Ubicas"
      style={{ height }}
      className={`w-auto select-none ${className}`}
      draggable={false}
    />
  );
}
