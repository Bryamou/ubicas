import { useAuth } from '@/contexts/AuthContext';
import { useOwnerProperties } from '@/hooks/useOwnerProperties';
import { LoadingState } from '@/components/ui/LoadingState';
import { EmptyState } from '@/components/ui/EmptyState';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { AdminTable, type AdminTableColumn } from '@/components/ui/AdminTable';
import type { OwnerPropertyRow } from '@/hooks/useOwnerProperties';
import { BarChart3 } from 'lucide-react';

export function OwnerMetricsPage() {
  const { profile } = useAuth();
  const { properties, loading } = useOwnerProperties(profile?.id);

  if (loading) return <LoadingState label="Cargando métricas…" />;

  if (properties.length === 0) {
    return (
      <EmptyState
        icon={<BarChart3 size={28} />}
        title="Aún no hay métricas"
        description="Publica un inmueble para empezar a ver vistas y contactos."
      />
    );
  }

  const columns: AdminTableColumn<OwnerPropertyRow>[] = [
    { key: 'title', header: 'Inmueble', render: (r) => <span className="font-medium text-ink">{r.title}</span> },
    { key: 'status', header: 'Estado', render: (r) => <StatusBadge status={r.status} /> },
    { key: 'views', header: 'Vistas', render: (r) => r.viewsCount },
    { key: 'contacts', header: 'Contactos', render: (r) => r.contactsCount },
    { key: 'proposals', header: 'Propuestas pendientes', render: (r) => r.pendingProposalsCount },
  ];

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-ink-light">
        Desempeño de cada inmueble: vistas totales, contactos recibidos y propuestas de agentes pendientes.
      </p>
      <AdminTable columns={columns} rows={properties} getRowKey={(r) => r.id} />
    </div>
  );
}
