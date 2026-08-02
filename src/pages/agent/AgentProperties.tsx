import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Building2, PlusCircle, Pencil, ExternalLink, MessageSquare } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useAgentLinkedProperties } from '@/hooks/useAgentData';
import { supabase } from '@/lib/supabase';
import { LoadingState } from '@/components/ui/LoadingState';
import { EmptyState } from '@/components/ui/EmptyState';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import type { PropertyStatus, OperationType } from '@/types/database';

function formatPrice(price: number, currency: string) {
  const symbol = currency === 'USD' ? 'US$' : 'S/';
  return `${symbol} ${price.toLocaleString('es-PE')}`;
}

// Igual que en el panel del propietario: "Marcar vendido" solo para venta,
// "Marcar alquilado" solo para alquiler. Solo aplica a publicaciones
// propias del agente (no a inmuebles vinculados de otro propietario).
function availableActions(status: PropertyStatus, operation: OperationType): { label: string; next: PropertyStatus }[] {
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

export function AgentPropertiesPage() {
  const { profile } = useAuth();
  const { properties, loading, refresh } = useAgentLinkedProperties(profile?.id);
  const [pendingChange, setPendingChange] = useState<{ id: string; next: PropertyStatus; label: string } | null>(null);
  const [saving, setSaving] = useState(false);

  const confirmChange = async () => {
    if (!pendingChange) return;
    setSaving(true);
    await supabase.from('properties').update({ status: pendingChange.next }).eq('id', pendingChange.id);
    await refresh();
    setSaving(false);
    setPendingChange(null);
  };

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
            </div>

            <div className="mt-4 flex flex-wrap gap-2 border-t border-border pt-3">
              {p.source === 'own' && (
                <Link to={`/publicar-inmueble?edit=${p.id}`}>
                  <Button variant="neutral" size="sm" icon={<Pencil size={14} />}>
                    Editar
                  </Button>
                </Link>
              )}
              {p.status === 'published' && (
                <Link to={`/inmuebles/${p.id}`} target="_blank">
                  <Button variant="neutral" size="sm" icon={<ExternalLink size={14} />}>
                    Ver publicación
                  </Button>
                </Link>
              )}
              <Link to={`/panel/agente/contactos?property=${p.id}`}>
                <Button variant="neutral" size="sm" icon={<MessageSquare size={14} />}>
                  Contactos
                </Button>
              </Link>
              {p.source === 'own' &&
                availableActions(p.status, p.operation).map((action) => (
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
        ))
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
