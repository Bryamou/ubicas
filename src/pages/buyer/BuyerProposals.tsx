import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Handshake, ShieldCheck, User, Send } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useBuyerRequirementProposals } from '@/hooks/useBuyerData';
import { getOrCreateConversation } from '@/hooks/useConversations';
import { LoadingState } from '@/components/ui/LoadingState';
import { EmptyState } from '@/components/ui/EmptyState';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';

export function BuyerProposalsPage() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const { proposals, loading, respond } = useBuyerRequirementProposals(profile?.id);
  const [confirming, setConfirming] = useState<{ id: string; action: 'accepted' | 'rejected' } | null>(null);
  const [saving, setSaving] = useState(false);
  const [opening, setOpening] = useState<string | null>(null);

  const messageAgent = async (agentId: string) => {
    if (!profile) return;
    setOpening(agentId);
    const { id } = await getOrCreateConversation(profile.id, agentId, null);
    setOpening(null);
    if (id) navigate(`/mensajes?conversation=${id}`);
  };

  if (loading) return <LoadingState label="Cargando propuestas…" />;

  if (proposals.length === 0) {
    return (
      <EmptyState
        icon={<Handshake size={28} />}
        title="Sin propuestas por ahora"
        description="Cuando un agente se ofrezca a ayudarte con tu búsqueda, la propuesta aparecerá aquí."
      />
    );
  }

  const handleConfirm = async () => {
    if (!confirming) return;
    setSaving(true);
    await respond(confirming.id, confirming.action);
    setSaving(false);
    setConfirming(null);
  };

  return (
    <div className="flex flex-col gap-4">
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
                <p className="text-xs text-ink-light">Sobre tu requerimiento: {p.requirementSummary}</p>
              </div>
            </div>
            <StatusBadge status={p.status} />
          </div>

          <p className="mt-3 text-sm text-ink">{p.pitch}</p>

          {p.status === 'pending' && (
            <div className="mt-4 flex gap-2">
              <Button variant="primary" size="sm" onClick={() => setConfirming({ id: p.id, action: 'accepted' })}>
                Aceptar
              </Button>
              <Button variant="danger" size="sm" onClick={() => setConfirming({ id: p.id, action: 'rejected' })}>
                Rechazar
              </Button>
            </div>
          )}
          {p.status === 'accepted' && (
            <div className="mt-4">
              <Button
                variant="secondary"
                size="sm"
                icon={<Send size={14} />}
                loading={opening === p.agent_id}
                onClick={() => messageAgent(p.agent_id)}
              >
                Escribirle al agente
              </Button>
            </div>
          )}
        </div>
      ))}

      <ConfirmDialog
        open={!!confirming}
        title={confirming?.action === 'accepted' ? 'Aceptar propuesta' : 'Rechazar propuesta'}
        description={
          confirming?.action === 'accepted'
            ? 'El agente se pondrá en contacto contigo y podrá enviarte opciones relacionadas con tu requerimiento.'
            : 'Se notificará al agente que su propuesta fue rechazada.'
        }
        confirmLabel={confirming?.action === 'accepted' ? 'Aceptar' : 'Rechazar'}
        danger={confirming?.action === 'rejected'}
        loading={saving}
        onConfirm={handleConfirm}
        onCancel={() => setConfirming(null)}
      />
    </div>
  );
}
