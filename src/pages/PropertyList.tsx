import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, List, Map as MapIcon, SlidersHorizontal } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { getPublicImageUrl } from '@/lib/storage';
import { getDistrictCoords } from '@/lib/limaDistricts';
import { Navbar } from '@/components/Navbar';
import { PropertyCard } from '@/components/ui/PropertyCard';
import { PropertyMapView } from '@/components/PropertyMapView';
import { SkeletonCard } from '@/components/ui/LoadingState';
import { EmptyState } from '@/components/ui/EmptyState';
import { Select } from '@/components/ui/Select';
import { MultiSelectDropdown } from '@/components/ui/MultiSelectDropdown';
import { DistrictMultiSelect } from '@/components/DistrictMultiSelect';
import { PriceInput } from '@/components/PriceInput';
import { Drawer } from '@/components/ui/Drawer';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import type { OperationType, Property, PropertyType } from '@/types/database';

interface PropertyWithCover extends Property {
  coverImageUrl: string | null;
  isAgentListed: boolean;
  viewsCount?: number;
}

const propertyTypeOptions = [
  { value: 'apartment', label: 'Departamento' },
  { value: 'house', label: 'Casa' },
  { value: 'office', label: 'Oficina' },
  { value: 'land', label: 'Terreno' },
  { value: 'commercial', label: 'Local comercial' },
  { value: 'other', label: 'Otro' },
];

const AMENITIES = ['Ascensor', 'Seguridad', 'Áreas verdes', 'Piscina', 'Gimnasio', 'Terraza', 'Depósito', 'Otros'];

const sortOptions = [
  { value: 'relevant', label: 'Relevantes' },
  { value: 'recent', label: 'Recientes' },
  { value: 'price_asc', label: 'Menor precio' },
  { value: 'price_desc', label: 'Mayor precio' },
  { value: 'most_viewed', label: 'Más vistos' },
  { value: 'price_drop', label: 'Bajaron de precio' },
];

const publishedWithinOptions = [
  { value: '', label: 'Cualquier momento' },
  { value: '1', label: 'Últimas 24 horas' },
  { value: '7', label: 'Última semana' },
  { value: '30', label: 'Último mes' },
];

