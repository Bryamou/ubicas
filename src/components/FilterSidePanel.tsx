import { type ReactNode, useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { createPortal } from 'react-dom';

interface FilterSidePanelProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
}

/**
 * Panel de filtros fijo al borde derecho, desde el borde superior de la
 * ventana (no un widget flotante con margen). A propósito NO tiene fondo
 * oscuro ni bloquea el scroll de la página: el usuario puede seguir
 * scrolleando y viendo los inmuebles detrás mientras el panel está abierto.
 * Se cierra solo con un clic en cualquier parte fuera del panel.
 */
export function FilterSidePanel({ open, onClose, title, children, footer }: FilterSidePanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) onClose();
    };
    // Se registra en el siguiente tick para no capturar el mismo clic que abrió el panel.
    const timer = setTimeout(() => document.addEventListener('mousedown', onClickOutside), 0);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', onClickOutside);
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div
      ref={panelRef}
      className="fixed inset-y-0 right-0 z-40 flex w-full max-w-xs flex-col border-l border-border bg-white shadow-soft sm:max-w-sm"
    >
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <h2 className="text-lg font-bold text-ink">{title}</h2>
        <button
          onClick={onClose}
          className="rounded-full p-1.5 text-ink-light hover:bg-surface-muted"
          aria-label="Cerrar"
        >
          <X size={18} />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto px-5 py-5">{children}</div>
      {footer && <div className="flex gap-3 border-t border-border px-5 py-4">{footer}</div>}
    </div>,
    document.body
  );
}
