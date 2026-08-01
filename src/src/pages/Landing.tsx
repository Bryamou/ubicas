import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search as SearchIcon, Home, Handshake, Check, Users, Lightbulb } from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { HeroBackground } from '@/components/HeroBackground';
import { ZoneMultiSelect } from '@/components/ZoneMultiSelect';
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

const selectClass = 'h-11 w-full rounded-input border border-border bg-white px-3 text-sm text-ink';

export function LandingPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [mode, setMode] = useState<SearchMode>('property');

  // Buscador del Hero: solo operación + zona
  const [operation, setOperation] = useState('sale');
  const [districts, setDistricts] = useState<string[]>([]);

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
    if (districts.length > 0) params.set('district', districts.join(','));

    if (mode === 'property') {
      navigate(`/inmuebles?${params.toString()}`);
    } else {
      navigate(`/requerimientos?${params.toString()}`);
    }
  };

  return (
    <div className="min-h-screen">
      <Navbar />

      {/* Hero + buscador */}
      <section className="relative bg-ink text-white">
        <HeroBackground />
        <div className="relative mx-auto flex max-w-content flex-col items-center px-4 py-28 text-center sm:px-6 lg:px-8">
          <h1 className="text-4xl font-extrabold leading-tight sm:text-5xl">¿Qué estás buscando?</h1>

          {/* Selector de perfil: busco inmuebles o busco clientes, cada uno
              con su propio texto explicativo debajo. Mismo tamaño fijo
              para ambos, sin importar el largo del texto. */}
          <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:gap-5">
            <button
              type="button"
              onClick={() => setMode('property')}
              className={`flex w-full flex-col items-center gap-1.5 rounded-card border-2 px-6 py-4 text-center transition sm:w-64 ${
                mode === 'property' ? 'border-brand bg-brand/10' : 'border-white/20 hover:border-white/40'
              }`}
            >
              <span className="flex items-center gap-2 text-base font-bold">
                <Home size={18} /> Inmuebles
              </span>
              <span className="flex min-h-[2.5rem] items-center text-sm text-white/70">Propiedades para comprar o alquilar.</span>
            </button>

            <button
              type="button"
              onClick={() => setMode('requirement')}
              className={`flex w-full flex-col items-center gap-1.5 rounded-card border-2 px-6 py-4 text-center transition sm:w-64 ${
                mode === 'requirement' ? 'border-brand bg-brand/10' : 'border-white/20 hover:border-white/40'
              }`}
            >
              <span className="flex items-center gap-2 text-base font-bold">
                <Users size={18} /> Clientes
              </span>
              <span className="flex min-h-[2.5rem] items-center text-sm text-white/70">Personas que buscan comprar o alquilar un inmueble</span>
            </button>
          </div>

          {/* Buscador: solo operación + zona, según lo pedido */}
          <form
            onSubmit={handleSearch}
            className="mt-6 grid w-full gap-3 rounded-xl bg-white p-4 text-left text-ink shadow-lg sm:grid-cols-[0.6fr_1.6fr_auto]"
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

            <ZoneMultiSelect
              selected={districts}
              onChange={setDistricts}
              placeholder={mode === 'property' ? 'Ingresa departamentos o distritos' : 'Zona buscada por tu cliente'}
            />

            <button
              type="submit"
              className="flex h-11 items-center justify-center gap-2 self-start rounded-input bg-brand px-5 text-sm font-semibold text-white hover:bg-brand-hover"
            >
              <SearchIcon size={16} /> Buscar
            </button>
          </form>
        </div>
      </section>

      {/* Cómo funciona: según la referencia visual "En Ubicas puedo:" */}
      <section id="como-funciona" className="mx-auto max-w-content scroll-mt-28 px-4 py-16 sm:px-6 lg:px-8">
        <h2 className="flex items-center gap-2 text-2xl font-bold text-ink">
          <Lightbulb size={22} className="text-brand" /> En <span className="text-brand">Ubicas</span> puedo:
        </h2>

        <div className="mt-10 grid gap-10 sm:grid-cols-3">
          {/* Propietario */}
          <div className="flex flex-col items-center text-center">
            <div className="relative flex h-20 w-20 items-center justify-center rounded-full border-2 border-brand/20 bg-brand-soft">
              <Home size={30} className="text-brand" />
              <span className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-success text-white">
                <Check size={13} />
              </span>
            </div>
            <p className="mt-3 text-sm font-semibold text-ink">
              Soy dueño de <br /> una Propiedad
            </p>

            <ul className="mt-5 flex flex-col gap-3 text-left text-sm text-ink-light">
              <li>
                <strong className="text-ink">Elegir un agente</strong> para correr mi propiedad.
              </li>
              <li>
                <strong className="text-ink">Recibir propuestas</strong> de compradores directos.
              </li>
              <li>
                <strong className="text-ink">Publicar mi propiedad</strong> para ser vista en público o solo para
                agentes.
              </li>
            </ul>
          </div>

          {/* Agente inmobiliario */}
          <div className="flex flex-col items-center text-center">
            <div className="relative flex h-20 w-20 items-center justify-center rounded-full border-2 border-brand/20 bg-brand-soft">
              <Handshake size={30} className="text-brand" />
              <span className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-success text-white">
                <Check size={13} />
              </span>
            </div>
            <p className="mt-3 text-sm font-semibold text-ink">
              Soy <br /> Agente Inmobiliario
            </p>

            <ul className="mt-5 flex flex-col gap-3 text-left text-sm text-ink-light">
              <li>
                <strong className="text-ink">Captar inmuebles</strong> con solo un clic.
              </li>
              <li>
                <strong className="text-ink">Publicar mi cartera</strong> de propiedades y compradores.
              </li>
              <li>
                <strong className="text-ink">Negociar</strong> con otros agentes inmobiliarios.
              </li>
              <li>
                <strong className="text-ink">Buscar compradores</strong> que necesiten una propiedad de mi cartera.
              </li>
            </ul>
          </div>

          {/* Busco un inmueble */}
          <div className="flex flex-col items-center text-center">
            <div className="relative flex h-20 w-20 items-center justify-center rounded-full border-2 border-brand/20 bg-brand-soft">
              <SearchIcon size={30} className="text-brand" />
              <span className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-success text-white">
                <Check size={13} />
              </span>
            </div>
            <p className="mt-3 text-sm font-semibold text-ink">
              Busco un <br /> inmueble
            </p>

            <ul className="mt-5 flex flex-col gap-3 text-left text-sm text-ink-light">
              <li>
                <strong className="text-ink">Publicar mi necesidad</strong> de búsqueda.
              </li>
              <li>
                <strong className="text-ink">Recibir propuestas</strong> de propiedades.
              </li>
              <li>
                <strong className="text-ink">Buscar</strong> inmuebles.
              </li>
              <li>
                <strong className="text-ink">Encontrar un agente</strong> que me ayude con la búsqueda.
              </li>
            </ul>
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
