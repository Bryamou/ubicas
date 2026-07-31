import { useState, type MouseEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Heart, BedDouble, Bath, Ruler } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import type { Property } from '@/types/database';

const typeLabels: Record<string, string> = {
  apartment: 'Departamento',
  house: 'Casa',
  office: 'Oficina',
  land: 'Terreno',
  commercial: 'Local comercial',
  other: 'Otro',
};

function formatPrice(price: number, currency: string) {
  const symbol = currency === 'USD' ? 'US$' : 'S/';
  return `${symbol} ${price.toLocaleString('es-PE')}`;
}

function timeAgo(dateStr: string | null) {
  if (!dateStr) return null;
  const days = Math.floor((Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24));
  if (days <= 0) return 'Publicado hoy';
  if (days === 1) return 'Publicado ayer';
  if (days < 30) return `Publicado hace ${days} días`;
  const months = Math.floor(days / 30);
  return `Publicado hace ${months} ${months === 1 ? 'mes' : 'meses'}`;
}

interface FeaturedPropertyCardProps {
  property: Property;
  coverImageUrl: string | null;
  initialFavorite?: boolean;
}

export function FeaturedPropertyCard({ property, coverImageUrl, initialFavorite }: FeaturedPropertyCardProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isFavorite, setIsFavorite] = useState(!!initialFavorite);
  const [saving, setSaving] = useState(false);

  const toggleFavorite = async (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      navigate('/login');
      return;
    }
    setSaving(true);
    if (isFavorite) {
      await supabase.from('favorites').delete().eq('property_id', property.id).eq('user_id', user.id);
    } else {
      await supabase.from('favorites').insert({ property_id: property.id, user_id: user.id });
    }
    setIsFavorite(!isFavorite);
    setSaving(false);
  };

  return (
    <Link
      to={`/inmuebles/${property.id}`}
      className="group flex h-full flex-col overflow-hidden rounded-card border border-border bg-white shadow-card transition hover:shadow-soft"
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-surface-muted">
        {coverImageUrl ? (
          <img
            src={coverImageUrl}
            alt={property.title}
            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-sm text-ink-light">Sin fotos aún</div>
        )}
        <span className="absolute left-3 top-3 rounded-full bg-white/95 px-2.5 py-1 text-xs font-semibold text-ink shadow-card">
          {property.operation === 'sale' ? 'Venta' : 'Alquiler'}
        </span>
        <button
          onClick={toggleFavorite}
          disabled={saving}
          aria-label="Guardar en favoritos"
          className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/95 text-brand shadow-card transition hover:scale-105"
        >
          <Heart size={15} fill={isFavorite ? 'currentColor' : 'none'} />
        </button>
        {timeAgo(property.published_at) && (
          <span className="absolute bottom-3 left-3 rounded-full bg-ink/70 px-2 py-0.5 text-[11px] font-medium text-white">
            {timeAgo(property.published_at)}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <span className="text-lg font-bold text-ink">
          {formatPrice(property.price, property.currency)}
          {property.operation === 'rent' && <span className="text-sm font-normal text-ink-light"> /mes</span>}
        </span>
        <h3 className="line-clamp-1 text-sm font-semibold text-ink">{property.title}</h3>
        <p className="text-xs text-ink-light">
          {typeLabels[property.property_type] ?? property.property_type} · {property.district}
        </p>
        <div className="mt-1 flex items-center gap-4 text-xs text-ink-light">
          {property.area_m2 && (
            <span className="flex items-center gap-1">
              <Ruler size={13} /> {property.area_m2} m²
            </span>
          )}
          {property.bedrooms != null && (
            <span className="flex items-center gap-1">
              <BedDouble size={13} /> {property.bedrooms}
            </span>
          )}
          {property.bathrooms != null && (
            <span className="flex items-center gap-1">
              <Bath size={13} /> {property.bathrooms}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
