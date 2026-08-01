import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BedDouble, Bath, Ruler, Users, Heart, Calendar } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { RequirementIllustration } from '@/components/RequirementIllustration';
import type { Requirement } from '@/types/database';
import { requirementTypeLabels, formatBudget, expectedDatePhrase } from '@/lib/requirementHelpers';

interface RequirementCardProps {
  requirement: Requirement;
  initialFavorite?: boolean;
}

/** Tarjeta de "cliente" (requerimiento): misma estructura y clases que
 * PropertyCard, con el contenido adaptado — sin foto (ilustración),
 * "Compra/Alquiler" + etiqueta "Cliente" en vez de "Venta" + "Propietario",
 * presupuesto máximo en vez de precio, y el botón principal lleva al
 * detalle en vez de abrir un formulario de contacto. */
export function RequirementCard({ requirement: r, initialFavorite }: RequirementCardProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isFavorite, setIsFavorite] = useState(!!initialFavorite);
  const [savingFavorite, setSavingFavorite] = useState(false);

  const toggleFavorite = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    setSavingFavorite(true);
    if (isFavorite) {
      await supabase.from('favorites').delete().eq('requirement_id', r.id).eq('user_id', user.id);
    } else {
      await supabase.from('favorites').insert({ requirement_id: r.id, user_id: user.id });
    }
    setIsFavorite(!isFavorite);
    setSavingFavorite(false);
  };

  const typeLabel = requirementTypeLabels[r.property_type] ?? r.property_type;
  const title =
    r.operation === 'sale'
      ? `Busco ${typeLabel.toLowerCase()} en ${r.district}`
      : `Busco ${typeLabel.toLowerCase()} para alquiler en ${r.district}`;

  return (
    <div className="group flex flex-col overflow-hidden rounded-card border border-border bg-white shadow-card transition hover:shadow-soft">
      <Link to={`/requerimientos/${r.id}`}>
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-surface-muted">
          <RequirementIllustration />
          <span className="absolute left-3 top-3 rounded-full bg-white/95 px-2.5 py-1 text-xs font-semibold text-ink shadow-card">
            {r.operation === 'sale' ? 'Compra' : 'Alquiler'}
          </span>
          <span className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-brand-soft px-2 py-0.5 text-[11px] font-semibold text-brand shadow-card">
            <Users size={11} /> Cliente
          </span>
        </div>

        <div className="flex flex-col gap-2 p-4 pb-2">
          <span className="text-lg font-bold text-ink">
            {formatBudget(r.max_budget)}
            {r.operation === 'rent' && <span className="text-sm font-normal text-ink-light"> /mes</span>}
          </span>
          <h3 className="line-clamp-2 text-sm font-semibold text-ink">{title}</h3>
          <p className="text-xs text-ink-light">
            {typeLabel} · {r.district}
          </p>

          <div className="mt-1 flex items-center gap-4 text-xs text-ink-light">
            {r.min_area_m2 != null && (
              <span className="flex items-center gap-1">
                <Ruler size={13} /> {r.min_area_m2}+ m²
              </span>
            )}
            {r.bedrooms != null && (
              <span className="flex items-center gap-1">
                <BedDouble size={13} /> {r.bedrooms}+
              </span>
            )}
            {r.bathrooms != null && (
              <span className="flex items-center gap-1">
                <Bath size={13} /> {r.bathrooms}+
              </span>
            )}
          </div>

          <p className="flex items-center gap-1.5 text-xs font-semibold text-brand">
            <Calendar size={13} /> {expectedDatePhrase(r.urgency)}
          </p>
        </div>
      </Link>

      <div className="flex items-center gap-2 px-4 pb-4 pt-1">
        <Link to={`/requerimientos/${r.id}`} className="flex-1">
          <button className="flex h-9 w-full items-center justify-center gap-1.5 rounded-input bg-brand text-sm font-semibold text-white hover:bg-brand-hover">
            Ver requerimiento
          </button>
        </Link>
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
    </div>
  );
}
