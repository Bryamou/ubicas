import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MessagesSquare, Send } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useBuyerContacts } from '@/hooks/useBuyerData';
import { getOrCreateConversation } from '@/hooks/useConversations';
import { LoadingState } from '@/components/ui/LoadingState';
import { EmptyState } from '@/components/ui/EmptyState';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Button } from '@/components/ui/Button';

export function BuyerContactsPage() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const { contacts, loading } = useBuyerContacts(profile?.id);
  const [opening, setOpening] = useState<string | null>(null);

  const openConversation = async (propertyId: string, ownerId: string | null) => {
    if (!profile || !ownerId) return;
    setOpening(propertyId);
    const { id } = await getOrCreateConversation(profile.id, ownerId, propertyId);
    setOpening(null);
    if (id) navigate(`/mensajes?conversation=${id}`);
  };

  if (loading) return <LoadingState label="Cargando…" />;

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-extrabold text-ink">Contactos realizados</h1>

      {contacts.length === 0 ? (
        <EmptyState icon={<MessagesSquare size={28} />} title="Aún no contactaste a nadie" description="Cuando escribas por un inmueble, aparecerá aquí." />
      ) : (
        <div className="flex flex-col gap-2">
          {contacts.map((c) => (
            <div key={c.id} className="flex items-center justify-between rounded-card border border-border bg-white p-3 shadow-card">
              <div>
                <Link to={`/inmuebles/${c.property_id}`} className="text-sm font-semibold text-ink hover:underline">
                  {c.propertyTitle}
                </Link>
                <p className="text-xs text-ink-light">{new Date(c.created_at).toLocaleDateString('es-PE')}</p>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge status={c.status} />
                <Button
                  variant="neutral"
                  size="sm"
                  icon={<Send size={13} />}
                  loading={opening === c.property_id}
                  onClick={() => openConversation(c.property_id, c.propertyOwnerId)}
                >
                  Responder
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
