import { Link } from 'react-router-dom';
import { BedDouble, Bath, Ruler, ShieldCheck, User } from 'lucide-react';
import type { Property } from '@/types/database';

const typeLabels: Record<string, string> = {
  apartment: 'Departamento',
  house: 'Casa',
  office: 'Oficina',
  land: 'Terreno',
  commercial: 'Local comercial',
  other: 'Otro',
};

interface PropertyCardProps {
  property: Property;
  coverImageUrl?: string | null;
  isAgentListed?: boolean;
}

function formatPrice(price: number, currency: string) {
  const symbol = currency === 'USD' ? 'US$' : 'S/';
  return `${symbol} ${price.toLocaleString('es-PE')}`;
}

export function PropertyCard({ property, coverImageUrl, isAgentListed }: PropertyCardProps) {
  return (
    <Link
      to={`/inmuebles/${property.id}`}
      className="group flex flex-col overflow-hidden rounded-card border border-border bg-white shadow-card transition hover:shadow-soft"
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-surface-muted">
        {coverImageUrl ? (
          <img
            src={coverImageUrl}
            alt={property.title}
            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-sm text-ink-light">
            Sin fotos aún
          </div>
        )}
        <span className="absolute left-3 top-3 rounded-full bg-white/95 px-2.5 py-1 text-xs font-semibold text-ink shadow-card">
          {property.operation === 'sale' ? 'Venta' : 'Alquiler'}
        </span>
        <span
          className={`absolute right-3 top-3 flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold shadow-card ${
            isAgentListed ? 'bg-ink text-white' : 'bg-brand-soft text-brand'
          }`}
        >
          {isAgentListed ? <ShieldCheck size={12} /> : <User size={12} />}
          {isAgentListed ? 'Agente verificado' : 'Propietario directo'}
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <span className="text-lg font-bold text-ink">
          {formatPrice(property.price, property.currency)}
          {property.operation === 'rent' && (
            <span className="text-sm font-normal text-ink-light"> /mes</span>
          )}
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
