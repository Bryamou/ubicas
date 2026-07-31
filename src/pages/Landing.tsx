import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search as SearchIcon, Home, Handshake, Check, Users } from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { HeroBackground } from '@/components/HeroBackground';
import { DistrictMultiSelect } from '@/components/DistrictMultiSelect';
import { MultiSelectDropdown } from '@/components/ui/MultiSelectDropdown';
import { PriceInput } from '@/components/PriceInput';
import { Carousel } from '@/components/Carousel';
import { FeaturedPropertyCard } from '@/components/ui/FeaturedPropertyCard';
import { SkeletonCard } from '@/components/ui/LoadingState';
import { supabase } from '@/lib/supabase';
import { getPublicImageUrl } from '@/lib/storage';
import { useAuth } from '@/contexts/AuthContext';
import type { Property } from '@/types/database';

interface FeaturedProperty extends Property {
  coverImageUrl: string | null;
}

type SearchMode = 'property' | 'requirement';

const propertyTypeOptions = [
  { value: 'apartment', label: 'Departamento' },
  { value: 'house', label: 'Casa' },
  { value: 'office', label: 'Oficina' },
  { value: 'land', label: 'Terreno' },
  { value: 'commercial', label: 'Local comercial' },
  { value: 'other', label: 'Otro' },
];

const selectClass = 'h-11 w-full rounded-input border border-border bg-white px-3 text-sm text-ink';

