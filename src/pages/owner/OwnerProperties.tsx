import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Eye, Pencil, ExternalLink, MessageSquare } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useOwnerProperties, type OwnerPropertyRow } from '@/hooks/useOwnerProperties';
import { LoadingState } from '@/components/ui/LoadingState';
import { EmptyState } from '@/components/ui/EmptyState';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Select } from '@/components/ui/Select';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import type { PropertyStatus } from '@/types/database';

const statusOptions = [
  { value: 'all', label: 'Todos los estados' },
  { value: 'draft', label: 'Borrador' },
  { value: 'published', label: 'Publicado' },
  { value: 'paused', label: 'Pausado' },
  { value: 'sold', label: 'Vendido' },
  { value: 'rented', label: 'Alquilado' },
  { value: 'closed', label: 'Cerrado' },
];

function formatPrice(p: OwnerPropertyRow) {
  const symbol = p.currency === 'USD' ? 'US$' : 'S/';
  return `${symbol} ${p.price.toLocaleString('es-PE')}`;
}

// Transiciones válidas de estado disponibles como botones rápidos por fila.
// "Marcar vendido" solo aplica a venta; "Marcar alquilado" solo a alquiler.
function availableActions(
  status: PropertyStatus,
  operation: 'sale' | 'rent'
): { label: string; next: PropertyStatus }[] {
  switch (status) {
    case 'draft':
      return [{ label: 'Publicar', next: 'published' }];
    case 'published':
      return [
        { label: 'Pausar', next: 'paused' },
        operation === 'sale'
          ? { label: 'Marcar vendido', next: 'sold' as PropertyStatus }
          : { label: 'Marcar alquilado', next: 'rented' as PropertyStatus },
        { label: 'Cerrar', next: 'closed' },
      ];
    case 'paused':
      return [
        { label: 'Reactivar', next: 'published' },
        { label: 'Cerrar', next: 'closed' },
      ];
    default:
      return [];
  }
}

export function OwnerPropertiesPage() {
  const { profile } = useAuth();
  const { properties, loading, updateStatus } = useOwnerProperties(profile?.id);
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [pendingChange, setPendingChange] = useState<{ id: string; next: PropertyStatus; label: string } | null>(
    null
  );
  const [saving, setSaving] = useState(false);

  const filtered = useMemo(() => {
    return properties.filter((p) => {
      const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
      const q = search.trim().toLowerCase();
      const matchesSearch =
        !q || p.title.toLowerCase().includes(q) || p.district.toLowerCase().includes(q);
      return matchesStatus && matchesSearch;
    });
  }, [properties, statusFilter, search]);

  const confirmChange = async () => {
    if (!pendingChange) return;
    setSaving(true);
    await updateStatus(pendingChange.id, pendingChange.next);
    setSaving(false);
    setPendingChange(null);
  };

  if (loading) return <LoadingState label="Cargando tus inmuebles…" />;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="flex-1">
          <Input
            placeholder="Buscar por título o distrito"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="sm:w-56">
          <Select
            options={statusOptions}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<Search size={28} />}
          title="No encontramos inmuebles"
          description="Prueba con otro estado o término de búsqueda, o publica tu primer inmueble."
          action={
            <Link to="/publicar-inmueble">
              <Button variant="primary">Publicar inmueble gratis</Button>
            </Link>
          }
        />
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((p) => (
            <div key={p.id} className="rounded-card border border-border bg-white p-4 shadow-card">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <div className="h-24 w-full shrink-0 overflow-hidden rounded-input bg-surface-muted sm:w-32">
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
                    {p.operation === 'sale' ? 'Venta' : 'Alquiler'} · {p.district} · {formatPrice(p)}
                  </p>
                  <p className="mt-1 text-xs text-ink-light">
                    {p.published_at
                      ? `Publicado el ${new Date(p.published_at).toLocaleDateString('es-PE')}`
                      : 'Aún no publicado'}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-3 text-xs text-ink-light">
                    <span>{p.viewsCount} vistas</span>
                    <span>{p.contactsCount} contactos</span>
                    {p.pendingProposalsCount > 0 && (
                      <span className="font-semibold text-brand">
                        {p.pendingProposalsCount} propuestas pendientes
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Fila compacta de acciones: mismo tamaño y forma para todas, envuelven en vez de apilarse */}
              <div className="mt-4 flex flex-wrap gap-2 border-t border-border pt-3">
                <Link to={`/publicar-inmueble?edit=${p.id}`}>
                  <Button variant="neutral" size="sm" icon={<Pencil size={14} />}>
                    Editar
                  </Button>
                </Link>
                {p.status === 'published' && (
                  <Link to={`/inmuebles/${p.id}`} target="_blank">
                    <Button variant="neutral" size="sm" icon={<ExternalLink size={14} />}>
                      Ver publicación
                    </Button>
                  </Link>
                )}
                <Link to={`/panel/propietario/contactos?property=${p.id}`}>
                  <Button variant="neutral" size="sm" icon={<MessageSquare size={14} />}>
                    Contactos
                  </Button>
                </Link>
                {availableActions(p.status, p.operation).map((action) => (
                  <Button
                    key={action.next}
                    variant={action.next === 'closed' ? 'danger' : 'secondary'}
                    size="sm"
                    onClick={() => setPendingChange({ id: p.id, next: action.next, label: action.label })}
                  >
                    {action.label}
                  </Button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={!!pendingChange}
        title={pendingChange ? pendingChange.label : ''}
        description={`¿Confirmas que quieres "${pendingChange?.label.toLowerCase()}" esta publicación? Este cambio es visible de inmediato.`}
        confirmLabel={pendingChange?.label}
        danger={pendingChange?.next === 'closed'}
        loading={saving}
        onConfirm={confirmChange}
        onCancel={() => setPendingChange(null)}
      />
    </div>
  );
}
