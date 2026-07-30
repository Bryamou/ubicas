import { Building2, Eye, MessagesSquare, Handshake } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useOwnerProperties } from '@/hooks/useOwnerProperties';
import { MetricCard } from '@/components/ui/MetricCard';
import { LoadingState } from '@/components/ui/LoadingState';
import { EmptyState } from '@/components/ui/EmptyState';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import type { PropertyStatus } from '@/types/database';

const statusOrder: PropertyStatus[] = ['draft', 'published', 'paused', 'sold', 'rented', 'closed'];

export function OwnerDashboardPage() {
  const { profile } = useAuth();
  const { properties, loading } = useOwnerProperties(profile?.id);

  if (loading) return <LoadingState label="Cargando tu resumen…" />;

  const countByStatus = (status: PropertyStatus) =>
    properties.filter((p) => p.status === status).length;

  const totalViews = properties.reduce((acc, p) => acc + p.viewsCount, 0);
  const totalContacts = properties.reduce((acc, p) => acc + p.contactsCount, 0);
  const totalPendingProposals = properties.reduce((acc, p) => acc + p.pendingProposalsCount, 0);

  return (
    <div className="flex flex-col gap-8">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Inmuebles publicados" value={countByStatus('published')} icon={<Building2 size={18} />} />
        <MetricCard label="Vistas totales" value={totalViews} icon={<Eye size={18} />} />
        <MetricCard label="Contactos recibidos" value={totalContacts} icon={<MessagesSquare size={18} />} />
        <MetricCard label="Propuestas pendientes" value={totalPendingProposals} icon={<Handshake size={18} />} />
      </div>

      <div>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-ink-light">
          Inmuebles por estado
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {statusOrder.map((status) => (
            <div key={status} className="rounded-card border border-border bg-white p-4 text-center shadow-card">
              <p className="text-2xl font-extrabold text-ink">{countByStatus(status)}</p>
              <div className="mt-1 flex justify-center">
                <StatusBadge status={status} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-light">
            Últimos inmuebles publicados
          </h2>
          <Link to="/panel/propietario/inmuebles" className="text-sm font-semibold text-brand hover:underline">
            Ver todos
          </Link>
        </div>

        {properties.length === 0 ? (
          <EmptyState
            title="Aún no tienes inmuebles"
            description="Publica tu primer inmueble gratis y empieza a recibir contactos."
            action={
              <Link to="/publicar-inmueble">
                <Button variant="primary">Publicar inmueble gratis</Button>
              </Link>
            }
          />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {properties.slice(0, 3).map((p) => (
              <div key={p.id} className="flex gap-3 rounded-card border border-border bg-white p-3 shadow-card">
                <div className="h-16 w-16 shrink-0 overflow-hidden rounded-input bg-surface-muted">
                  {p.coverImageUrl && (
                    <img src={p.coverImageUrl} alt="" className="h-full w-full object-cover" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-ink">{p.title}</p>
                  <p className="text-xs text-ink-light">{p.district}</p>
                  <div className="mt-1">
                    <StatusBadge status={p.status} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