export function LandingPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [mode, setMode] = useState<SearchMode>('property');

  // Buscador (4 campos + botón, comparten estado según el modo activo)
  const [operation, setOperation] = useState('sale');
  const [types, setTypes] = useState<string[]>(propertyTypeOptions.map((o) => o.value));
  const [districts, setDistricts] = useState<string[]>([]);
  const [amount, setAmount] = useState<number | null>(null);

  const [featured, setFeatured] = useState<FeaturedProperty[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [loadingFeatured, setLoadingFeatured] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('properties')
        .select('*')
        .eq('status', 'published')
        .order('published_at', { ascending: false })
        .limit(8);

      const list = (data as Property[]) ?? [];
      if (list.length === 0) {
        setFeatured([]);
        setLoadingFeatured(false);
        return;
      }

      const { data: images } = await supabase
        .from('property_images')
        .select('property_id, storage_path, is_primary, sort_order')
        .in('property_id', list.map((p) => p.id))
        .order('sort_order', { ascending: true });

      const coverMap = new Map<string, string>();
      (images ?? []).forEach((img: any) => {
        if (!coverMap.has(img.property_id) || img.is_primary) {
          coverMap.set(img.property_id, img.storage_path);
        }
      });

      if (user) {
        const { data: favs } = await supabase
          .from('favorites')
          .select('property_id')
          .eq('user_id', user.id)
          .in('property_id', list.map((p) => p.id));
        setFavoriteIds(new Set((favs ?? []).map((f) => f.property_id)));
      }

      setFeatured(
        list.map((p) => ({
          ...p,
          coverImageUrl: coverMap.has(p.id) ? getPublicImageUrl(coverMap.get(p.id)!) : null,
        }))
      );
      setLoadingFeatured(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    params.set('operation', operation);
    if (types.length > 0 && types.length < propertyTypeOptions.length) {
      params.set('type', types.join(','));
    }
    if (districts.length > 0) params.set('district', districts.join(','));

    if (mode === 'property') {
      if (amount) {
        params.set('maxPrice', String(amount));
        params.set('currency', 'PEN');
      }
      navigate(`/inmuebles?${params.toString()}`);
    } else {
      if (amount) params.set('maxBudget', String(amount));
      navigate(`/requerimientos?${params.toString()}`);
    }
  };

  return (
    <div className="min-h-screen">
      <Navbar />

      {/* Hero + buscador */}
      <section className="relative bg-ink text-white">
        <HeroBackground />
        <div className="relative mx-auto max-w-content px-4 py-20 sm:px-6 lg:px-8">
          <h1 className="max-w-2xl text-4xl font-extrabold leading-tight sm:text-5xl">
            Comprar, vender y alquilar propiedades{' '}
            <span className="text-brand">nunca fue tan fácil</span>.
          </h1>

          <p className="mt-8 text-sm font-semibold uppercase tracking-[0.03em] text-white/70">
            ¿Qué deseas encontrar?
          </p>

          {/* Segmented control (selector de perfil) */}
          <div className="mt-3 inline-flex h-11 items-center rounded-full bg-white/10 p-1">
            <button
              type="button"
              onClick={() => setMode('property')}
              className={`flex h-full items-center gap-2 rounded-full px-4 text-sm font-semibold transition ${
                mode === 'property' ? 'bg-brand text-white' : 'text-white/70 hover:text-white'
              }`}
            >
              <Home size={15} /> Inmuebles
            </button>
            <button
              type="button"
              onClick={() => setMode('requirement')}
              className={`flex h-full items-center gap-2 rounded-full px-4 text-sm font-semibold transition ${
                mode === 'requirement' ? 'bg-brand text-white' : 'text-white/70 hover:text-white'
              }`}
            >
              <Users size={15} /> Clientes
            </button>
          </div>

          {/* Buscador: 4 campos + botón, en una sola fila en escritorio */}
          <form
            onSubmit={handleSearch}
            className="mt-4 grid gap-3 rounded-xl bg-white p-4 text-ink shadow-lg sm:grid-cols-2 lg:grid-cols-[0.8fr_0.8fr_1.6fr_0.9fr_auto]"
          >
            <select value={operation} onChange={(e) => setOperation(e.target.value)} className={selectClass}>
              {mode === 'property' ? (
                <>
                  <option value="sale">Comprar</option>
                  <option value="rent">Alquilar</option>
                </>
              ) : (
                <>
                  <option value="sale">Comprador</option>
                  <option value="rent">Inquilino</option>
                </>
              )}
            </select>

            <MultiSelectDropdown
              options={propertyTypeOptions}
              selected={types}
              onChange={setTypes}
              placeholder="Tipo de inmueble"
            />

            <DistrictMultiSelect
              selected={districts}
              onChange={setDistricts}
              placeholder={mode === 'property' ? 'Distrito o dirección' : 'Zona buscada por tu cliente'}
            />

            <PriceInput
              placeholder="Monto en S/"
              forceCurrency="PEN"
              onValueChange={(value) => setAmount(value)}
            />

            <button
              type="submit"
              className="flex items-center justify-center gap-2 rounded-input bg-brand px-5 py-2 text-sm font-semibold text-white hover:bg-brand-hover"
            >
              <SearchIcon size={16} /> Buscar
            </button>
          </form>
        </div>
      </section>

      {/* Cómo funciona: una plataforma, tres perfiles */}
      <section id="como-funciona" className="mx-auto max-w-content scroll-mt-28 px-4 py-16 sm:px-6 lg:px-8">
        <h2 className="text-2xl font-bold text-ink">Cómo funciona Ubicas</h2>
        <p className="mt-2 max-w-2xl text-sm text-ink-light">Una plataforma, tres perfiles.</p>

        <div className="mt-8 grid gap-6 sm:grid-cols-3">
          {/* Propietario */}
          <div className="flex flex-col rounded-card border border-border bg-white p-6 shadow-card">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-soft text-brand">
              <Home size={20} />
            </div>
            <h3 className="mt-4 font-semibold text-ink">Propietario</h3>
            <p className="mt-2 text-sm text-ink-light">
              Publica tu inmueble en venta o alquiler de forma gratuita y deja que Ubicas y sus agentes
              trabajen por ti.
            </p>
            <ul className="mt-3 flex flex-1 flex-col gap-2 text-sm text-ink-light">
              <li className="flex gap-2">
                <Check size={16} className="mt-0.5 shrink-0 text-success" />
                Publica gratis en minutos con el asistente guiado, sin límite de fotos
              </li>
              <li className="flex gap-2">
                <Check size={16} className="mt-0.5 shrink-0 text-success" />
                Recibe contactos, solicitudes de visita y propuestas de agentes verificados
              </li>
              <li className="flex gap-2">
                <Check size={16} className="mt-0.5 shrink-0 text-success" />
                Sigue vistas, contactos y desempeño de cada publicación desde tu panel
              </li>
              <li className="flex gap-2">
                <Check size={16} className="mt-0.5 shrink-0 text-success" />
                Tú decides con qué agente trabajar y mantienes el control de tu inmueble
              </li>
            </ul>
            <button
              onClick={() => navigate('/publicar-inmueble')}
              className="mt-5 text-left text-sm font-semibold text-brand hover:underline"
            >
              Publicar inmueble →
            </button>
          </div>

          {/* Agente inmobiliario */}
          <div className="flex flex-col rounded-card border border-border bg-white p-6 shadow-card">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-soft text-brand">
              <Handshake size={20} />
            </div>
            <h3 className="mt-4 font-semibold text-ink">Agente inmobiliario</h3>
            <p className="mt-2 text-sm text-ink-light">
              Haz crecer tu cartera y cierra más rápido conectando directamente con propietarios y
              clientes activos.
            </p>
            <ul className="mt-3 flex flex-1 flex-col gap-2 text-sm text-ink-light">
              <li className="flex gap-2">
                <Check size={16} className="mt-0.5 shrink-0 text-success" />
                Capta inmuebles directamente desde el marketplace, sin intermediarios
              </li>
              <li className="flex gap-2">
                <Check size={16} className="mt-0.5 shrink-0 text-success" />
                Envía propuestas de representación con tu comisión y presentación comercial
              </li>
              <li className="flex gap-2">
                <Check size={16} className="mt-0.5 shrink-0 text-success" />
                Descubre requerimientos activos de clientes que calzan con tu cartera
              </li>
              <li className="flex gap-2">
                <Check size={16} className="mt-0.5 shrink-0 text-success" />
                Administra captación, propuestas y colocación desde un solo panel
              </li>
            </ul>
            <button
              onClick={() => navigate('/requerimientos')}
              className="mt-5 text-left text-sm font-semibold text-brand hover:underline"
            >
              Ver requerimientos activos →
            </button>
          </div>

          {/* Cliente (comprador / arrendatario) */}
          <div className="flex flex-col rounded-card border border-border bg-white p-6 shadow-card">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-soft text-brand">
              <SearchIcon size={20} />
            </div>
            <h3 className="mt-4 font-semibold text-ink">Cliente</h3>
            <p className="mt-2 text-sm text-ink-light">
              Publica lo que buscas y que las propuestas lleguen a ti, en vez de repetir la búsqueda
              manualmente.
            </p>
            <ul className="mt-3 flex flex-1 flex-col gap-2 text-sm text-ink-light">
              <li className="flex gap-2">
                <Check size={16} className="mt-0.5 shrink-0 text-success" />
                Busca inmuebles publicados por propietarios directos o agentes verificados
              </li>
              <li className="flex gap-2">
                <Check size={16} className="mt-0.5 shrink-0 text-success" />
                Publica tu requerimiento una vez y recibe ofertas directas que calzan con lo que buscas
              </li>
              <li className="flex gap-2">
                <Check size={16} className="mt-0.5 shrink-0 text-success" />
                Guarda favoritos, contacta y agenda visitas sin intermediarios innecesarios
              </li>
              <li className="flex gap-2">
                <Check size={16} className="mt-0.5 shrink-0 text-success" />
                Sigue el estado de tus contactos y propuestas desde un panel personal
              </li>
            </ul>
            <button
              onClick={() => navigate('/publicar-requerimiento')}
              className="mt-5 text-left text-sm font-semibold text-brand hover:underline"
            >
              Publicar requerimiento →
            </button>
          </div>
        </div>
      </section>

      {/* Inmuebles destacados */}
      {(loadingFeatured || featured.length > 0) && (
        <section className="mx-auto max-w-content px-4 py-16 sm:px-6 lg:px-8">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-ink">Inmuebles destacados</h2>
            <button onClick={() => navigate('/inmuebles')} className="text-sm font-semibold text-brand hover:underline">
              Ver todos
            </button>
          </div>

          {loadingFeatured ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : (
            <Carousel autoplayMs={5000}>
              {featured.map((p) => (
                <FeaturedPropertyCard
                  key={p.id}
                  property={p}
                  coverImageUrl={p.coverImageUrl}
                  initialFavorite={favoriteIds.has(p.id)}
                />
              ))}
            </Carousel>
          )}
        </section>
      )}
    </div>
  );
}
