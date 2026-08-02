import { Link } from 'react-router-dom';
import { Users, PlusCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useAgentLinkedRequirements } from '@/hooks/useAgentData';
import { requirementTypeLabels } from '@/lib/requirementHelpers';
import { LoadingState } from '@/components/ui/LoadingState';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';

/** "Clientes" del agente: los vinculados (propuesta aceptada) más los que
 * el propio agente publicó en nombre de un cliente, con etiqueta que
 * distingue el origen de cada uno. */
export function AgentClientsPage() {
  const { profile } = useAuth();
  const { requirements, loading } = useAgentLinkedRequirements(profile?.id);

  if (loading) return <LoadingState label="Cargando clientes…" />;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex justify-end">
        <Link to="/publicar-requerimiento">
          <Button variant="primary" icon={<PlusCircle size={16} />}>
            Publicar cliente
          </Button>
        </Link>
      </div>

      {requirements.length === 0 ? (
        <EmptyState
          icon={<Users size={28} />}
          title="Aún no tienes clientes"
          description="Cuando un cliente acepte una de tus propuestas, o publiques uno propio, aparecerá aquí."
        />
      ) : (
        requirements.map((r) => (
          <Link
            key={r.id}
            to={`/requerimientos/${r.id}`}
            className="flex flex-col gap-1 rounded-card border border-border bg-white p-4 shadow-card transition hover:shadow-soft"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="font-semibold text-ink">{r.buyerName}</h3>
              <span
                className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                  r.source === 'linked' ? 'bg-ink text-white' : 'bg-brand-soft text-brand'
                }`}
              >
                {r.source === 'linked' ? 'Vinculado' : 'Publicación propia'}
              </span>
            </div>
            <p className="text-sm text-ink-light">
              {r.operation === 'sale' ? 'Compra' : 'Alquiler'} · {requirementTypeLabels[r.property_type] ?? r.property_type} en{' '}
              {r.district}
            </p>
            <p className="mt-1 text-xs text-ink-light">
              {r.source === 'linked' ? 'Vinculado el' : 'Publicado el'} {new Date(r.linkedAt).toLocaleDateString('es-PE')}
            </p>
          </Link>
        ))
      )}
    </div>
  );
}
