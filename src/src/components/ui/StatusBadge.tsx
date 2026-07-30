import clsx from 'clsx';

export type StatusTone = 'neutral' | 'success' | 'warning' | 'danger' | 'info' | 'brand';

interface StatusBadgeProps {
  label: string;
  tone?: StatusTone;
}

const toneClasses: Record<StatusTone, string> = {
  neutral: 'bg-surface-muted text-ink-light',
  success: 'bg-success-soft text-success',
  warning: 'bg-warning-soft text-warning',
  danger: 'bg-red-50 text-red-600',
  info: 'bg-info-soft text-info',
  brand: 'bg-brand-soft text-brand',
};

const statusToneMap: Record<string, StatusTone> = {
  draft: 'neutral',
  published: 'success',
  paused: 'warning',
  sold: 'brand',
  rented: 'brand',
  closed: 'danger',
  pending: 'warning',
  accepted: 'success',
  rejected: 'danger',
  completed: 'success',
  active: 'success',
  attended: 'info',
};

const statusLabelMap: Record<string, string> = {
  draft: 'Borrador',
  published: 'Publicado',
  paused: 'Pausado',
  sold: 'Vendido',
  rented: 'Alquilado',
  closed: 'Cerrado',
  pending: 'Pendiente',
  accepted: 'Aceptada',
  rejected: 'Rechazada',
  completed: 'Completada',
  active: 'Activo',
  attended: 'Atendido',
};

/** Si se pasa `status` (código interno), se traduce automáticamente al español
 * y se colorea según el mapa por defecto. Si se pasa `label` + `tone`, se usan tal cual. */
export function StatusBadge({
  status,
  label,
  tone,
}: {
  status?: string;
  label?: string;
  tone?: StatusTone;
}) {
  const resolvedTone = tone ?? (status ? statusToneMap[status] ?? 'neutral' : 'neutral');
  const resolvedLabel = label ?? (status ? statusLabelMap[status] ?? status : '');

  return (
    <span
      className={clsx(
        'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold',
        toneClasses[resolvedTone]
      )}
    >
      {resolvedLabel}
    </span>
  );
}
