import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BedDouble, Bath, Ruler, ShieldCheck, User, Heart, MessageCircle, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { ContactRequestModal } from '@/components/ContactRequestModal';
import { getContactedPropertyIds } from '@/lib/guestContact';
import type { Property, ProposalStatus } from '@/types/database';

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
  initialFavorite?: boolean;
  /** Si ya se contactó antes (cuenta logueada, calculado por el padre en
   * lote). Para invitados sin cuenta, se revisa localStorage aparte. */
  initialContacted?: boolean;
  /** Estado de la propuesta del agente (si aplica), para mostrar mensaje
   * de "pendiente" o "rechazada" al reabrir. */
  proposalStatus?: ProposalStatus | null;
}

function formatPrice(price: number, currency: string) {
  const symbol = currency === 'USD' ? 'US$' : 'S/';
  return `${symbol} ${price.toLocaleString('es-PE')}`;
}

export function PropertyCard({
  property,
  coverImageUrl,
  isAgentListed,
  initialFavorite,
  initialContacted,
  proposalStatus,
}: PropertyCardProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isFavorite, setIsFavorite] = useState(!!initialFavorite);
  const [savingFavorite, setSavingFavorite] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);
  const [contacted, setContacted] = useState(
    () => !!initialContacted || (!user && getContactedPropertyIds().has(property.id))
  );

  const toggleFavorite = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    setSavingFavorite(true);
    if (isFavorite) {
      await supabase.from('favorites').delete().eq('property_id', property.id).eq('user_id', user.id);
    } else {
      const { error } = await supabase.from('favorites').insert({ property_id: property.id, user_id: user.id });
      if (error) {
        alert(error.message);
        setSavingFavorite(false);
        return;
      }
    }
    setIsFavorite(!isFavorite);
    setSavingFavorite(false);
  };

  return (
    <div className="group flex h-full flex-col overflow-hidden rounded-card border border-border bg-white shadow-card transition hover:shadow-soft">
      <Link to={`/inmuebles/${property.id}`} className="flex flex-1 flex-col">
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
            className={`absolute right-3 top-3 flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold shadow-card ${
              isAgentListed ? 'bg-ink text-white' : 'bg-brand-soft text-brand'
            }`}
          >
            {isAgentListed ? <ShieldCheck size={11} /> : <User size={11} />}
            {isAgentListed ? 'Agente verificado' : 'Propietario'}
          </span>
        </div>

        <div className="flex flex-col gap-2 p-4 pb-2">
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

      {/* CTA de contacto y favorito, fuera del área clicable de navegación */}
      <div className="flex items-center gap-2 px-4 pb-4 pt-1">
        <button
          type="button"
          onClick={() => setContactOpen(true)}
          className={`flex h-9 flex-1 items-center justify-center gap-1.5 rounded-input text-sm font-semibold transition ${
            contacted ? 'bg-success-soft text-success hover:bg-success/20' : 'bg-brand text-white hover:bg-brand-hover'
          }`}
        >
          {contacted ? <CheckCircle2 size={14} /> : <MessageCircle size={14} />}
          {contacted ? 'Ver contacto' : 'Contactar'}
        </button>
        <button
          type="button"
          onClick={toggleFavorite}
          disabled={savingFavorite}
          aria-label="Guardar en favoritos"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-input border border-border text-brand hover:bg-brand-soft"
        >
          <Heart size={15} fill={isFavorite ? 'currentColor' : 'none'} />
        </button>
      </div>

      <ContactRequestModal
        open={contactOpen}
        onClose={() => setContactOpen(false)}
        property={property}
        alreadyContacted={contacted}
        existingProposalStatus={proposalStatus}
        onContacted={() => setContacted(true)}
      />
    </div>
  );
}
