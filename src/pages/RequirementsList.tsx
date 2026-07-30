import { useEffect, useState } from 'react';
import { ClipboardList } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Navbar } from '@/components/Navbar';
import { LoadingState } from '@/components/ui/LoadingState';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Textarea } from '@/components/ui/Textarea';
import { Alert } from '@/components/ui/Alert';
import type { Requirement } from '@/types/database';

const typeLabels: Record<string, string> = {
  apartment: 'Departamento',
  house: 'Casa',
  office: 'Oficina',
  land: 'Terreno',
  commercial: 'Local comercial',
  other: 'Otro',
};

export function RequirementsListPage() {
  const { profile } = useAuth();
  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [loading, setLoading] = useState(true);
  const [proposalTarget, setProposalTarget] = useState<Requirement | null>(null);
  const [pitch, setPitch] = useState('');
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [sentTo, setSentTo] = useState<Set<string>>(new Set());

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from('requirements')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false });
      setRequirements((data as Requirement[]) ?? []);
      setLoading(false);
    })();
  }, []);

  const submitProposal = async () => {
    if (!proposalTarget || !profile || !pitch.trim()) return;
    setSaving(true);
    const { error } = await supabase.from('requirement_agent_proposals').insert({
      requirement_id: proposalTarget.id,
      agent_id: profile.id,
      buyer_id: proposalTarget.buyer_id,
      pitch: pitch.trim(),
    });
    setSaving(false);

    if (error) {
      setFeedback({
        type: 'error',
        message: error.message.includes('duplicate')
          ? 'Ya enviaste una propuesta para este requerimiento.'
          : error.message,
      });
      return;
    }

    setSentTo((prev) => new Set(prev).add(proposalTarget.id));
    setFeedback({ type: 'success', message: 'Tu propuesta fue enviada.' });
    setProposalTarget(null);
    setPitch('');
  };

  return (
    <div className="min-h-screen bg-surface-muted">
      <Navbar />
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-extrabold text-ink">Requerimientos activos</h1>
        <p className="mt-1 text-sm text-ink-light">
          Personas buscando un inmueble para comprar o alquilar. {profile?.role === 'agent' && 'Puedes proponerles tus servicios.'}
        </p>

        {feedback && (
          <div className="mt-4">
            <Alert type={feedback.type}>{feedback.message}</Alert>
          </div>
        )}

        <div className="mt-6">
          {loading ? (
            <LoadingState label="Cargando requerimientos…" />
          ) : requirements.length === 0 ? (
            <EmptyState icon={<ClipboardList size={28} />} title="No hay requerimientos activos por ahora" />
          ) : (
            <div className="flex flex-col gap-3">
              {requirements.map((r) => (
                <div key={r.id} className="rounded-card border border-border bg-white p-5 shadow-card">
                  <h3 className="font-semibold text-ink">
                    {r.operation === 'sale' ? 'Compra' : 'Alquiler'} · {typeLabels[r.property_type] ?? r.property_type} en {r.district}
                  </h3>
                  <p className="mt-1 text-sm text-ink-light">
                    Presupuesto máximo: S/ {r.max_budget.toLocaleString('es-PE')}
                    {r.bedrooms != null && ` · ${r.bedrooms} dorm.`}
                    {r.bathrooms != null && ` · ${r.bathrooms} baños`}
                    {r.parking && ' · con cochera'}
                    {r.pets && ' · acepta mascotas'}
                  </p>
                  {r.extra_notes && <p className="mt-2 text-sm text-ink">{r.extra_notes}</p>}
                  <p className="mt-2 text-xs text-ink-light">
                    Publicado el {new Date(r.created_at).toLocaleDateString('es-PE')}
                  </p>

                  {profile?.role === 'agent' && (
                    <div className="mt-3">
                      {sentTo.has(r.id) ? (
                        <span className="text-xs font-semibold text-success">Propuesta enviada</span>
                      ) : (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => {
                            setProposalTarget(r);
                            setFeedback(null);
                          }}
                        >
                          Enviar propuesta de servicio
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <Modal
        open={!!proposalTarget}
        onClose={() => setProposalTarget(null)}
        title="Enviar propuesta de servicio"
        footer={
          <Button variant="primary" onClick={submitProposal} loading={saving} disabled={!pitch.trim()}>
            Enviar propuesta
          </Button>
        }
      >
        <Textarea
          label="Presentación comercial"
          placeholder="Hola, puedo ayudarte con tu búsqueda. Me comprometo a enviarte opciones relevantes cada 3 días…"
          value={pitch}
          onChange={(e) => setPitch(e.target.value)}
          hint="Incluye tu compromiso de enviar opciones relevantes cada 3 días."
        />
      </Modal>
    </div>
  );
}
