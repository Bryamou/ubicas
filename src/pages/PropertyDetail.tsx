import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Heart, MessageCircle, CalendarCheck, MapPin, ShieldCheck, User } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { getPublicImageUrl } from '@/lib/storage';
import { getDistrictCoords } from '@/lib/limaDistricts';
import { PropertyMapView } from '@/components/PropertyMapView';
import { ContactRequestModal } from '@/components/ContactRequestModal';
import { getContactedPropertyIds } from '@/lib/guestContact';
import { useAuth } from '@/contexts/AuthContext';
import { Navbar } from '@/components/Navbar';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Alert } from '@/components/ui/Alert';
import { LoadingState } from '@/components/ui/LoadingState';
import { StatusBadge } from '@/components/ui/StatusBadge';
import type { Property } from '@/types/database';

const typeLabels: Record<string, string> = {
  apartment: 'Departamento',
  house: 'Casa',
  office: 'Oficina',
  land: 'Terreno',
  commercial: 'Local comercial',
  other: 'Otro',
};

const availabilityLabel: Record<string, string> = {
  published: 'Disponible',
  sold: 'Vendido',
  rented: 'Alquilado',
  paused: 'No disponible por ahora',
  closed: 'Publicación cerrada',
  draft: 'Borrador',
};

function formatPrice(property: Property) {
  const symbol = property.currency === 'USD' ? 'US$' : 'S/';
  return `${symbol} ${property.price.toLocaleString('es-PE')}`;
}