export function PropertyListPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [properties, setProperties] = useState<PropertyWithCover[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [filtersOpen, setFiltersOpen] = useState(false);

  const operation = searchParams.get('operation') ?? 'all';
  const typeParam = searchParams.get('type') ?? '';
  const selectedTypes = typeParam ? typeParam.split(',') : propertyTypeOptions.map((o) => o.value);
  const districtParam = searchParams.get('district') ?? '';
  const selectedDistricts = districtParam ? districtParam.split(',') : [];
  const maxPrice = searchParams.get('maxPrice') ?? '';
  const minPrice = searchParams.get('minPrice') ?? '';
  const priceCurrency = searchParams.get('currency') ?? '';
  const bedrooms = searchParams.get('bedrooms') ?? '';

  // Más filtros
  const bathrooms = searchParams.get('bathrooms') ?? '';
  const parking = searchParams.get('parking') ?? '';
  const areaMin = searchParams.get('areaMin') ?? '';
  const areaMax = searchParams.get('areaMax') ?? '';
  const maxAge = searchParams.get('maxAge') ?? '';
  const publishedWithin = searchParams.get('publishedWithin') ?? '';
  const amenitiesParam = searchParams.get('amenities') ?? '';
  const selectedAmenities = amenitiesParam ? amenitiesParam.split(',') : [];

  const sort = searchParams.get('sort') ?? 'relevant';

  // Estado local del panel "Más filtros" (se aplica recién al dar "Ver resultados")
  const [draftBathrooms, setDraftBathrooms] = useState(bathrooms);
  const [draftParking, setDraftParking] = useState(parking);
  const [draftAreaMin, setDraftAreaMin] = useState(areaMin);
  const [draftAreaMax, setDraftAreaMax] = useState(areaMax);
  const [draftMaxAge, setDraftMaxAge] = useState(maxAge);
  const [draftPublishedWithin, setDraftPublishedWithin] = useState(publishedWithin);
  const [draftAmenities, setDraftAmenities] = useState<string[]>(selectedAmenities);

  const openFilters = () => {
    setDraftBathrooms(bathrooms);
    setDraftParking(parking);
    setDraftAreaMin(areaMin);
    setDraftAreaMax(areaMax);
    setDraftMaxAge(maxAge);
    setDraftPublishedWithin(publishedWithin);
    setDraftAmenities(selectedAmenities);
    setFiltersOpen(true);
  };

  const applyFilters = () => {
    const next = new URLSearchParams(searchParams);
    const setOrDelete = (key: string, value: string) => (value ? next.set(key, value) : next.delete(key));
    setOrDelete('bathrooms', draftBathrooms);
    setOrDelete('parking', draftParking);
    setOrDelete('areaMin', draftAreaMin);
    setOrDelete('areaMax', draftAreaMax);
    setOrDelete('maxAge', draftMaxAge);
    setOrDelete('publishedWithin', draftPublishedWithin);
    setOrDelete('amenities', draftAmenities.join(','));
    setSearchParams(next);
    setFiltersOpen(false);
  };

  const clearFilters = () => {
    setDraftBathrooms('');
    setDraftParking('');
    setDraftAreaMin('');
    setDraftAreaMax('');
    setDraftMaxAge('');
    setDraftPublishedWithin('');
    setDraftAmenities([]);
  };

  const activeExtraFiltersCount = [bathrooms, parking, areaMin, areaMax, maxAge, publishedWithin].filter(Boolean)
    .length + (selectedAmenities.length > 0 ? 1 : 0);

  const setParam = (key: string, value: string | string[]) => {
    const next = new URLSearchParams(searchParams);
    const joined = Array.isArray(value) ? value.join(',') : value;
    if (!joined) next.delete(key);
    else next.set(key, joined);
    setSearchParams(next);
  };

  useEffect(() => {
    (async () => {
      setLoading(true);

      let query = supabase.from('properties').select('*').eq('status', 'published');

      if (operation !== 'all') query = query.eq('operation', operation as OperationType);
      if (selectedTypes.length > 0 && selectedTypes.length < propertyTypeOptions.length) {
        query = query.in('property_type', selectedTypes as PropertyType[]);
      }
      if (selectedDistricts.length > 0) query = query.in('district', selectedDistricts);
      if (maxPrice) query = query.lte('price', Number(maxPrice));
      if (minPrice) query = query.gte('price', Number(minPrice));
      if (priceCurrency) query = query.eq('currency', priceCurrency);
      if (bedrooms) query = query.gte('bedrooms', Number(bedrooms));
      if (bathrooms) query = query.gte('bathrooms', Number(bathrooms));
      if (parking) query = query.gte('parking_spots', Number(parking));
      if (areaMin) query = query.gte('area_m2', Number(areaMin));
      if (areaMax) query = query.lte('area_m2', Number(areaMax));
      if (maxAge) query = query.lte('age_years', Number(maxAge));
      if (publishedWithin) {
        const since = new Date(Date.now() - Number(publishedWithin) * 24 * 60 * 60 * 1000).toISOString();
        query = query.gte('published_at', since);
      }
      if (sort === 'price_drop') query = query.not('original_price', 'is', null);

      // Filtro por amenidades: primero resolvemos qué inmuebles las tienen
      if (selectedAmenities.length > 0) {
        const { data: featureRows } = await supabase
          .from('property_features')
          .select('property_id')
          .in('feature', selectedAmenities);
        const matchingIds = [...new Set((featureRows ?? []).map((f) => f.property_id))];
        if (matchingIds.length === 0) {
          setProperties([]);
          setLoading(false);
          return;
        }
        query = query.in('id', matchingIds);
      }

      // Orden a nivel de base de datos cuando es posible
      if (sort === 'price_asc') query = query.order('price', { ascending: true });
      else if (sort === 'price_desc') query = query.order('price', { ascending: false });
      else if (sort === 'recent') query = query.order('created_at', { ascending: false });
      else query = query.order('published_at', { ascending: false });

      const { data } = await query;
      let list = (data as Property[]) ?? [];

      if (sort === 'price_drop') {
        list = list.filter((p) => p.original_price != null && p.original_price > p.price);
        list.sort((a, b) => (b.original_price! - b.price) - (a.original_price! - a.price));
      }

      if (list.length === 0) {
        setProperties([]);
        setLoading(false);
        return;
      }

      const ids = list.map((p) => p.id);
      const [{ data: images }, { data: assignments }, { data: views }] = await Promise.all([
        supabase
          .from('property_images')
          .select('property_id, storage_path, is_primary, sort_order')
          .in('property_id', ids)
          .order('sort_order', { ascending: true }),
        supabase.from('property_agent_assignments').select('property_id').in('property_id', ids),
        sort === 'most_viewed'
          ? supabase.from('property_views').select('property_id').in('property_id', ids)
          : Promise.resolve({ data: null }),
      ]);

      const coverMap = new Map<string, string>();
      (images ?? []).forEach((img: any) => {
        if (!coverMap.has(img.property_id) || img.is_primary) {
          coverMap.set(img.property_id, img.storage_path);
        }
      });
      const agentPropertyIds = new Set((assignments ?? []).map((a: any) => a.property_id));

      const viewCountMap = new Map<string, number>();
      (views ?? []).forEach((v: any) => viewCountMap.set(v.property_id, (viewCountMap.get(v.property_id) ?? 0) + 1));

      let withCovers: PropertyWithCover[] = list.map((p) => ({
        ...p,
        coverImageUrl: coverMap.has(p.id) ? getPublicImageUrl(coverMap.get(p.id)!) : null,
        isAgentListed: agentPropertyIds.has(p.id),
        viewsCount: viewCountMap.get(p.id) ?? 0,
      }));

      if (sort === 'most_viewed') {
        withCovers = withCovers.sort((a, b) => (b.viewsCount ?? 0) - (a.viewsCount ?? 0));
      }

      setProperties(withCovers);
      setLoading(false);
    })();
  }, [
    operation,
    typeParam,
    districtParam,
    maxPrice,
    minPrice,
    priceCurrency,
    bedrooms,
    bathrooms,
    parking,
    areaMin,
    areaMax,
    maxAge,
    publishedWithin,
    amenitiesParam,
    sort,
  ]);

  const resultsLabel = useMemo(() => {
    if (loading) return 'Buscando…';
    return `${properties.length} inmueble${properties.length === 1 ? '' : 's'} encontrado${properties.length === 1 ? '' : 's'}`;
  }, [loading, properties.length]);

  return (
    <div className="min-h-screen bg-surface-muted">
      <Navbar />
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-extrabold text-ink">Inmuebles publicados</h1>
            <p className="mt-1 text-sm text-ink-light">{resultsLabel}</p>
          </div>
          <div className="flex rounded-input border border-border bg-white p-1">
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-1.5 rounded-[6px] px-3 py-1.5 text-sm font-semibold transition ${
                viewMode === 'list' ? 'bg-brand text-white' : 'text-ink-light hover:text-ink'
              }`}
            >
              <List size={15} /> Lista
            </button>
            <button
              onClick={() => setViewMode('map')}
              className={`flex items-center gap-1.5 rounded-[6px] px-3 py-1.5 text-sm font-semibold transition ${
                viewMode === 'map' ? 'bg-brand text-white' : 'text-ink-light hover:text-ink'
              }`}
            >
              <MapIcon size={15} /> Mapa
            </button>
          </div>
        </div>

        {/* Barra de filtros (incluye Ordenar en la misma fila) */}
        <div className="mt-6 flex flex-wrap items-center gap-3 rounded-card border border-border bg-white p-4 shadow-card">
          <div className="min-w-[150px] flex-1">
            <Select
              options={[{ value: 'all', label: 'Comprar o alquilar' }, { value: 'sale', label: 'Comprar' }, { value: 'rent', label: 'Alquilar' }]}
              value={operation}
              onChange={(e) => setParam('operation', e.target.value)}
            />
          </div>

          <div className="min-w-[160px] flex-1">
            <MultiSelectDropdown
              options={propertyTypeOptions}
              selected={selectedTypes}
              onChange={(v) => setParam('type', v.length === propertyTypeOptions.length ? [] : v)}
              placeholder="Tipo de inmueble"
            />
          </div>

          <div className="min-w-[180px] flex-1">
            <DistrictMultiSelect selected={selectedDistricts} onChange={(v) => setParam('district', v)} />
          </div>

          <div className="min-w-[150px] flex-1">
            <PriceInput
              placeholder="Precio (S/)"
              forceCurrency="PEN"
              onValueChange={(value) => setParam('maxPrice', value ? String(value) : '')}
            />
          </div>

          <div className="min-w-[140px] flex-1">
            <Select
              options={[
                { value: '', label: 'Dormitorios' },
                { value: '1', label: '1+' },
                { value: '2', label: '2+' },
                { value: '3', label: '3+' },
                { value: '4', label: '4+' },
              ]}
              value={bedrooms}
              onChange={(e) => setParam('bedrooms', e.target.value)}
            />
          </div>

          <button
            type="button"
            onClick={openFilters}
            className="flex h-11 shrink-0 items-center justify-center gap-2 rounded-input border border-border bg-white px-3 text-sm font-semibold text-ink hover:bg-surface-muted"
          >
            <SlidersHorizontal size={15} />
            Más filtros
            {activeExtraFiltersCount > 0 && (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand text-[11px] font-bold text-white">
                {activeExtraFiltersCount}
              </span>
            )}
          </button>

          <div className="min-w-[160px] flex-1 sm:ml-auto sm:flex-none sm:w-52">
            <Select options={sortOptions} value={sort} onChange={(e) => setParam('sort', e.target.value)} />
          </div>
        </div>

        <div className="mt-5">
          {loading ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : properties.length === 0 ? (
            <EmptyState
              icon={<Search size={28} />}
              title="No encontramos inmuebles con esos filtros"
              description="Prueba ajustando el precio, el distrito o el tipo de inmueble."
            />
          ) : viewMode === 'map' ? (
            <PropertyMapView
              properties={properties.map((p) => {
                const coords = p.lat != null && p.lng != null ? { lat: p.lat, lng: p.lng } : getDistrictCoords(p.district);
                return {
                  id: p.id,
                  title: p.title,
                  price: p.price,
                  currency: p.currency,
                  operation: p.operation,
                  district: p.district,
                  lat: coords.lat,
                  lng: coords.lng,
                  coverImageUrl: p.coverImageUrl,
                };
              })}
            />
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {properties.map((p) => (
                <PropertyCard key={p.id} property={p} coverImageUrl={p.coverImageUrl} isAgentListed={p.isAgentListed} />
              ))}
            </div>
          )}
        </div>
      </div>

      <Drawer
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        title="Más filtros"
        footer={
          <>
            <Button variant="neutral" fullWidth onClick={clearFilters}>
              Limpiar
            </Button>
            <Button variant="primary" fullWidth onClick={applyFilters}>
              Ver resultados
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-5">
          <div>
            <p className="mb-2 text-sm font-semibold text-ink">Superficie (m²)</p>
            <div className="grid grid-cols-2 gap-3">
              <Input placeholder="Desde" type="number" value={draftAreaMin} onChange={(e) => setDraftAreaMin(e.target.value)} />
              <Input placeholder="Hasta" type="number" value={draftAreaMax} onChange={(e) => setDraftAreaMax(e.target.value)} />
            </div>
          </div>

          <Select
            label="Baños"
            options={[
              { value: '', label: 'Cualquiera' },
              { value: '1', label: '1+' },
              { value: '2', label: '2+' },
              { value: '3', label: '3+' },
            ]}
            value={draftBathrooms}
            onChange={(e) => setDraftBathrooms(e.target.value)}
          />

          <Select
            label="Estacionamientos"
            options={[
              { value: '', label: 'Cualquiera' },
              { value: '1', label: '1+' },
              { value: '2', label: '2+' },
              { value: '3', label: '3+' },
            ]}
            value={draftParking}
            onChange={(e) => setDraftParking(e.target.value)}
          />

          <Input
            label="Antigüedad máxima (años)"
            type="number"
            value={draftMaxAge}
            onChange={(e) => setDraftMaxAge(e.target.value)}
          />

          <Select
            label="Fecha de publicación"
            options={publishedWithinOptions}
            value={draftPublishedWithin}
            onChange={(e) => setDraftPublishedWithin(e.target.value)}
          />

          <div>
            <p className="mb-2 text-sm font-semibold text-ink">Otros ambientes</p>
            <div className="flex flex-wrap gap-2">
              {AMENITIES.map((amenity) => (
                <button
                  type="button"
                  key={amenity}
                  onClick={() =>
                    setDraftAmenities((prev) =>
                      prev.includes(amenity) ? prev.filter((a) => a !== amenity) : [...prev, amenity]
                    )
                  }
                  className={`rounded-full border px-3 py-1.5 text-sm font-medium transition ${
                    draftAmenities.includes(amenity)
                      ? 'border-brand bg-brand-soft text-brand'
                      : 'border-border text-ink-light hover:border-brand/40'
                  }`}
                >
                  {amenity}
                </button>
              ))}
            </div>
          </div>
        </div>
      </Drawer>
    </div>
  );
}
