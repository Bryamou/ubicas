import { useEffect, useState } from 'react';
import { Phone, Mail } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';

interface RequirementContactModalProps {
  open: boolean;
  onClose: () => void;
  requirementId: string;
  /** Si ya se contactó antes, abre directo en la vista de confirmación. */
  alreadyContacted?: boolean;
  onContacted: () => void;
}

const pitchPlaceholderByRole: Record<string, string> = {
  owner: 'Hola, tengo un inmueble que podría interesarte. Cuéntame más sobre lo que buscas y te comparto los detalles.',
  agent: 'Hola, puedo ayudarte con tu búsqueda. Me comprometo a enviarte opciones relevantes cada 3 días.',
  buyer: 'Hola, vi tu búsqueda y quería contactarte.',
};

/**
 * Contacto sobre un requerimiento: a diferencia del contacto de inmuebles,
 * NO abre una conversación — guarda un mensaje de gancho comercial y los
 * datos de contacto de quien escribe, asociado siempre a ese requerimiento
 * específico (para que el cliente pueda diferenciarlos en su bandeja).
 */
export function RequirementContactModal({
  open,
  onClose,
  requirementId,
  alreadyContacted,
  onContacted,
}: RequirementContactModalProps) {
  const { user, profile } = useAuth();
  const [sent, setSent] = useState(false);
  const [pitch, setPitch] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setError(null);
    setSent(!!alreadyContacted);
    setPitch('');
    setName(profile?.full_name ?? '');
    setEmail(user?.email ?? '');
    setPhone(profile?.phone ?? '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, alreadyContacted]);

  const handleSubmit = async () => {
    if (!user || !profile) return;
    if (!pitch.trim()) {
      setError('Escribe un mensaje de presentación.');
      return;
    }
    setSaving(true);
    setError(null);

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

    setSent(true);
    onContacted();
  };

  return (
    <Modal open={open} onClose={onClose} title="Contactar">
      {sent ? (
        <div className="flex flex-col items-center gap-3 py-2 text-center">
          <Alert type="success">
            Tu mensaje fue enviado. El cliente lo verá en su bandeja junto con tus datos de contacto.
          </Alert>
          {(phone || email) && (
            <div className="w-full rounded-card border border-border p-3 text-left text-sm text-ink-light">
              {phone && (
                <p className="flex items-center gap-1.5">
                  <Phone size={13} /> {phone}
                </p>
              )}
              {email && (
                <p className="flex items-center gap-1.5">
                  <Mail size={13} /> {email}
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
          <Input label="Nombre de contacto" value={name} onChange={(e) => setName(e.target.value)} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Teléfono" value={phone} onChange={(e) => setPhone(e.target.value)} />
            <Input label="Correo" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <Button variant="primary" onClick={handleSubmit} loading={saving}>
            Enviar
          </Button>
        </div>
      )}
    </Modal>
  );
}
