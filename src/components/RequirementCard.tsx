import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, BedDouble, Bath, Ruler, Car, Calendar, Heart, MessageCircle, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { RequirementContactModal } from '@/components/RequirementContactModal';
import type { Requirement, ProposalStatus } from '@/types/database';
import { requirementTypeLabels, formatBudget, expectedDatePhrase, getOpportunityBadge } from '@/lib/requirementHelpers';

interface RequirementCardProps {
  requirement: Requirement;
  initialFavorite?: boolean;
  initialContacted?: boolean;
  proposalStatus?: ProposalStatus | null;
}

const toneClasses: Record<string, string> = {
  danger: 'bg-red-50 text-red-700',
  warning: 'bg-warning-soft text-warning',
  success: 'bg-success-soft text-success',
};

/**
 * Tarjeta de "cliente" (requerimiento): toda la tarjeta lleva al detalle;
 * el botón "Contactar" y el corazón de favoritos son la única excepción
 * (usan stopPropagation para no disparar la navegación). Resumen
 * ejecutivo sin fotos, con el presupuesto como elemento dominante.
 */
export function RequirementCard({ requirement: r, initialFavorite, initialContacted, proposalStatus }: RequirementCardProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isFavorite, setIsFavorite] = useState(!!initialFavorite);
  const [savingFavorite, setSavingFavorite] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);
  const [contacted, setContacted] = useState(!!initialContacted);

  const goToDetail = () => navigate(`/requerimientos/${r.id}`);

  const toggleFavorite = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    setSavingFavorite(true);
    if (isFavorite) {
      await supabase.from('favorites').delete().eq('requirement_id', r.id).eq('user_id', user.id);
    } else {
      const { error } = await supabase.from('favorites').insert({ requirement_id: r.id, user_id: user.id });
      if (error) {
        alert(error.message);
        setSavingFavorite(false);
        return;
      }
    }
    setIsFavorite(!isFavorite);
    setSavingFavorite(false);
  };

  const handleContactClick = () => {
    if (!user) {
      navigate('/login', { state: { from: `/requerimientos/${r.id}` } });
      return;
    }
    if (user.id === r.buyer_id) return; // no contactarse a uno mismo
    setContactOpen(true);
  };

  const typeLabel = requirementTypeLabels[r.property_type] ?? r.property_type;
  const title =
    r.operation === 'sale'
      ? `Busco ${typeLabel.toLowerCase()} en ${r.district}`
      : `Busco ${typeLabel.toLowerCase()} para alquiler en ${r.district}`;
  const badge = getOpportunityBadge(r.urgency);

  return (
    <div
      role="link"
      tabIndex={0}
      onClick={goToDetail}
      onKeyDown={(e) => e.key === 'Enter' && goToDetail()}
      className="flex h-full cursor-pointer flex-col gap-3 rounded-card border border-border bg-white p-5 shadow-card transition hover:shadow-soft"
    >
      {/* Nivel 1: operación + indicador de oportunidad */}
      <div className="flex items-start justify-between gap-2">
        <span className="rounded-full bg-surface-muted px-2.5 py-1 text-xs font-semibold text-ink">
          {r.operation === 'sale' ? 'Compra' : 'Alquiler'}
        </span>
        <span className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold uppercase tracking-wide ${toneClasses[badge.tone]}`}>
          {badge.emoji} {badge.label}
        </span>
      </div>

      {/* Nivel 2: título */}
      <h3 className="line-clamp-2 text-base font-bold text-ink">{title}</h3>
      <p className="flex items-center gap-1 text-xs text-ink-light">
        <MapPin size={12} /> {r.district}
      </p>

      {/* Nivel 3: presupuesto — el elemento con más peso visual */}
      <p className="text-2xl font-extrabold text-brand">
        {formatBudget(r.max_budget)}
        {r.operation === 'rent' && <span className="text-sm font-normal text-ink-light"> /mes</span>}
      </p>

      {/* Nivel 4: características */}
      <div className="flex flex-wrap items-center gap-3 text-xs text-ink-light">
        {r.bedrooms != null && (
          <span className="flex items-center gap-1">
            <BedDouble size={13} /> {r.bedrooms}+ dorm.
          </span>
        )}
        {r.bathrooms != null && (
          <span className="flex items-center gap-1">
            <Bath size={13} /> {r.bathrooms}+ baños
          </span>
        )}
        {r.min_area_m2 != null && (
          <span className="flex items-center gap-1">
            <Ruler size={13} /> {r.min_area_m2}+ m²
          </span>
        )}
        {r.parking && (
          <span className="flex items-center gap-1">
            <Car size={13} /> Cochera
          </span>
        )}
      </div>

      {/* Nivel 5: fecha esperada, destacada */}
      <p className="flex items-center gap-1.5 rounded-input bg-brand-soft px-3 py-2 text-sm font-semibold text-brand">
        <Calendar size={14} /> {expectedDatePhrase(r.urgency)}
      </p>

      {/* Nivel 6: descripción, máx. 2 líneas */}
      {r.description && (
        <div>
          <p className="line-clamp-2 text-sm text-ink-light">{r.description}</p>
          <span className="text-xs font-semibold text-brand hover:underline">Ver más</span>
        </div>
      )}

      {/* Acciones: no navegan al detalle. mt-auto asegura que quede
          siempre pegado abajo, aunque la descripción varíe de largo. */}
      <div className="mt-auto flex gap-2 border-t border-border pt-3" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          onClick={handleContactClick}
          className={`flex h-9 flex-1 items-center justify-center gap-1.5 rounded-input text-sm font-semibold transition ${
            contacted ? 'bg-success-soft text-success hover:bg-success/20' : 'bg-brand text-white hover:bg-brand-hover'
          }`}
        >
          {contacted ? <CheckCircle2 size={14} /> : <MessageCircle size={14} />}
          {contacted ? 'Ya contactado' : 'Contactar'}
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

      {user && user.id !== r.buyer_id && (
        <div onClick={(e) => e.stopPropagation()}>
          <RequirementContactModal
            open={contactOpen}
            onClose={() => setContactOpen(false)}
            requirementId={r.id}
            alreadyContacted={contacted}
            existingProposalStatus={proposalStatus}
            onContacted={() => setContacted(true)}
          />
        </div>
      )}
    </div>
  );
}