export function PropertyDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user, profile } = useAuth();

  const [property, setProperty] = useState<Property | null>(null);
  const [images, setImages] = useState<string[]>([]);
  const [features, setFeatures] = useState<string[]>([]);
  const [activeImage, setActiveImage] = useState(0);
  const [contactName, setContactName] = useState<{ name: string; isAgent: boolean } | null>(null);
  const [loading, setLoading] = useState(true);

  const [isFavorite, setIsFavorite] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);
  const [contacted, setContacted] = useState(false);
  const [visitOpen, setVisitOpen] = useState(false);
  const [visitDate, setVisitDate] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!id) return;

    (async () => {
      setLoading(true);

      const { data: propertyData } = await supabase.from('properties').select('*').eq('id', id).single();
      if (!propertyData) {
        setLoading(false);
        return;
      }
      setProperty(propertyData);

      const [{ data: imageRows }, { data: featureRows }, { data: assignment }] = await Promise.all([
        supabase
          .from('property_images')
          .select('storage_path, sort_order, is_primary')
          .eq('property_id', id)
          .order('sort_order', { ascending: true }),
        supabase.from('property_features').select('feature').eq('property_id', id),
        supabase
          .from('property_agent_assignments')
          .select('agent:profiles!property_agent_assignments_agent_id_fkey(full_name)')
          .eq('property_id', id)
          .maybeSingle(),
      ]);

      setImages((imageRows ?? []).map((img) => getPublicImageUrl(img.storage_path)));
      setFeatures((featureRows ?? []).map((f) => f.feature));

      if ((assignment as any)?.agent) {
        setContactName({ name: (assignment as any).agent.full_name, isAgent: true });
      } else {
        setContactName({ name: propertyData.contact_name ?? 'Propietario', isAgent: false });
      }

      // Registrar vista (una por visitante/sesión, mejor esfuerzo)
      await supabase.from('property_views').insert({
        property_id: id,
        viewer_id: user?.id ?? null,
      });

      if (user) {
        const { data: fav } = await supabase
          .from('favorites')
          .select('id')
          .eq('property_id', id)
          .eq('user_id', user.id)
          .maybeSingle();
        setIsFavorite(!!fav);

        const { data: existingContact } = await supabase
          .from('contact_requests')
          .select('id')
          .eq('property_id', id)
          .eq('requester_id', user.id)
          .maybeSingle();
        setContacted(!!existingContact);
      } else {
        setContacted(getContactedPropertyIds().has(id));
      }

      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const toggleFavorite = async () => {
    if (!user || !property) return;
    if (isFavorite) {
      await supabase.from('favorites').delete().eq('property_id', property.id).eq('user_id', user.id);
    } else {
      await supabase.from('favorites').insert({ property_id: property.id, user_id: user.id });
    }
    setIsFavorite(!isFavorite);
  };

  const submitVisit = async () => {
    if (!user || !property || !visitDate) return;
    setSaving(true);
    const { error } = await supabase.from('visit_requests').insert({
      property_id: property.id,
      requester_id: user.id,
      proposed_date: new Date(visitDate).toISOString(),
    });
    setSaving(false);
    if (!error) {
      setFeedback('Tu solicitud de visita fue enviada. Te notificaremos cuando sea respondida.');
      setVisitOpen(false);
      setVisitDate('');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-muted">
        <Navbar />
        <LoadingState label="Cargando inmueble…" />
      </div>
    );
  }

  if (!property) {
    return (
      <div className="min-h-screen bg-surface-muted">
        <Navbar />
        <div className="py-24 text-center text-sm text-ink-light">No encontramos este inmueble.</div>
      </div>
    );
  }

  const isBuyer = profile?.role === 'buyer';

  return (
    <div className="min-h-screen bg-surface-muted">
      <Navbar />
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        {feedback && (
          <div className="mb-4">
            <Alert type="success">{feedback}</Alert>
          </div>
        )}

        <div className="overflow-hidden rounded-card border border-border bg-white">
          <div className="aspect-video w-full bg-surface-muted">
            {images.length > 0 ? (
              <img src={images[activeImage]} alt={property.title} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-ink-light">Sin fotos disponibles</div>
            )}
          </div>
          {images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto p-3">
              {images.map((url, i) => (
                <button
                  key={url}
                  onClick={() => setActiveImage(i)}
                  className={`h-16 w-20 shrink-0 overflow-hidden rounded-input border-2 ${
                    i === activeImage ? 'border-brand' : 'border-transparent'
                  }`}
                >
                  <img src={url} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          <div className="flex flex-col gap-6 lg:col-span-2">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-surface-muted px-2.5 py-1 text-xs font-semibold text-ink">
                  {property.operation === 'sale' ? 'Venta' : 'Alquiler'}
                </span>
                <StatusBadge
                  label={availabilityLabel[property.status] ?? property.status}
                  tone={property.status === 'published' ? 'success' : 'neutral'}
                />
              </div>
              <h1 className="mt-2 text-2xl font-extrabold text-ink">{property.title}</h1>
              <p className="mt-1 flex items-center gap-1 text-sm text-ink-light">
                <MapPin size={14} />
                {property.hide_exact_address ? property.district : property.address || property.district}
              </p>
              <p className="mt-3 text-3xl font-extrabold text-brand">
                {formatPrice(property)}
                {property.operation === 'rent' && <span className="text-base font-normal text-ink-light"> /mes</span>}
              </p>
              {property.negotiable && <p className="text-xs text-ink-light">Precio negociable</p>}
            </div>

            <div className="grid grid-cols-2 gap-3 rounded-card border border-border bg-white p-4 shadow-card sm:grid-cols-4">
              {property.area_m2 && <Feature label="Área" value={`${property.area_m2} m²`} />}
              {property.bedrooms != null && <Feature label="Dormitorios" value={property.bedrooms} />}
              {property.bathrooms != null && <Feature label="Baños" value={property.bathrooms} />}
              {property.parking_spots != null && <Feature label="Cocheras" value={property.parking_spots} />}
              {property.floor_number != null && <Feature label="Piso" value={property.floor_number} />}
              {property.age_years != null && <Feature label="Antigüedad" value={`${property.age_years} años`} />}
              {property.furnished != null && <Feature label="Amoblado" value={property.furnished ? 'Sí' : 'No'} />}
              {property.pets_allowed != null && <Feature label="Mascotas" value={property.pets_allowed ? 'Permitidas' : 'No permitidas'} />}
            </div>

            <div>
              <h2 className="mb-2 text-lg font-bold text-ink">Descripción</h2>
              <p className="whitespace-pre-line text-sm text-ink-light">{property.description}</p>
              {property.highlights && (
                <div className="mt-3">
                  <h3 className="text-sm font-semibold text-ink">Puntos destacados</h3>
                  <p className="whitespace-pre-line text-sm text-ink-light">{property.highlights}</p>
                </div>
              )}
            </div>

            {features.length > 0 && (
              <div>
                <h2 className="mb-2 text-lg font-bold text-ink">Amenidades</h2>
                <div className="flex flex-wrap gap-2">
                  {features.map((f) => (
                    <span key={f} className="rounded-full bg-surface-muted px-3 py-1 text-xs font-medium text-ink">
                      {f}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <PropertyMapView
              height="320px"
              properties={[
                {
                  id: property.id,
                  title: property.title,
                  price: property.price,
                  currency: property.currency,
                  operation: property.operation,
                  district: property.district,
                  coverImageUrl: images[0] ?? null,
                  ...(property.lat != null && property.lng != null
                    ? { lat: property.lat, lng: property.lng }
                    : getDistrictCoords(property.district)),
                },
              ]}
            />
          </div>

          <aside className="h-fit rounded-card border border-border bg-white p-5 shadow-card">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-soft text-brand">
                {contactName?.isAgent ? <ShieldCheck size={20} /> : <User size={20} />}
              </div>
              <div>
                <p className="text-sm font-semibold text-ink">{contactName?.name}</p>
                <p className="text-xs text-ink-light">
                  {contactName?.isAgent ? 'Agente verificado' : 'Propietario directo'}
                </p>
              </div>
            </div>

            <div className="mt-4 flex flex-col gap-2">
              {user ? (
                <>
                  <Button
                    variant={contacted ? 'secondary' : 'primary'}
                    icon={<MessageCircle size={16} />}
                    fullWidth
                    onClick={() => setContactOpen(true)}
                  >
                    {contacted ? 'Ver contacto' : 'Contactar'}
                  </Button>
                  <Button variant="secondary" icon={<CalendarCheck size={16} />} fullWidth onClick={() => setVisitOpen(true)}>
                    Solicitar visita
                  </Button>
                  <Button
                    variant={isFavorite ? 'primary' : 'neutral'}
                    icon={<Heart size={16} fill={isFavorite ? 'currentColor' : 'none'} />}
                    fullWidth
                    onClick={toggleFavorite}
                  >
                    {isFavorite ? 'En tus favoritos' : 'Guardar en favoritos'}
                  </Button>
                  {!isBuyer && <p className="text-xs text-ink-light">Cualquier rol puede contactar y guardar favoritos.</p>}
                </>
              ) : (
                <>
                  <Button
                    variant={contacted ? 'secondary' : 'primary'}
                    icon={<MessageCircle size={16} />}
                    fullWidth
                    onClick={() => setContactOpen(true)}
                  >
                    {contacted ? 'Ver contacto' : 'Contactar'}
                  </Button>
                  <p className="text-center text-xs text-ink-light">
                    ¿Ya tienes cuenta?{' '}
                    <Link to="/login" className="font-semibold text-brand hover:underline">
                      Inicia sesión
                    </Link>{' '}
                    para guardar favoritos y solicitar visitas.
                  </p>
                </>
              )}
            </div>

            <p className="mt-4 text-xs text-ink-light">
              Tipo: {typeLabels[property.property_type] ?? property.property_type}
              {property.published_at && (
                <> · Publicado el {new Date(property.published_at).toLocaleDateString('es-PE')}</>
              )}
            </p>
          </aside>
        </div>
      </div>

      <ContactRequestModal
        open={contactOpen}
        onClose={() => setContactOpen(false)}
        property={property}
        alreadyContacted={contacted}
        onContacted={() => setContacted(true)}
      />

      <Modal
        open={visitOpen}
        onClose={() => setVisitOpen(false)}
        title="Solicitar visita"
        footer={
          <Button variant="primary" onClick={submitVisit} loading={saving} disabled={!visitDate}>
            Enviar solicitud
          </Button>
        }
      >
        <Input
          label="Fecha y hora propuesta"
          type="datetime-local"
          value={visitDate}
          onChange={(e) => setVisitDate(e.target.value)}
        />
      </Modal>
    </div>
  );
}

function Feature({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="text-center">
      <p className="text-base font-bold text-ink">{value}</p>
      <p className="text-xs text-ink-light">{label}</p>
    </div>
  );
}
