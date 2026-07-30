import { Building2, Handshake, Clock, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useAgentLinkedProperties, useAgentProposals } from '@/hooks/useAgentData';
import { MetricCard } from '@/components/ui/MetricCard';
import { LoadingState } from '@/components/ui/LoadingState';
import { EmptyState } from '@/components/ui/EmptyState';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Alert } from '@/components/ui/Alert';
import { Link } from 'react-router-dom';

export function AgentDashboardPage() {
  const { profile } = useAuth();
  const { properties, loading: loadingProperties } = useAgentLinkedProperties(profile?.id);
  const { proposals, loading: loadingProposals } = useAgentProposals(profile?.id);

  if (loadingProperties || loadingProposals) return <LoadingState label="Cargando tu resumen…" />;

  const pending = proposals.filter((p) => p.status === 'pending').length;
  const accepted = proposals.filter((p) => p.status === 'accepted').length;

  return (
    <div className="flex flex-col gap-8">
      {!profile?.agent_verified && (
        <Alert type="info" title="Tu cuenta está en revisión">
          Un miembro del equipo de Ubicas verificará tu perfil profesional pronto. Mientras tanto, puedes seguir
          enviando propuestas normalmente.
        </Alert>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Inmuebles vinculados" value={properties.length} icon={<Building2 size={18} />} />
        <MetricCard label="Propuestas pendientes" value={pending} icon={<Clock size={18} />} />
        <MetricCard label="Propuestas aceptadas" value={accepted} icon={<Handshake size={18} />} />
        <MetricCard
          label="Estado de verificación"
          value={profile?.agent_verified ? 'Verificado' : 'Pendiente'}
          icon={<ShieldCheck size={18} />}
        />
      </div>

      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-light">Últimas propuestas enviadas</h2>
          <Link to="/panel/agente/propuestas" className="text-sm font-semibold text-brand hover:underline">
            Ver todas
          </Link>
        </div>

        {proposals.length === 0 ? (
          <EmptyState
            icon={<Handshake size={28} />}
            title="Aún no enviaste propuestas"
            description="Busca un inmueble publicado y proponte para representarlo."
            action={
              <Link to="/inmuebles" className="text-sm font-semibold text-brand hover:underline">
                Ver inmuebles publicados
              </Link>
            }
          />
        ) : (
          <div className="flex flex-col gap-2">
            {proposals.slice(0, 5).map((p) => (
              <div key={p.id} className="flex items-center justify-between rounded-card border border-border bg-white p-3 shadow-card">
                <div>
                  <p className="text-sm font-semibold text-ink">{p.propertyTitle}</p>
                  <p className="text-xs text-ink-light">{p.propertyDistrict} · Propietario: {p.ownerName}</p>
                </div>
                <StatusBadge status={p.status} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
