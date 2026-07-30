import { useRef, useState } from 'react';
import { Camera, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { getPublicAvatarUrl, uploadAvatar } from '@/lib/storage';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { StatusBadge } from '@/components/ui/StatusBadge';

export function AgentProfilePage() {
  const { profile, user, refreshProfile } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [fullName, setFullName] = useState(profile?.full_name ?? '');
  const [phone, setPhone] = useState(profile?.phone ?? '');
  const [agencyName, setAgencyName] = useState(profile?.agency_name ?? '');
  const [description, setDescription] = useState(profile?.agent_description ?? '');
  const [zones, setZones] = useState((profile?.agent_zones ?? []).join(', '));
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url ?? '');
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleAvatarChange = async (file: File | undefined) => {
    if (!file || !profile) return;
    setUploadingAvatar(true);
    const { path, error } = await uploadAvatar(profile.id, file);
    setUploadingAvatar(false);

    if (error || !path) {
      setFeedback({ type: 'error', message: error ?? 'No se pudo subir la foto.' });
      return;
    }
    setAvatarUrl(getPublicAvatarUrl(path));
  };

  const handleSave = async () => {
    if (!profile) return;
    setSaving(true);
    setFeedback(null);

    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: fullName.trim(),
        phone: phone.trim() || null,
        agency_name: agencyName.trim() || null,
        agent_description: description.trim() || null,
        agent_zones: zones
          ? zones.split(',').map((z) => z.trim()).filter(Boolean)
          : [],
        avatar_url: avatarUrl || null,
      })
      .eq('id', profile.id);

    setSaving(false);

    if (error) {
      setFeedback({ type: 'error', message: error.message });
    } else {
      await refreshProfile();
      setFeedback({ type: 'success', message: 'Tu perfil profesional se actualizó correctamente.' });
    }
  };

  return (
    <div className="max-w-xl rounded-card border border-border bg-white p-6 shadow-card">
      {feedback && (
        <div className="mb-4">
          <Alert type={feedback.type === 'success' ? 'success' : 'error'}>{feedback.message}</Alert>
        </div>
      )}

      <div className="mb-6 flex items-center gap-4">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="group relative h-20 w-20 shrink-0 overflow-hidden rounded-full border border-border bg-surface-muted"
        >
          {avatarUrl ? (
            <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center text-xs text-ink-light">Sin foto</div>
          )}
          <span className="absolute inset-0 flex items-center justify-center bg-black/40 text-white opacity-0 transition group-hover:opacity-100">
            <Camera size={18} />
          </span>
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp"
          className="hidden"
          onChange={(e) => handleAvatarChange(e.target.files?.[0])}
        />
        <div>
          <p className="text-sm font-semibold text-ink">Foto de perfil</p>
          <p className="text-xs text-ink-light">{uploadingAvatar ? 'Subiendo…' : 'JPG, PNG o WEBP'}</p>
          <div className="mt-1 flex items-center gap-1.5">
            <ShieldCheck size={14} className={profile?.agent_verified ? 'text-success' : 'text-ink-light'} />
            <StatusBadge label={profile?.agent_verified ? 'Verificado' : 'Verificación pendiente'} tone={profile?.agent_verified ? 'success' : 'warning'} />
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <Input label="Nombre completo" value={fullName} onChange={(e) => setFullName(e.target.value)} />
        <Input label="Celular" value={phone} onChange={(e) => setPhone(e.target.value)} />
        <Input label="Correo" value={user?.email ?? ''} disabled hint="El correo no se puede editar desde aquí." />
        <Input label="Inmobiliaria" value={agencyName} onChange={(e) => setAgencyName(e.target.value)} placeholder="Nombre de tu inmobiliaria (opcional)" />
        <Input
          label="Zonas de trabajo"
          value={zones}
          onChange={(e) => setZones(e.target.value)}
          placeholder="Ej. Miraflores, San Isidro, Surco"
          hint="Sepáralas con comas."
        />
        <Textarea
          label="Descripción profesional"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Cuéntales a los propietarios por qué deberían elegirte…"
        />
        <Button variant="primary" onClick={handleSave} loading={saving}>
          Guardar cambios
        </Button>
      </div>
    </div>
  );
}
