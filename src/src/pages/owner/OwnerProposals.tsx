import { useState } from 'react';
import { ShieldCheck, User } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useOwnerProposals } from '@/hooks/useOwnerProperties';
import { LoadingState } from '@/components/ui/LoadingState';
import { EmptyState } from '@/components/ui/EmptyState';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Alert } from '@/components/ui/Alert';
import { Handshake } from 'lucide-react';

export function OwnerProposalsPage() {
  const { profile } = useAuth();
  const { proposals, loading, accept, reject } = useOwnerProposals(profile?.id);
  const [confirming, setConfirming] = useState<{ id: string; action: 'accept' | 'reject' } | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (loading) return <LoadingState label="Cargando propuestas…" />;

  const handleConfirm = async () => {
    if (!confirming) return;
    setSaving(true);
    setError(null);
    const { error: actionError } =
      confirming.action === 'accept' ? await accept(confirming.id) : await reject(confirming.id);
    setSaving(false);
    setConfirming(null);
    if (actionError) setError(actionError);
  };

  if (proposals.length === 0) {
    return (
      <EmptyState
        icon={<Handshake size={28} />}
        title="Sin propuestas por ahora"
        description="Cuando un agente inmobiliario proponga representar uno de tus inmuebles, la propuesta aparecerá aquí."
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {error && <Alert type="error">{error}</Alert>}

      {proposals.map((p) => (
        <div key={p.id} className="rounded-card border border-border bg-white p-5 shadow-card">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-soft text-brand">
                {p.agentVerified ? <ShieldCheck size={20} /> : <User size={20} />}
              </div>
              <div>
                <p className="font-semibold text-ink">{p.agentName}</p>
                {p.agentAgency && <p className="text-xs text-ink-light">{p.agentAgency}</p>}
                <p className="text-xs text-ink-light">Inmueble: {p.propertyTitle}</p>
              </div>
            </div>
            <StatusBadge status={p.status} />
          </div>

          <p className="mt-3 text-sm text-ink">{p.pitch}</p>

          <p className="mt-2 text-sm font-semibold text-ink">
            Comisión:{' '}
            {p.commission_percent != null
              ? `${p.commission_percent}% (venta)`
              : `S/ ${p.commission_amount?.toLocaleString('es-PE')} (alquiler)`}
          </p>

          {p.status === 'pending' && (
            <div className="mt-4 flex gap-2">
              <Button variant="primary" size="sm" onClick={() => setConfirming({ id: p.id, action: 'accept' })}>
                Aceptar propuesta
              </Button>
              <Button variant="danger" size="sm" onClick={() => setConfirming({ id: p.id, action: 'reject' })}>
                Rechazar
              </Button>
            </div>
          )}
        </div>
      ))}

      <ConfirmDialog
        open={!!confirming}
        title={confirming?.action === 'accept' ? 'Aceptar propuesta' : 'Rechazar propuesta'}
        description={
          confirming?.action === 'accept'
            ? 'El agente quedará vinculado a tu inmueble y se mostrará como primer contacto. Tú sigues siendo el dueño y mantienes acceso a las métricas.'
            : 'Se notificará al agente que su propuesta fue rechazada.'
        }
        confirmLabel={confirming?.action === 'accept' ? 'Aceptar' : 'Rechazar'}
        danger={confirming?.action === 'reject'}
        loading={saving}
        onConfirm={handleConfirm}
        onCancel={() => setConfirming(null)}
      />
    </div>
  );
}
