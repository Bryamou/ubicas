import { useState } from 'react';
import { Home, Users } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useFavorites } from '@/hooks/useFavorites';
import { PropertyCard } from '@/components/ui/PropertyCard';
import { RequirementCard } from '@/components/RequirementCard';
import { LoadingState } from '@/components/ui/LoadingState';
import { EmptyState } from '@/components/ui/EmptyState';

/** Bandeja de favoritos compartida por los 3 roles: inmuebles y
 * requerimientos ("clientes"), hasta 20 de cada uno. */
export function FavoritesPage() {
  const { profile } = useAuth();
  const { properties, requirements, loading } = useFavorites(profile?.id);
  const [tab, setTab] = useState<'properties' | 'requirements'>('properties');

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-ink">Favoritos</h1>
          <p className="mt-1 text-sm text-ink-light">Hasta 20 inmuebles y 20 clientes guardados.</p>
        </div>
      </div>

      <div className="mt-5 flex w-fit rounded-input border border-border bg-white p-1">
        <button
          onClick={() => setTab('properties')}
          className={`flex items-center gap-1.5 rounded-[6px] px-4 py-1.5 text-sm font-semibold transition ${
            tab === 'properties' ? 'bg-brand text-white' : 'text-ink-light hover:text-ink'
          }`}
        >
          <Home size={14} /> Inmuebles ({properties.length}/20)
        </button>
        <button
          onClick={() => setTab('requirements')}
          className={`flex items-center gap-1.5 rounded-[6px] px-4 py-1.5 text-sm font-semibold transition ${
            tab === 'requirements' ? 'bg-brand text-white' : 'text-ink-light hover:text-ink'
          }`}
        >
          <Users size={14} /> Clientes ({requirements.length}/20)
        </button>
      </div>

      <div className="mt-6">
        {loading ? (
          <LoadingState label="Cargando favoritos…" />
        ) : tab === 'properties' ? (
          properties.length === 0 ? (
            <EmptyState icon={<Home size={24} />} title="Aún no guardaste inmuebles favoritos" />
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {properties.map((p) => (
                <PropertyCard key={p.id} property={p} coverImageUrl={p.coverImageUrl} initialFavorite />
              ))}
            </div>
          )
        ) : requirements.length === 0 ? (
          <EmptyState icon={<Users size={24} />} title="Aún no guardaste clientes favoritos" />
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {requirements.map((r) => (
              <RequirementCard key={r.id} requirement={r} initialFavorite />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
