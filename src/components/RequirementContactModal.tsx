import { useEffect, useState } from 'react';
import { Phone, XCircle, Clock, Home } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import type { Property, ProposalStatus } from '@/types/database';

interface RequirementContactModalProps {
  open: boolean;
  onClose: () => void;
  requirementId: string;
  /** Si ya se contactó/propuso antes, abre directo en la vista de estado. */
  alreadyContacted?: boolean;
  existingProposalStatus?: ProposalStatus | null;
  onContacted: () => void;
}

const pitchPlaceholderByRole: Record<string, string> = {
  owner: 'Hola, tengo un inmueble que podría interesarte. Cuéntame más sobre lo que buscas y te comparto los detalles.',
  agent: 'Hola, puedo ayudarte con tu búsqueda. Te comparto algunas opciones de mi cartera que podrían interesarte.',
  buyer: 'Hola, vi tu búsqueda y quería contactarte.',
};

/**
 * Contacto sobre un requerimiento. Para propietarios/compradores: gancho
 * comercial + datos de contacto (tabla requirement_contacts), sin abrir
 * conversación. Para agentes: además pueden elegir inmuebles de su
 * cartera para mostrarle al cliente (tabla requirement_agent_proposals,
 * la misma que alimenta "Clientes vinculados" cuando el cliente acepta).
 */
