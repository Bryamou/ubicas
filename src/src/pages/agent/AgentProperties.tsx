import { Link } from 'react-router-dom';
import { Building2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useAgentLinkedProperties } from '@/hooks/useAgentData';
import { LoadingState } from '@/components/ui/LoadingState';
import { EmptyState } from '@/components/ui/EmptyState';
import { StatusBadge } from '@/components/ui/StatusBadge';

function formatPrice(price: number, currency: string) {
  const symbol = currency === 'USD' ? 'US$' : 'S/';
  return `${symbol} ${price.toLocaleString('es-PE')}`;
}

export function AgentPropertiesPage() {
  const { profile } = useAuth();
  const { properties, loading } = useAgentLinkedProperties(profile?.id);

  if (loading) return <LoadingState label="Cargando inmuebles vinculados…" />;

  if (properties.length === 0) {
    return (
      <EmptyState
        icon={<Building2 size={28} />}
        title="Aún no tienes inmuebles vinculados"
        description="Cuando un propietario acepte una de tus propuestas, el inmueble aparecerá aquí y se te mostrará como primer contacto."
      />
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {properties.map((p) => (
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
            </div>
            <p className="text-sm text-ink-light">
              {p.operation === 'sale' ? 'Venta' : 'Alquiler'} · {p.district} · {formatPrice(p.price, p.currency)}
            </p>
            <p className="mt-1 text-xs text-ink-light">
              Vinculado desde el {new Date(p.assignedAt).toLocaleDateString('es-PE')}
            </p>
          </div>
        </Link>
      ))}
    </div>
  );
}
