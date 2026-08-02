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

export interface OpportunityBadge {
  label: string;
  tone: 'danger' | 'warning' | 'success';
  emoji: string;
}

/** Indicador de Oportunidad (HU-012): calculado automáticamente según la
 * urgencia declarada por el cliente. No es editable manualmente y se
 * recalcula solo si la urgencia cambia. */
export function getOpportunityBadge(urgency: RequirementUrgency | null): OpportunityBadge {
  if (urgency === 'asap' || urgency === 'within_30_days') {
    return { label: 'Urgente', tone: 'danger', emoji: '🔴' };
  }
  if (urgency === '1_3_months') {
    return { label: 'Próximo', tone: 'warning', emoji: '🟡' };
  }
  return { label: 'Flexible', tone: 'success', emoji: '🟢' };
}

/** Completitud del requerimiento (0-100): operación y presupuesto siempre
 * están presentes (son obligatorios al publicar), así que parten en 40%.
 * El resto se suma según cuántos datos opcionales se completaron —
 * mientras más completo, más confían propietarios y agentes en la
 * oportunidad, y mejor puede priorizarse en el listado. */
export function getCompletenessScore(requirement: Requirement): number {
  let score = 40;
  if (requirement.bedrooms != null) score += 15;
  if (requirement.bathrooms != null) score += 15;
  if (requirement.min_area_m2 != null) score += 10;
  if (requirement.parking || requirement.pets) score += 10;
  if ((requirement.description ?? '').trim().length >= 50) score += 10;
  return Math.min(100, score);
}
