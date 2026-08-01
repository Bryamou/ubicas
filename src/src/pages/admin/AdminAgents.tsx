import { useEffect, useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Navbar } from '@/components/Navbar';
import { LoadingState } from '@/components/ui/LoadingState';
import { EmptyState } from '@/components/ui/EmptyState';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Alert } from '@/components/ui/Alert';
import type { Profile } from '@/types/database';

export function AdminAgentsPage() {
  const [agents, setAgents] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const { data, error: fetchError } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'agent')
      .order('created_at', { ascending: false });

    if (fetchError) {
      setError(fetchError.message);
    } else {
      setAgents((data as Profile[]) ?? []);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const toggleVerified = async (agent: Profile) => {
    setUpdatingId(agent.id);
    setError(null);
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ agent_verified: !agent.agent_verified })
      .eq('id', agent.id);
    setUpdatingId(null);

    if (updateError) {
      setError(updateError.message);
      return;
    }
    setAgents((prev) => prev.map((a) => (a.id === agent.id ? { ...a, agent_verified: !a.agent_verified } : a)));
  };

  const filtered = agents.filter((a) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return a.full_name.toLowerCase().includes(q) || (a.agency_name ?? '').toLowerCase().includes(q);
  });

  return (
    <div className="min-h-screen bg-surface-muted">
      <Navbar />
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-extrabold text-ink">Verificación de agentes</h1>
        <p className="mt-1 text-sm text-ink-light">
          Activa o desactiva el estado "Agente verificado" que se muestra en las publicaciones y propuestas.
        </p>

        {error && (
          <div className="mt-4">
            <Alert type="error">{error}</Alert>
          </div>
        )}

        <div className="mt-6 max-w-sm">
          <Input placeholder="Buscar por nombre o inmobiliaria" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>

        <div className="mt-6">
          {loading ? (
            <LoadingState label="Cargando agentes…" />
          ) : filtered.length === 0 ? (
            <EmptyState icon={<ShieldCheck size={28} />} title="No hay agentes registrados todavía" />
          ) : (
            <div className="flex flex-col gap-3">
              {filtered.map((agent) => (
                <div
                  key={agent.id}
                  className="flex flex-col gap-3 rounded-card border border-border bg-white p-4 shadow-card sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-11 w-11 shrink-0 overflow-hidden rounded-full bg-surface-muted">
                      {agent.avatar_url && <img src={agent.avatar_url} alt="" className="h-full w-full object-cover" />}
                    </div>
                    <div>
                      <p className="font-semibold text-ink">{agent.full_name}</p>
                      <p className="text-xs text-ink-light">
                        {agent.agency_name || 'Sin inmobiliaria'}
                        {agent.agent_zones && agent.agent_zones.length > 0 && ` · ${agent.agent_zones.join(', ')}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusBadge
                      label={agent.agent_verified ? 'Verificado' : 'Pendiente'}
                      tone={agent.agent_verified ? 'success' : 'warning'}
                    />
                    <Button
                      variant={agent.agent_verified ? 'neutral' : 'primary'}
                      size="sm"
                      loading={updatingId === agent.id}
                      onClick={() => toggleVerified(agent)}
                    >
                      {agent.agent_verified ? 'Quitar verificación' : 'Verificar agente'}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
