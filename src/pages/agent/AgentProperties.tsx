import { Link } from 'react-router-dom';
import { Building2, PlusCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useAgentLinkedProperties } from '@/hooks/useAgentData';
import { LoadingState } from '@/components/ui/LoadingState';
import { EmptyState } from '@/components/ui/EmptyState';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Button } from '@/components/ui/Button';

function formatPrice(price: number, currency: string) {
  const symbol = currency === 'USD' ? 'US$' : 'S/';
  return `${symbol} ${price.toLocaleString('es-PE')}`;
}

export function AgentPropertiesPage() {
  const { profile } = useAuth();
  const { properties, loading } = useAgentLinkedProperties(profile?.id);

  if (loading) return <LoadingState label="Cargando inmuebles…" />;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex justify-end">
        <Link to="/publicar-inmueble">
          <Button variant="primary" icon={<PlusCircle size={16} />}>
            Publicar inmueble
          </Button>
        </Link>
      </div>

      {properties.length === 0 ? (
        <EmptyState
          icon={<Building2 size={28} />}
          title="Aún no tienes inmuebles"
          description="Cuando un propietario acepte una de tus propuestas, o publiques uno propio, aparecerá aquí."
        />
      ) : (
        properties.map((p) => (
          <Link
            key={p.id}
            to={`/inmuebles/${p.id}`}
            className="flex gap-4 rounded-card border border-border bg-white p-4 shadow-card transition hover:shadow-soft"
          >
            <div className="h-20 w-28 shrink-0 overflow-hidden rounded-input bg-surface-muted">
              {p.coverImageUrl ? (
                <img src={p.coverImageUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center text-xs text-ink-light">Sin fotos</div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="truncate font-semibold text-ink">{p.title}</h3>
                <StatusBadge status={p.status} />
                <span
                  className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                    p.source === 'linked' ? 'bg-ink text-white' : 'bg-brand-soft text-brand'
                  }`}
                >
                  {p.source === 'linked' ? 'Vinculado' : 'Publicación propia'}
                </span>
              </div>
              <p className="text-sm text-ink-light">
                {p.operation === 'sale' ? 'Venta' : 'Alquiler'} · {p.district} · {formatPrice(p.price, p.currency)}
              </p>
              <p className="mt-1 text-xs text-ink-light">
                {p.source === 'linked' ? 'Vinculado desde el' : 'Publicado el'}{' '}
                {new Date(p.assignedAt).toLocaleDateString('es-PE')}
              </p>
            </div>
          </Link>
        ))
      )}
    </div>
  );
}
