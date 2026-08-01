import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';

interface ContactRequestModalProps {
  open: boolean;
  onClose: () => void;
  propertyId: string;
}

/** Formulario de contacto de la tarjeta de inmueble: pide nombre, correo y
 * teléfono. Si hay sesión iniciada, se pre-llena con los datos del perfil
 * (igual se pueden editar); si no, cualquier visitante puede enviarlo
 * como invitado. */
export function ContactRequestModal({ open, onClose, propertyId }: ContactRequestModalProps) {
  const { user, profile } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setName(profile?.full_name ?? '');
    setEmail(user?.email ?? '');
    setPhone(profile?.phone ?? '');
    setSuccess(false);
    setError(null);
    setErrors({});
  }, [open, profile, user]);

  const handleSubmit = async () => {
    const newErrors: Record<string, string> = {};
    if (!name.trim()) newErrors.name = 'Ingresa tu nombre.';
    if (!email.trim()) newErrors.email = 'Ingresa tu correo.';
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    setSaving(true);
    setError(null);

    const { error: insertError } = await supabase.from('contact_requests').insert({
      property_id: propertyId,
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
    setSuccess(true);
  };

  return (
    <Modal open={open} onClose={onClose} title="Contactar">
      {success ? (
        <div className="flex flex-col items-center gap-3 py-4 text-center">
          <Alert type="success">Tu solicitud fue enviada. Te contactarán pronto.</Alert>
          <Button variant="neutral" onClick={onClose}>
            Cerrar
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {error && <Alert type="error">{error}</Alert>}
          <Input label="Nombre" value={name} onChange={(e) => setName(e.target.value)} error={errors.name} />
          <Input label="Correo" type="email" value={email} onChange={(e) => setEmail(e.target.value)} error={errors.email} />
          <Input label="Teléfono (opcional)" value={phone} onChange={(e) => setPhone(e.target.value)} />
          <Button variant="primary" onClick={handleSubmit} loading={saving}>
            Enviar
          </Button>
        </div>
      )}
    </Modal>
  );
}
