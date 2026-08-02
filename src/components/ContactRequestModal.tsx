import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Phone, Mail, User, MessageCircle, Percent, XCircle, Clock } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { getOrCreateConversation } from '@/hooks/useConversations';
import { getGuestContactInfo, saveGuestContactInfo, markPropertyContacted } from '@/lib/guestContact';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import type { Property, ProposalStatus } from '@/types/database';

interface ContactRequestModalProps {
  open: boolean;
  onClose: () => void;
  property: Property;
  /** Estado de un contacto/propuesta previo, si existe (calculado por el
   * padre para no repetir la consulta en cada tarjeta). */
  alreadyContacted?: boolean;
  existingProposalStatus?: ProposalStatus | null;
  onContacted: () => void;
}

interface ContactTarget {
  name: string;
  phone: string | null;
  email: string | null;
  agentId: string | null;
}

async function fetchAssignedAgent(propertyId: string) {
  const { data } = await supabase
    .from('property_agent_assignments')
    .select('agent_id, agent:profiles!property_agent_assignments_agent_id_fkey(full_name, phone)')
    .eq('property_id', propertyId)
    .maybeSingle();
  return data;
}

async function fetchContactTarget(property: Property): Promise<ContactTarget> {
  const assignment = await fetchAssignedAgent(property.id);
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

export function ContactRequestModal({
  open,
  onClose,
  property,
  alreadyContacted,
  existingProposalStatus,
  onContacted,
}: ContactRequestModalProps) {
  const { user, profile } = useAuth();
  const isAgent = profile?.role === 'agent' && property.owner_id !== user?.id;

  const [view, setView] = useState<'form' | 'revealed'>('form');
  const [target, setTarget] = useState<ContactTarget | null>(null);
  const [assignedAgentId, setAssignedAgentId] = useState<string | null>(null);
  const [baseCommission, setBaseCommission] = useState<number | null>(null);
  const [checkingAssignment, setCheckingAssignment] = useState(true);

  // Formulario nombre/correo/teléfono (invitado, propietario, comprador)
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  // Formulario del agente: proponerse como representante
  const [pitch, setPitch] = useState('');
  const [commissionValue, setCommissionValue] = useState('');

  // Formulario del agente: compartir comisión con el agente ya asignado
  const [sharePercent, setSharePercent] = useState('50');
  const [shareMessage, setShareMessage] = useState('');

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [messaging, setMessaging] = useState(false);

  useEffect(() => {
    if (!open) return;
    setError(null);
    setPitch('');
    setCommissionValue('');
    setShareMessage('');
    setSharePercent('50');
    setCheckingAssignment(true);

    (async () => {
      const assignment = await fetchAssignedAgent(property.id);
      setAssignedAgentId(assignment?.agent_id ?? null);
      if (assignment?.agent_id && isAgent) {
        // Trae la comisión pactada del agente asignado para calcular el reparto
        const { data: accepted } = await supabase
          .from('agent_proposals')
          .select('commission_percent, commission_amount')
          .eq('property_id', property.id)
          .eq('agent_id', assignment.agent_id)
          .eq('status', 'accepted')
          .maybeSingle();
        if (accepted) {
          const total = accepted.commission_percent
            ? (accepted.commission_percent / 100) * property.price
            : (accepted.commission_amount ?? 0);
          setBaseCommission(total);
        }
      }
      setCheckingAssignment(false);
    })();

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

  const isSharingCommission = isAgent && !!assignedAgentId && assignedAgentId !== user?.id;

  const reveal = async () => {
    const t = await fetchContactTarget(property);
    setTarget(t);
    setView('revealed');
    onContacted();
  };

  const handleSubmitContact = async () => {
    const newErrors: string[] = [];
    if (!name.trim()) newErrors.push('nombre');
    if (!email.trim()) newErrors.push('correo');
    if (newErrors.length > 0) {
      setError('Completa tu ' + newErrors.join(' y '));
      return;
    }

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

  const handleSubmitCommissionShare = async () => {
    if (!user || !assignedAgentId) return;
    const pct = Number(sharePercent);
    if (!pct || pct < 10 || pct > 90) {
      setError('El porcentaje debe estar entre 10% y 90%.');
      return;
    }
    setSaving(true);
    setError(null);

    const { error: insertError } = await supabase.from('commission_share_proposals').insert({
      property_id: property.id,
      requesting_agent_id: user.id,
      assigned_agent_id: assignedAgentId,
      share_percent: pct,
      message: shareMessage.trim() || null,
      status: 'pending',
    });

    setSaving(false);

    if (insertError) {
      setError(
        insertError.message.includes('duplicate') || insertError.message.includes('unique')
          ? 'Ya tienes una propuesta de comisión pendiente para este inmueble.'
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

  const myShare = baseCommission != null ? (Number(sharePercent || 0) / 100) * baseCommission : null;
  const theirShare = baseCommission != null && myShare != null ? baseCommission - myShare : null;

  const statusMessage =
    existingProposalStatus === 'rejected'
      ? 'El propietario o agente rechazó tu propuesta.'
      : existingProposalStatus === 'pending'
        ? 'Tu propuesta ya fue enviada. Puedes revisar el estado en tu bandeja de propuestas.'
        : null;

  return (
    <Modal open={open} onClose={onClose} title={view === 'revealed' ? 'Datos de contacto' : 'Contactar'}>
      {view === 'revealed' && target ? (
        <div className="flex flex-col gap-4">
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
              {isAgent ? 'Tu propuesta fue enviada.' : 'Tu solicitud fue enviada.'} Aquí tienes los datos de contacto.
            </Alert>
          )}
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
      ) : checkingAssignment ? (
        <p className="py-6 text-center text-sm text-ink-light">Cargando…</p>
      ) : isSharingCommission ? (
        <div className="flex flex-col gap-4">
          {error && <Alert type="error">{error}</Alert>}
          <p className="text-sm text-ink-light">
            Este inmueble ya tiene un agente asignado. Puedes proponerle compartir su comisión a cambio de traerle un
            cliente.
          </p>
          <Textarea
            label="Mensaje (opcional)"
            placeholder="Hola, tengo un cliente interesado en este inmueble. ¿Compartimos comisión?"
            value={shareMessage}
            onChange={(e) => setShareMessage(e.target.value)}
          />
          <Input
            label="% de la comisión que pides (10% - 90%)"
            type="number"
            min={10}
            max={90}
            value={sharePercent}
            onChange={(e) => setSharePercent(e.target.value)}
          />
          {baseCommission != null ? (
            <div className="rounded-card border border-border bg-surface-muted p-3 text-sm text-ink-light">
              Comisión total pactada: <strong className="text-ink">S/ {baseCommission.toLocaleString('es-PE')}</strong>
              {myShare != null && theirShare != null && (
                <p className="mt-1">
                  Para ti: <strong className="text-brand">S/ {myShare.toLocaleString('es-PE', { maximumFractionDigits: 0 })}</strong>
                  {' · '}
                  Para el agente actual: <strong className="text-ink">S/ {theirShare.toLocaleString('es-PE', { maximumFractionDigits: 0 })}</strong>
                </p>
              )}
            </div>
          ) : (
            <p className="text-xs text-ink-light">No se encontró el monto exacto de la comisión pactada; se calculará al aceptar.</p>
          )}
          <Button variant="primary" icon={<Percent size={16} />} onClick={handleSubmitCommissionShare} loading={saving}>
            Enviar propuesta
          </Button>
        </div>
      ) : isAgent ? (
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
          <Input label="Nombre" value={name} onChange={(e) => setName(e.target.value)} />
          <Input label="Correo" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
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
