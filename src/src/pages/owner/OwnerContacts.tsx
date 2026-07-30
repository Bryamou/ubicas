import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useOwnerContactsAndVisits } from '@/hooks/useOwnerProperties';
import { LoadingState } from '@/components/ui/LoadingState';
import { EmptyState } from '@/components/ui/EmptyState';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Button } from '@/components/ui/Button';
import { AdminTable, type AdminTableColumn } from '@/components/ui/AdminTable';
import type { OwnerContactRow, OwnerVisitRow } from '@/hooks/useOwnerProperties';
import { MessagesSquare } from 'lucide-react';

type Tab = 'contacts' | 'visits';

export function OwnerContactsPage() {
  const { profile } = useAuth();
  const { contacts, visits, loading, markContactAttended, updateVisitStatus } = useOwnerContactsAndVisits(
    profile?.id
  );
  const [tab, setTab] = useState<Tab>('contacts');

  if (loading) return <LoadingState label="Cargando contactos y visitas…" />;

  const contactColumns: AdminTableColumn<OwnerContactRow>[] = [
    { key: 'name', header: 'Interesado', render: (r) => r.requesterName },
    { key: 'property', header: 'Inmueble', render: (r) => r.propertyTitle },
    { key: 'date', header: 'Fecha', render: (r) => new Date(r.created_at).toLocaleDateString('es-PE') },
    { key: 'message', header: 'Mensaje', render: (r) => <span className="line-clamp-2 max-w-xs">{r.message ?? '—'}</span> },
    { key: 'status', header: 'Estado', render: (r) => <StatusBadge status={r.status} /> },
    {
      key: 'actions',
      header: 'Acción',
      render: (r) =>
        r.status === 'pending' ? (
          <Button size="sm" variant="secondary" onClick={() => markContactAttended(r.id)}>
            Marcar atendido
          </Button>
        ) : (
          <span className="text-xs text-ink-light">Atendido</span>
        ),
    },
  ];

  const visitColumns: AdminTableColumn<OwnerVisitRow>[] = [
    { key: 'name', header: 'Interesado', render: (r) => r.requesterName },
    { key: 'property', header: 'Inmueble', render: (r) => r.propertyTitle },
    { key: 'date', header: 'Fecha propuesta', render: (r) => new Date(r.proposed_date).toLocaleString('es-PE') },
    { key: 'status', header: 'Estado', render: (r) => <StatusBadge status={r.status} /> },
    {
      key: 'actions',
      header: 'Acción',
      render: (r) =>
        r.status === 'pending' ? (
          <div className="flex gap-2">
            <Button size="sm" variant="primary" onClick={() => updateVisitStatus(r.id, 'accepted')}>
              Aceptar
            </Button>
            <Button size="sm" variant="danger" onClick={() => updateVisitStatus(r.id, 'rejected')}>
              Rechazar
            </Button>
          </div>
        ) : r.status === 'accepted' ? (
          <Button size="sm" variant="secondary" onClick={() => updateVisitStatus(r.id, 'completed')}>
            Marcar completada
          </Button>
        ) : (
          <span className="text-xs text-ink-light">—</span>
        ),
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-2 border-b border-border">
        <button
          onClick={() => setTab('contacts')}
          className={`border-b-2 px-3 py-2 text-sm font-semibold ${
            tab === 'contacts' ? 'border-brand text-brand' : 'border-transparent text-ink-light'
          }`}
        >
          Contactos ({contacts.length})
        </button>
        <button
          onClick={() => setTab('visits')}
          className={`border-b-2 px-3 py-2 text-sm font-semibold ${
            tab === 'visits' ? 'border-brand text-brand' : 'border-transparent text-ink-light'
          }`}
        >
          Visitas ({visits.length})
        </button>
      </div>

      {tab === 'contacts' &&
        (contacts.length === 0 ? (
          <EmptyState icon={<MessagesSquare size={28} />} title="Sin contactos aún" description="Cuando alguien te escriba por un inmueble, aparecerá aquí." />
        ) : (
          <AdminTable columns={contactColumns} rows={contacts} getRowKey={(r) => r.id} />
        ))}

      {tab === 'visits' &&
        (visits.length === 0 ? (
          <EmptyState icon={<MessagesSquare size={28} />} title="Sin solicitudes de visita" description="Las solicitudes de visita a tus inmuebles aparecerán aquí." />
        ) : (
          <AdminTable columns={visitColumns} rows={visits} getRowKey={(r) => r.id} />
        ))}
    </div>
  );
}
