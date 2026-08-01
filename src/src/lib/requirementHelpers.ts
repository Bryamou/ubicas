import type { Requirement, RequirementUrgency } from '@/types/database';

export const requirementTypeLabels: Record<string, string> = {
  apartment: 'Departamento',
  house: 'Casa',
  office: 'Oficina',
  land: 'Terreno',
  commercial: 'Local',
  project: 'Proyecto',
  other: 'Otro',
};

export const urgencyOptions: { value: RequirementUrgency; label: string }[] = [
  { value: 'asap', label: 'Lo antes posible' },
  { value: 'within_30_days', label: 'Dentro de 30 días' },
  { value: '1_3_months', label: '1-3 meses' },
  { value: 'more_than_3_months', label: 'Más de 3 meses' },
  { value: 'flexible', label: 'Flexible' },
];

export function urgencyLabel(urgency: RequirementUrgency | null): string {
  return urgencyOptions.find((o) => o.value === urgency)?.label ?? 'Flexible';
}

/** Frase completa para mostrar la fecha esperada, ej. "Necesita mudarse lo
 * antes posible" — no tenemos un mes/año exacto (la urgencia es una
 * categoría, no una fecha puntual), así que la frase se arma sobre eso. */
export function expectedDatePhrase(urgency: RequirementUrgency | null): string {
  switch (urgency) {
    case 'asap':
      return 'Necesita mudarse lo antes posible';
    case 'within_30_days':
      return 'Necesita mudarse dentro de 30 días';
    case '1_3_months':
      return 'Planea mudarse en 1 a 3 meses';
    case 'more_than_3_months':
      return 'Planea mudarse en más de 3 meses';
    default:
      return 'Fecha flexible';
  }
}

export function formatBudget(amount: number) {
  return `S/ ${amount.toLocaleString('es-PE')}`;
}

export function publishedDaysAgo(dateStr: string): number {
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24));
}

export function publishedLabel(dateStr: string): string {
  const days = publishedDaysAgo(dateStr);
  if (days <= 0) return 'Publicado hoy';
  if (days === 1) return 'Publicado ayer';
  return `Publicado hace ${days} días`;
}

export interface RequirementBadge {
  label: string;
  tone: 'brand' | 'warning' | 'success';
}

/** Calcula el badge de mayor prioridad para una tarjeta: compra inmediata
 * > urgente > nuevo > sin badge. */
export function getRequirementBadge(requirement: Requirement): RequirementBadge | null {
  const isUrgent = requirement.urgency === 'asap';
  if (requirement.operation === 'sale' && isUrgent) {
    return { label: 'Compra inmediata', tone: 'brand' };
  }
  if (isUrgent) {
    return { label: 'Urgente', tone: 'warning' };
  }
  if (publishedDaysAgo(requirement.created_at) <= 3) {
    return { label: 'Nuevo', tone: 'success' };
  }
  return null;
}
