import { useState } from 'react';
import { Handshake, Send, Search, Users } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useAgentProposals, useAgentRequirementProposals } from '@/hooks/useAgentData';
import { getOrCreateConversation } from '@/hooks/useConversations';
import { LoadingState } from '@/components/ui/LoadingState';
import { EmptyState } from '@/components/ui/EmptyState';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Button } from '@/components/ui/Button';

type Tab = 'properties' | 'requirements';

export function AgentProposalsPage() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const { proposals, loading } = useAgentProposals(profile?.id);
  const { proposals: reqProposals, loading: loadingReq } = useAgentRequirementProposals(profile?.id);
  const [tab, setTab] = useState<Tab>('properties');
  const [opening, setOpening] = useState<string | null>(null);

  const messageBuyer = async (buyerId: string) => {
    if (!profile) return;
    setOpening(buyerId);
    const { id } = await getOrCreateConversation(profile.id, buyerId, null);
    setOpening(null);
    if (id) navigate(`/mensajes?conversation=${id}`);
  };

  if (loading || loadingReq) return <LoadingState label="Cargando tus propuestas…" />;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-0">
        <div className="flex gap-2">
          <button
            onClick={() => setTab('properties')}
            className={`border-b-2 px-3 py-2 text-sm font-semibold ${tab === 'properties' ? 'border-brand text-brand' : 'border-transparent text-ink-light'}`}
          >
            A propietarios ({proposals.length})
          </button>
          <button
            onClick={() => setTab('requirements')}
            className={`border-b-2 px-3 py-2 text-sm font-semibold ${tab === 'requirements' ? 'border-brand text-brand' : 'border-transparent text-ink-light'}`}
          >
            A compradores ({reqProposals.length})
          </button>
        </div>
        <Link to={tab === 'properties' ? '/inmuebles' : '/requerimientos'} className="mb-2">
          <Button variant="primary" icon={tab === 'properties' ? <Search size={16} /> : <Users size={16} />}>
            {tab === 'properties' ? 'Buscar inmuebles para proponerme' : 'Buscar clientes'}
          </Button>
        </Link>
      </div>

      {tab === 'properties' &&
        (proposals.length === 0 ? (
          <EmptyState
            icon={<Handshake size={28} />}
            title="Aún no enviaste propuestas a propietarios"
            description="Busca un inmueble publicado por un propietario directo y proponte para representarlo."
            action={
              <Link to="/inmuebles" className="text-sm font-semibold text-brand hover:underline">
                Ver inmuebles publicados
              </Link>
            }
          />
        ) : (
          <div className="flex flex-col gap-3">
            {proposals.map((p) => (
              <div key={p.id} className="rounded-card border border-border bg-white p-5 shadow-card">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <Link to={`/inmuebles/${p.property_id}`} className="font-semibold text-ink hover:underline">
                      {p.propertyTitle}
                    </Link>
                    <p className="text-xs text-ink-light">
                      {p.propertyDistrict} · Propietario: {p.ownerName}
                    </p>
                  </div>
                  <StatusBadge status={p.status} />
                </div>
                <p className="mt-3 text-sm text-ink">{p.pitch}</p>
                <p className="mt-2 text-sm font-semibold text-ink">
                  Comisión propuesta:{' '}
                  {p.commission_percent != null ? `${p.commission_percent}%` : `S/ ${p.commission_amount?.toLocaleString('es-PE')}`}
                </p>
                <p className="mt-1 text-xs text-ink-light">
                  Enviada el {new Date(p.created_at).toLocaleDateString('es-PE')}
                  {p.resolved_at && ` · Resuelta el ${new Date(p.resolved_at).toLocaleDateString('es-PE')}`}
                </p>
                {p.status === 'accepted' && (
                  <div className="mt-3">
                    <Button
                      variant="secondary"
                      size="sm"
                      icon={<Send size={14} />}
                      loading={opening === p.owner_id}
                      onClick={() => messageBuyer(p.owner_id)}
                    >
                      Escribirle al propietario
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        ))}

      {tab === 'requirements' &&
        (reqProposals.length === 0 ? (
          <EmptyState
            icon={<Handshake size={28} />}
            title="Aún no enviaste propuestas a compradores"
            description="Ve a los clientes activos y ofrece tus servicios."
            action={
              <Link to="/requerimientos" className="text-sm font-semibold text-brand hover:underline">
                Ver clientes activos
              </Link>
            }
          />
        ) : (
          <div className="flex flex-col gap-3">
            {reqProposals.map((p) => (
              <div key={p.id} className="rounded-card border border-border bg-white p-5 shadow-card">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <Link to={`/requerimientos/${p.requirement_id}`} className="font-semibold text-ink hover:underline">
                      {p.requirementSummary}
                    </Link>
                    <p className="text-xs text-ink-light">Comprador: {p.buyerName}</p>
                  </div>
                  <StatusBadge status={p.status} />
                </div>
                <p className="mt-3 text-sm text-ink">{p.pitch}</p>
                <p className="mt-1 text-xs text-ink-light">
                  Enviada el {new Date(p.created_at).toLocaleDateString('es-PE')}
                  {p.resolved_at && ` · Resuelta el ${new Date(p.resolved_at).toLocaleDateString('es-PE')}`}
                </p>
                {p.status === 'accepted' && (
                  <div className="mt-3">
                    <Button
                      variant="secondary"
                      size="sm"
                      icon={<Send size={14} />}
                      loading={opening === p.buyer_id}
                      onClick={() => messageBuyer(p.buyer_id)}
                    >
                      Enviarle opciones de inmuebles
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        ))}
    </div>
  );
}
