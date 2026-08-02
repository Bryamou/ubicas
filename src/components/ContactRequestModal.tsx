import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Phone, Mail, User, MessageCircle, Percent } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { getOrCreateConversation } from '@/hooks/useConversations';
import { getGuestContactInfo, saveGuestContactInfo, markPropertyContacted } from '@/lib/guestContact';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import type { Property } from '@/types/database';

interface ContactRequestModalProps {
  open: boolean;
  onClose: () => void;
  property: Property;
  /** Si ya se contactó antes (cuenta o mismo dispositivo), abre directo en
   * la vista de "ya contactado" en vez del formulario. */
  alreadyContacted?: boolean;
  onContacted: () => void;
}

interface ContactTarget {
  name: string;
  phone: string | null;
  email: string | null;
  agentId: string | null;
}

async function fetchContactTarget(property: Property): Promise<ContactTarget> {
  const { data: assignment } = await supabase
    .from('property_agent_assignments')
    .select('agent_id, agent:profiles!property_agent_assignments_agent_id_fkey(full_name, phone)')
    .eq('property_id', property.id)
    .maybeSingle();

  if (assignment?.agent) {
    return {
      name: (assignment.agent as any).full_name,
      phone: (assignment.agent as any).phone,
      email: null,
      agentId: assignment.agent_id,
    };
  }
  return {
    name: property.contact_name ?? 'Contacto de la publicación',
    phone: property.contact_phone,
    email: property.contact_email,
    agentId: null,
  };
}

