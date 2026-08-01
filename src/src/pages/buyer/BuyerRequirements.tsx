import { Link } from 'react-router-dom';
import { ClipboardList } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useBuyerRequirements } from '@/hooks/useBuyerData';
import { LoadingState } from '@/components/ui/LoadingState';
import { EmptyState } from '@/components/ui/EmptyState';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Button } from '@/components/ui/Button';
import type { RequirementStatus } from '@/types/database';

const typeLabels: Record<string, string> = {
  apartment: 'Departamento',
  house: 'Casa',
  office: 'Oficina',
  land: 'Terreno',
  commercial: 'Local comercial',
  other: 'Otro',
};

function actionsFor(status: RequirementStatus): { label: string; next: RequirementStatus }[] {
  switch (status) {
    case 'active':
      return [{ label: 'Pausar', next: 'paused' }, { label: 'Cerrar', next: 'closed' }];
    case 'paused':
      return [{ label: 'Reactivar', next: 'active' }, { label: 'Cerrar', next: 'closed' }];
    default:
      return [];
  }
}

export function BuyerRequirementsPage() {
  const { profile } = useAuth();
  const { requirements, loading, updateStatus } = useBuyerRequirements(profile?.id);

  if (loading) return <LoadingState label="Cargando tus requerimientos…" />;

  if (requirements.length === 0) {
    return (
      <EmptyState
        icon={<ClipboardList size={28} />}
        title="Aún no publicaste ningún requerimiento"
        description="Cuéntanos qué inmueble buscas y propietarios y agentes podrán contactarte."
        action={
          <Link to="/publicar-requerimiento">
            <Button variant="primary">Publicar requerimiento</Button>
          </Link>
        }
      />
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {requirements.map((r) => (
        <div key={r.id} className="flex flex-col gap-3 rounded-card border border-border bg-white p-4 shadow-card sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-semibold text-ink">
                {r.operation === 'sale' ? 'Compra' : 'Alquiler'} · {typeLabels[r.property_type] ?? r.property_type} en {r.district}
              </h3>
              <StatusBadge status={r.status} />
            </div>
            <p className="text-sm text-ink-light">
              Presupuesto máximo: S/ {r.max_budget.toLocaleString('es-PE')}
              {r.bedrooms != null && ` · ${r.bedrooms} dorm.`}
              {r.bathrooms != null && ` · ${r.bathrooms} baños`}
              {r.parking && ' · con cochera'}
              {r.pets && ' · acepta mascotas'}
            </p>
            <p className="mt-1 text-xs text-ink-light">
              Publicado el {new Date(r.created_at).toLocaleDateString('es-PE')}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {actionsFor(r.status).map((a) => (
              <Button key={a.next} variant="secondary" size="sm" onClick={() => updateStatus(r.id, a.next)}>
                {a.label}
              </Button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
