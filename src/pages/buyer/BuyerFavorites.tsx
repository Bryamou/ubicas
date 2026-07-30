import { Heart } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useBuyerFavorites } from '@/hooks/useBuyerData';
import { PropertyCard } from '@/components/ui/PropertyCard';
import { LoadingState } from '@/components/ui/LoadingState';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';
import { Link } from 'react-router-dom';

export function BuyerFavoritesPage() {
  const { profile } = useAuth();
  const { favorites, loading, removeFavorite } = useBuyerFavorites(profile?.id);

  if (loading) return <LoadingState label="Cargando tus favoritos…" />;

  if (favorites.length === 0) {
    return (
      <EmptyState
        icon={<Heart size={28} />}
        title="Aún no tienes favoritos"
        description="Guarda los inmuebles que te interesen para encontrarlos rápido después."
        action={
          <Link to="/inmuebles">
            <Button variant="primary">Buscar inmuebles</Button>
          </Link>
        }
      />
    );
  }

  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {favorites.map((p) => (
        <div key={p.id} className="flex flex-col gap-2">
          <PropertyCard property={p} coverImageUrl={p.coverImageUrl} />
          <Button variant="neutral" size="sm" onClick={() => removeFavorite(p.favoriteId)}>
            Quitar de favoritos
          </Button>
        </div>
      ))}
    </div>
  );
}