export function RequirementContactModal({
  open,
  onClose,
  requirementId,
  alreadyContacted,
  existingProposalStatus,
  onContacted,
}: RequirementContactModalProps) {
  const { user, profile } = useAuth();
  const isAgent = profile?.role === 'agent';

  const [sent, setSent] = useState(false);
  const [pitch, setPitch] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [myProperties, setMyProperties] = useState<Property[]>([]);
  const [selectedPropertyIds, setSelectedPropertyIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [buyerContact, setBuyerContact] = useState<{ name: string; phone: string | null } | null>(null);

  const fetchBuyerContact = async () => {
    const { data: req } = await supabase.from('requirements').select('buyer_id').eq('id', requirementId).single();
    if (!req?.buyer_id) return;
    const { data: buyer } = await supabase.from('profiles').select('full_name, phone').eq('id', req.buyer_id).single();
    if (buyer) setBuyerContact({ name: buyer.full_name, phone: buyer.phone });
  };

  useEffect(() => {
    if (!open) return;
    setError(null);
    setSent(!!alreadyContacted);
    setPitch('');
    setSelectedPropertyIds([]);
    setName(profile?.full_name ?? '');
    setEmail(user?.email ?? '');
    setPhone(profile?.phone ?? '');

    if (alreadyContacted) fetchBuyerContact();

    if (isAgent && user) {
      (async () => {
        const [{ data: owned }, { data: assigned }] = await Promise.all([
          supabase.from('properties').select('*').eq('owner_id', user.id).eq('status', 'published'),
          supabase
            .from('property_agent_assignments')
            .select('property:properties!property_agent_assignments_property_id_fkey(*)')
            .eq('agent_id', user.id),
        ]);
        const assignedProps = (assigned ?? []).map((a: any) => a.property).filter((p: any) => p?.status === 'published');
        const merged = new Map<string, Property>();
        [...(owned ?? []), ...assignedProps].forEach((p: any) => merged.set(p.id, p));
        setMyProperties([...merged.values()]);
      })();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, alreadyContacted]);

  const toggleProperty = (id: string) => {
    setSelectedPropertyIds((prev) => (prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]));
  };

  const handleSubmit = async () => {
    if (!user || !profile) return;
    if (!pitch.trim()) {
      setError('Escribe un mensaje de presentación.');
      return;
    }
    setSaving(true);
    setError(null);

    if (isAgent) {
      const { error: insertError } = await supabase.from('requirement_agent_proposals').insert({
        requirement_id: requirementId,
        agent_id: user.id,
        buyer_id: (await supabase.from('requirements').select('buyer_id').eq('id', requirementId).single()).data?.buyer_id,
        pitch: pitch.trim(),
        shown_property_ids: selectedPropertyIds.length > 0 ? selectedPropertyIds : null,
      });
      setSaving(false);
      if (insertError) {
        setError(
          insertError.message.includes('duplicate') || insertError.message.includes('unique')
            ? 'Ya tienes una propuesta pendiente para este cliente.'
            : insertError.message
        );
        return;
      }
    } else {
      const { error: insertError } = await supabase.from('requirement_contacts').insert({
        requirement_id: requirementId,
        contacter_id: user.id,
        contacter_role: profile.role,
        pitch: pitch.trim(),
        contact_name: name.trim() || profile.full_name,
        contact_phone: phone.trim() || null,
        contact_email: email.trim() || null,
      });
      setSaving(false);
      if (insertError) {
        setError(
          insertError.message.includes('duplicate') || insertError.message.includes('unique')
            ? 'Ya contactaste antes a este cliente por este requerimiento.'
            : insertError.message
        );
        return;
      }
    }

    await fetchBuyerContact();
    setSent(true);
    onContacted();
  };

  const statusMessage =
    existingProposalStatus === 'rejected'
      ? 'El cliente rechazó tu propuesta.'
      : existingProposalStatus === 'pending'
        ? 'Tu propuesta ya fue enviada. Puedes revisar el estado en "Propuestas a compradores".'
        : null;

  return (
    <Modal open={open} onClose={onClose} title="Contactar">
      {sent ? (
        <div className="flex flex-col items-center gap-3 py-2 text-center">
          {existingProposalStatus === 'rejected' ? (
            <Alert type="error">
              <span className="flex items-center gap-1.5">
                <XCircle size={14} /> {statusMessage}
              </span>
            </Alert>
          ) : statusMessage ? (
            <Alert type="warning">
              <span className="flex items-center gap-1.5">
                <Clock size={14} /> {statusMessage}
              </span>
            </Alert>
          ) : (
            <Alert type="success">
              Tu mensaje fue enviado. El cliente lo verá en su bandeja junto con tus datos de contacto.
            </Alert>
          )}
          {buyerContact && (
            <div className="w-full rounded-card border border-border p-3 text-left text-sm text-ink-light">
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-ink-light">Datos del cliente</p>
              <p className="font-medium text-ink">{buyerContact.name}</p>
              {buyerContact.phone && (
                <p className="flex items-center gap-1.5">
                  <Phone size={13} /> {buyerContact.phone}
                </p>
              )}
            </div>
          )}
          <Button variant="primary" fullWidth onClick={onClose}>
            Cerrar
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {error && <Alert type="error">{error}</Alert>}
          <Textarea
            label="Mensaje de presentación (gancho comercial)"
            placeholder={pitchPlaceholderByRole[profile?.role ?? 'buyer']}
            value={pitch}
            onChange={(e) => setPitch(e.target.value)}
          />

          {isAgent ? (
            <div>
              <p className="mb-1.5 text-sm font-semibold text-ink">
                Inmuebles a mostrarle (opcional)
              </p>
              {myProperties.length === 0 ? (
                <p className="text-xs text-ink-light">No tienes inmuebles publicados aún.</p>
              ) : (
                <div className="flex max-h-40 flex-col gap-1.5 overflow-y-auto rounded-input border border-border p-2">
                  {myProperties.map((p) => (
                    <label key={p.id} className="flex items-center gap-2 rounded-input px-1.5 py-1 text-sm text-ink hover:bg-surface-muted">
                      <input
                        type="checkbox"
                        checked={selectedPropertyIds.includes(p.id)}
                        onChange={() => toggleProperty(p.id)}
                        className="h-4 w-4 rounded border-border text-brand focus:ring-brand"
                      />
                      <Home size={13} className="shrink-0 text-ink-light" />
                      <span className="truncate">{p.title}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <>
              <Input label="Nombre de contacto" value={name} onChange={(e) => setName(e.target.value)} />
              <div className="grid grid-cols-2 gap-3">
                <Input label="Teléfono" value={phone} onChange={(e) => setPhone(e.target.value)} />
                <Input label="Correo" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
            </>
          )}

          <Button variant="primary" onClick={handleSubmit} loading={saving}>
            Enviar
          </Button>
        </div>
      )}
    </Modal>
  );
}
