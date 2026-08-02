import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useOwnerContacts, type OwnerContactRow } from '@/hooks/useOwnerProperties';
import { getOrCreateConversation } from '@/hooks/useConversations';
import { LoadingState } from '@/components/ui/LoadingState';
import { EmptyState } from '@/components/ui/EmptyState';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { AdminTable, type AdminTableColumn } from '@/components/ui/AdminTable';
import { MessagesSquare, Send, X } from 'lucide-react';
import { useState } from 'react';
import type { ContactStatus } from '@/types/database';

const statusOptions: { value: ContactStatus; label: string }[] = [
  { value: 'following_up', label: 'En seguimiento' },
  { value: 'attended', label: 'Atendido' },
  { value: 'visiting', label: 'En visita' },
  { value: 'closing', label: 'Por concretar' },
  { value: 'closed', label: 'Cerrado' },
  { value: 'discarded', label: 'Descartado' },
];

export function OwnerContactsPage() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { contacts, loading, updateContactStatus } = useOwnerContacts(profile?.id);
  const [opening, setOpening] = useState<string | null>(null);

  const propertyFilter = searchParams.get('property');
  const filtered = propertyFilter ? contacts.filter((c) => c.property_id === propertyFilter) : contacts;
  const filteredPropertyTitle = propertyFilter ? filtered[0]?.propertyTitle ?? contacts.find((c) => c.property_id === propertyFilter)?.propertyTitle : null;

  const openConversation = async (propertyId: string, requesterId: string) => {
    if (!profile) return;
    setOpening(requesterId + propertyId);
    const { id } = await getOrCreateConversation(profile.id, requesterId, propertyId);
    setOpening(null);
    if (id) navigate(`/mensajes?conversation=${id}`);
  };

  if (loading) return <LoadingState label="Cargando contactos…" />;

  const columns: AdminTableColumn<OwnerContactRow>[] = [
    {
      key: 'name',
      header: 'Interesado',
      render: (r) => (
        <div>
          <p className="font-medium text-ink">{r.requesterName}</p>
          <p className="text-xs text-ink-light">
            {[r.requesterPhone, !r.requester_id ? r.guest_email : null].filter(Boolean).join(' · ')}
          </p>
        </div>
      ),
    },
    { key: 'property', header: 'Inmueble', render: (r) => r.propertyTitle },
    { key: 'date', header: 'Fecha', render: (r) => new Date(r.created_at).toLocaleDateString('es-PE') },
    { key: 'message', header: 'Mensaje', render: (r) => <span className="line-clamp-2 max-w-xs">{r.message ?? '—'}</span> },
    {
      key: 'status',
      header: 'Estado',
      render: (r) => (
        <div className="w-44">
          <Select
            options={statusOptions}
            value={r.status}
            onChange={(e) => updateContactStatus(r.id, e.target.value as ContactStatus)}
          />
        </div>
      ),
    },
    {
      key: 'actions',
      header: 'Acción',
      render: (r) =>
        r.requester_id ? (
          <Button
            size="sm"
            variant="neutral"
            icon={<Send size={13} />}
            loading={opening === r.requester_id + r.property_id}
            onClick={() => openConversation(r.property_id, r.requester_id!)}
          >
            Responder
          </Button>
        ) : null,
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-xl font-extrabold text-ink">Contactos</h1>
        {propertyFilter && (
          <button
            onClick={() => setSearchParams({})}
            className="flex items-center gap-1.5 rounded-full bg-brand-soft px-3 py-1.5 text-xs font-semibold text-brand"
          >
            Filtrado por: {filteredPropertyTitle ?? 'inmueble'} <X size={13} />
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<MessagesSquare size={28} />}
          title="Sin contactos aún"
          description="Cuando alguien te escriba por un inmueble, aparecerá aquí."
        />
      ) : (
        <AdminTable columns={columns} rows={filtered} getRowKey={(r) => r.id} />
      )}
    </div>
  );
}
