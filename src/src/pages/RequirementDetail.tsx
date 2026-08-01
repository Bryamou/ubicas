import { useEffect, useState, type ReactNode } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { MapPin, BedDouble, Bath, Ruler, Car, Calendar, MessageCircle, PawPrint, Heart, Users } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { getOrCreateConversation } from '@/hooks/useConversations';
import { getDistrictCoords } from '@/lib/limaDistricts';
import { Navbar } from '@/components/Navbar';
import { PropertyMapView } from '@/components/PropertyMapView';
import { RequirementIllustration } from '@/components/RequirementIllustration';
import { LoadingState } from '@/components/ui/LoadingState';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Button } from '@/components/ui/Button';
import {
  requirementTypeLabels,
  formatBudget,
  publishedLabel,
  expectedDatePhrase,
  urgencyLabel,
  getRequirementBadge,
} from '@/lib/requirementHelpers';
import type { Requirement } from '@/types/database';

export function RequirementDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [requirement, setRequirement] = useState<Requirement | null>(null);
  const [loading, setLoading] = useState(true);
  const [contacting, setContacting] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [savingFavorite, setSavingFavorite] = useState(false);

  useEffect(() => {
    if (!id) return;
    (async () => {
      setLoading(true);
      const { data } = await supabase.from('requirements').select('*').eq('id', id).single();
      setRequirement((data as Requirement) ?? null);

      if (user) {
        const { data: fav } = await supabase
          .from('favorites')
          .select('id')
          .eq('requirement_id', id)
          .eq('user_id', user.id)
          .maybeSingle();
        setIsFavorite(!!fav);
      }
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const toggleFavorite = async () => {
    if (!user || !requirement) {
      navigate('/login');
      return;
    }
    setSavingFavorite(true);
    if (isFavorite) {
      await supabase.from('favorites').delete().eq('requirement_id', requirement.id).eq('user_id', user.id);
    } else {
      await supabase.from('favorites').insert({ requirement_id: requirement.id, user_id: user.id });
    }
    setIsFavorite(!isFavorite);
    setSavingFavorite(false);
  };

  const handleContact = async () => {
    if (!requirement) return;
    if (!user) {
      navigate('/login', { state: { from: location.pathname } });
      return;
    }
    if (requirement.buyer_id === user.id) return;
    setContacting(true);
    const { id: conversationId } = await getOrCreateConversation(user.id, requirement.buyer_id, null);
    setContacting(false);
    if (conversationId) navigate(`/mensajes?conversation=${conversationId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-muted">
        <Navbar />
        <LoadingState label="Cargando cliente…" />
      </div>
    );
  }

  if (!requirement) {
    return (
      <div className="min-h-screen bg-surface-muted">
        <Navbar />
        <div className="py-24 text-center text-sm text-ink-light">No encontramos este requerimiento.</div>
      </div>
    );
  }

  const r = requirement;
  const badge = getRequirementBadge(r);
  const coords = r.lat != null && r.lng != null ? { lat: r.lat, lng: r.lng } : getDistrictCoords(r.district);
  const typeLabel = requirementTypeLabels[r.property_type] ?? r.property_type;

  return (
    <div className="min-h-screen bg-surface-muted">
      <Navbar />
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        {/* "Galería": ilustración, misma estructura que la ficha de inmueble */}
        <div className="overflow-hidden rounded-card border border-border bg-white">
          <div className="aspect-video w-full">
            <RequirementIllustration />
          </div>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          <div className="flex flex-col gap-6 lg:col-span-2">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-surface-muted px-2.5 py-1 text-xs font-semibold text-ink">
                  {r.operation === 'sale' ? 'Compra' : 'Alquiler'}
                </span>
                <span className="flex items-center gap-1 rounded-full bg-brand-soft px-2.5 py-1 text-xs font-semibold text-brand">
                  <Users size={12} /> Cliente
                </span>
                {badge && <StatusBadge label={badge.label} tone={badge.tone} />}
              </div>
              <h1 className="mt-2 flex items-center gap-2 text-2xl font-extrabold text-ink">
                <MapPin size={20} className="text-brand" /> {r.district}
              </h1>
              <p className="mt-1 text-sm text-ink-light">{publishedLabel(r.created_at)}</p>
              <p className="mt-3 text-3xl font-extrabold text-brand">
                Hasta {formatBudget(r.max_budget)}
                {r.operation === 'rent' && <span className="text-base font-normal text-ink-light"> /mes</span>}
              </p>
              <p className="text-xs text-ink-light">Presupuesto máximo</p>
            </div>

            {/* Características */}
            <div className="grid grid-cols-2 gap-3 rounded-card border border-border bg-white p-4 shadow-card sm:grid-cols-4">
              <Feature label="Tipo" value={typeLabel} />
              {r.min_area_m2 != null && <Feature label="Área mín." value={`${r.min_area_m2} m²`} icon={<Ruler size={18} />} />}
              {r.bedrooms != null && <Feature label="Dormitorios" value={`${r.bedrooms}+`} icon={<BedDouble size={18} />} />}
              {r.bathrooms != null && <Feature label="Baños" value={`${r.bathrooms}+`} icon={<Bath size={18} />} />}
              {r.parking && <Feature label="Cochera" value="Sí" icon={<Car size={18} />} />}
              {r.pets && <Feature label="Mascotas" value="Sí" icon={<PawPrint size={18} />} />}
            </div>

            {/* Fecha esperada */}
            <div className="flex items-center gap-2 rounded-card border border-brand/30 bg-brand-soft p-4">
              <Calendar size={18} className="shrink-0 text-brand" />
              <div>
                <p className="text-sm font-semibold text-ink">{expectedDatePhrase(r.urgency)}</p>
                <p className="text-xs text-ink-light">Urgencia: {urgencyLabel(r.urgency)}</p>
              </div>
            </div>

            {/* Descripción completa */}
            {(r.description || r.extra_notes) && (
              <div>
                <h2 className="mb-2 text-lg font-bold text-ink">Descripción</h2>
                {r.description && <p className="whitespace-pre-line text-sm text-ink-light">{r.description}</p>}
                {r.extra_notes && (
                  <>
                    <h3 className="mt-3 text-sm font-semibold text-ink">Características adicionales</h3>
                    <p className="mt-1 whitespace-pre-line text-sm text-ink-light">{r.extra_notes}</p>
                  </>
                )}
              </div>
            )}

            {/* Mapa */}
            <div>
              <h2 className="mb-2 text-lg font-bold text-ink">Ubicación aproximada</h2>
              <PropertyMapView
                height="320px"
                properties={[
                  {
                    id: r.id,
                    title: r.district,
                    price: r.max_budget,
                    currency: 'PEN',
                    operation: r.operation,
                    district: r.district,
                    coverImageUrl: null,
                    ...coords,
                  },
                ]}
              />
            </div>
          </div>

          {/* Panel de contacto, igual que en la ficha de inmueble */}
          <aside className="h-fit rounded-card border border-border bg-white p-5 shadow-card">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-soft text-brand">
                <Users size={20} />
              </div>
              <div>
                <p className="text-sm font-semibold text-ink">Cliente interesado</p>
                <p className="text-xs text-ink-light">Publicado el {new Date(r.created_at).toLocaleDateString('es-PE')}</p>
              </div>
            </div>

            <div className="mt-4 flex flex-col gap-2">
              <Button variant="primary" icon={<MessageCircle size={16} />} fullWidth loading={contacting} onClick={handleContact}>
                Contactar cliente
              </Button>
              <Button
                variant={isFavorite ? 'primary' : 'neutral'}
                icon={<Heart size={16} fill={isFavorite ? 'currentColor' : 'none'} />}
                fullWidth
                disabled={savingFavorite}
                onClick={toggleFavorite}
              >
                {isFavorite ? 'En tus favoritos' : 'Guardar en favoritos'}
              </Button>
              {!user && (
                <p className="text-center text-xs text-ink-light">
                  <Link to="/login" className="font-semibold text-brand hover:underline">
                    Inicia sesión
                  </Link>{' '}
                  para contactar a esta persona.
                </p>
              )}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

function Feature({ label, value, icon }: { label: string; value: string; icon?: ReactNode }) {
  return (
    <div className="text-center">
      {icon && <div className="mx-auto mb-1 flex justify-center text-brand">{icon}</div>}
      <p className="text-sm font-bold text-ink">{value}</p>
      <p className="text-xs text-ink-light">{label}</p>
    </div>
  );
}