export function ContactRequestModal({ open, onClose, property, alreadyContacted, onContacted }: ContactRequestModalProps) {
  const { user, profile } = useAuth();
  const isAgentOffering = profile?.role === 'agent' && property.owner_id !== user?.id;

  const [view, setView] = useState<'form' | 'revealed'>('form');
  const [target, setTarget] = useState<ContactTarget | null>(null);

  // Formulario nombre/correo/teléfono (invitado, propietario, comprador)
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  // Formulario del agente
  const [pitch, setPitch] = useState('');
  const [commissionValue, setCommissionValue] = useState('');

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [messaging, setMessaging] = useState(false);

  useEffect(() => {
    if (!open) return;
    setError(null);
    setErrors({});
    setPitch('');
    setCommissionValue('');

    if (alreadyContacted) {
      fetchContactTarget(property).then((t) => {
        setTarget(t);
        setView('revealed');
      });
      return;
    }

    setView('form');
    if (user) {
      setName(profile?.full_name ?? '');
      setEmail(user.email ?? '');
      setPhone(profile?.phone ?? '');
    } else {
      const guest = getGuestContactInfo();
      setName(guest?.name ?? '');
      setEmail(guest?.email ?? '');
      setPhone(guest?.phone ?? '');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, alreadyContacted]);

  const reveal = async () => {
    const t = await fetchContactTarget(property);
    setTarget(t);
    setView('revealed');
    onContacted();
  };

  const handleSubmitContact = async () => {
    const newErrors: Record<string, string> = {};
    if (!name.trim()) newErrors.name = 'Ingresa tu nombre.';
    if (!email.trim()) newErrors.email = 'Ingresa tu correo.';
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    setSaving(true);
    setError(null);

    const { error: insertError } = await supabase.from('contact_requests').insert({
      property_id: property.id,
      requester_id: user?.id ?? null,
      guest_name: name.trim(),
      guest_email: email.trim(),
      guest_phone: phone.trim() || null,
    });

    setSaving(false);

    if (insertError) {
      setError(insertError.message);
      return;
    }

    if (!user) {
      saveGuestContactInfo({ name: name.trim(), email: email.trim(), phone: phone.trim() });
      markPropertyContacted(property.id);
    }
    await reveal();
  };

  const handleSubmitAgentProposal = async () => {
    if (!user || !commissionValue || Number(commissionValue) <= 0) {
      setError('Ingresa una comisión válida.');
      return;
    }
    setSaving(true);
    setError(null);

    const { error: insertError } = await supabase.from('agent_proposals').insert({
      property_id: property.id,
      agent_id: user.id,
      owner_id: property.owner_id,
      pitch: pitch.trim() || 'Hola, me gustaría representar tu inmueble.',
      commission_percent: property.operation === 'sale' ? Number(commissionValue) : null,
      commission_amount: property.operation === 'rent' ? Number(commissionValue) : null,
      status: 'pending',
    });

    setSaving(false);

    if (insertError) {
      setError(
        insertError.message.includes('duplicate') || insertError.message.includes('unique')
          ? 'Ya tienes una propuesta pendiente para este inmueble.'
          : insertError.message
      );
      return;
    }
    await reveal();
  };

  const sendMessage = async () => {
    if (!user || !target?.agentId) return;
    setMessaging(true);
    const { id } = await getOrCreateConversation(user.id, target.agentId, property.id);
    setMessaging(false);
    if (id) window.location.assign(`/mensajes?conversation=${id}`);
  };

  const commissionAmountEquivalent =
    property.operation === 'sale' && commissionValue
      ? (Number(commissionValue) / 100) * property.price
      : null;
  const commissionPercentEquivalent =
    property.operation === 'rent' && commissionValue && property.price > 0
      ? (Number(commissionValue) / property.price) * 100
      : null;

  return (
    <Modal open={open} onClose={onClose} title={view === 'revealed' ? 'Datos de contacto' : 'Contactar'}>
      {view === 'revealed' && target ? (
        <div className="flex flex-col gap-4">
          <Alert type="success">
            {isAgentOffering ? 'Tu propuesta fue enviada.' : 'Tu solicitud fue enviada.'} Aquí tienes los datos de contacto.
          </Alert>
          <div className="flex items-center gap-3 rounded-card border border-border p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-soft text-brand">
              <User size={18} />
            </div>
            <div>
              <p className="font-semibold text-ink">{target.name}</p>
              {target.phone && (
                <p className="flex items-center gap-1.5 text-sm text-ink-light">
                  <Phone size={13} /> {target.phone}
                </p>
              )}
              {target.email && (
                <p className="flex items-center gap-1.5 text-sm text-ink-light">
                  <Mail size={13} /> {target.email}
                </p>
              )}
            </div>
          </div>
          {user && target.agentId && target.agentId !== user.id && (
            <Button variant="secondary" icon={<MessageCircle size={16} />} loading={messaging} onClick={sendMessage}>
              Enviarle un mensaje
            </Button>
          )}
          <Button variant="primary" onClick={onClose}>
            Cerrar
          </Button>
        </div>
      ) : isAgentOffering ? (
        <div className="flex flex-col gap-4">
          {error && <Alert type="error">{error}</Alert>}
          <p className="text-sm text-ink-light">
            Envía tu propuesta para representar este inmueble. Se enviará a la bandeja del propietario con tus
            datos de contacto.
          </p>
          <Textarea
            label="Presentación (opcional)"
            placeholder="Hola, me gustaría representar tu inmueble. Tengo cartera de clientes activos en esta zona."
            value={pitch}
            onChange={(e) => setPitch(e.target.value)}
          />
          <Input
            label={property.operation === 'sale' ? 'Comisión (%)' : 'Comisión (monto en S/)'}
            type="number"
            value={commissionValue}
            onChange={(e) => setCommissionValue(e.target.value)}
            hint={
              commissionAmountEquivalent != null
                ? `Equivale a S/ ${commissionAmountEquivalent.toLocaleString('es-PE', { maximumFractionDigits: 0 })}`
                : commissionPercentEquivalent != null
                  ? `Equivale a ${commissionPercentEquivalent.toFixed(1)}% del precio`
                  : undefined
            }
          />
          <Button variant="primary" icon={<Percent size={16} />} onClick={handleSubmitAgentProposal} loading={saving}>
            Enviar propuesta
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {error && <Alert type="error">{error}</Alert>}
          <Input label="Nombre" value={name} onChange={(e) => setName(e.target.value)} error={errors.name} />
          <Input label="Correo" type="email" value={email} onChange={(e) => setEmail(e.target.value)} error={errors.email} />
          <Input label="Teléfono (opcional)" value={phone} onChange={(e) => setPhone(e.target.value)} />
          {!user && (
            <p className="text-xs text-ink-light">
              ¿Ya tienes cuenta?{' '}
              <Link to="/login" className="font-semibold text-brand hover:underline">
                Inicia sesión
              </Link>{' '}
              para no tener que llenar esto cada vez.
            </p>
          )}
          <Button variant="primary" onClick={handleSubmitContact} loading={saving}>
            Enviar
          </Button>
        </div>
      )}
    </Modal>
  );
}
