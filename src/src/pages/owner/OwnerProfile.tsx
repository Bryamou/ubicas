import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';

export function OwnerProfilePage() {
  const { profile, user, refreshProfile } = useAuth();
  const [fullName, setFullName] = useState(profile?.full_name ?? '');
  const [phone, setPhone] = useState(profile?.phone ?? '');
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleSave = async () => {
    if (!profile) return;
    setSaving(true);
    setFeedback(null);
    const { error } = await supabase
      .from('profiles')
      .update({ full_name: fullName.trim(), phone: phone.trim() || null })
      .eq('id', profile.id);
    setSaving(false);

    if (error) {
      setFeedback({ type: 'error', message: error.message });
    } else {
      await refreshProfile();
      setFeedback({ type: 'success', message: 'Tu perfil se actualizó correctamente.' });
    }
  };

  return (
    <div className="max-w-lg rounded-card border border-border bg-white p-6 shadow-card">
      {feedback && (
        <div className="mb-4">
          <Alert type={feedback.type === 'success' ? 'success' : 'error'}>{feedback.message}</Alert>
        </div>
      )}
      <div className="flex flex-col gap-4">
        <Input label="Nombre completo" value={fullName} onChange={(e) => setFullName(e.target.value)} />
        <Input label="Celular" value={phone} onChange={(e) => setPhone(e.target.value)} />
        <Input label="Correo" value={user?.email ?? ''} disabled hint="El correo no se puede editar desde aquí." />
        <Button variant="primary" onClick={handleSave} loading={saving}>
          Guardar cambios
        </Button>
      </div>
    </div>
  );
}
