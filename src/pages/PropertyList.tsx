import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, List, Map as MapIcon } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { getPublicImageUrl } from '@/lib/storage';
import { getDistrictCoords } from '@/lib/limaDistricts';
import { Navbar } from '@/components/Navbar';
import { PropertyCard } from '@/components/ui/PropertyCard';
import { PropertyMapView } from '@/components/PropertyMapView';
import { SkeletonCard } from '@/components/ui/LoadingState';
import { EmptyState } from '@/components/ui/EmptyState';
import { Select } from '@/components/ui/Select';
import { Input } from '@/components/ui/Input';
import type { OperationType, Property, PropertyType } from '@/types/database';

interface PropertyWithCover extends Property {
  coverImageUrl: string | null;
  isAgentListed: boolean;
}

const propertyTypeOptions = [
  { value: 'all', label: 'Todos los tipos' },
  { value: 'apartment', label: 'Departamento' },
  { value: 'house', label: 'Casa' },
  { value: 'office', label: 'Oficina' },
  { value: 'land', label: 'Terreno' },
  { value: 'commercial', label: 'Local comercial' },
  { value: 'other', label: 'Otro' },
];

export function PropertyListPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [properties, setProperties] = useState<PropertyWithCover[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');

  const operation = searchParams.get('operation') ?? 'all';
  const type = searchParams.get('type') ?? 'all';
  const district = searchParams.get('district') ?? '';
  const maxPrice = searchParams.get('maxPrice') ?? '';
  const bedrooms = searchParams.get('bedrooms') ?? '';
  const bathrooms = searchParams.get('bathrooms') ?? '';
  const parking = searchParams.get('parking') === '1';

  const setParam = (key: string, value: string | boolean) => {
    const next = new URLSearchParams(searchParams);
    if (!value || value === 'all') next.delete(key);
    else next.set(key, typeof value === 'boolean' ? '1' : value);
    setSearchParams(next);
  };

  useEffect(() => {
    (async () => {
      setLoading(true);

      let query = supabase.from('properties').select('*').eq('status', 'published');

      if (operation !== 'all') query = query.eq('operation', operation as OperationType);
      if (type !== 'all') query = query.eq('property_type', type as PropertyType);
      if (district) query = query.ilike('district', `%${district}%`);
      if (maxPrice) query = query.lte('price', Number(maxPrice));
      if (bedrooms) query = query.gte('bedrooms', Number(bedrooms));
      if (bathrooms) query = query.gte('bathrooms', Number(bathrooms));
      if (parking) query = query.gte('parking_spots', 1);

      const { data } = await query.order('published_at', { ascending: false });
      const list = (data as Property[]) ?? [];

      if (list.length === 0) {
        setProperties([]);
        setLoading(false);
        return;
      }

      const ids = list.map((p) => p.id);
      const [{ data: images }, { data: assignments }] = await Promise.all([
        supabase
          .from('property_images')
          .select('property_id, storage_path, is_primary, sort_order')
          .in('property_id', ids)
          .order('sort_order', { ascending: true }),
        supabase.from('property_agent_assignments').select('property_id').in('property_id', ids),
      ]);

      const coverMap = new Map<string, string>();
      (images ?? []).forEach((img: any) => {
        if (!coverMap.has(img.property_id) || img.is_primary) {
          coverMap.set(img.property_id, img.storage_path);
        }
      });
      const agentPropertyIds = new Set((assignments ?? []).map((a: any) => a.property_id));

      setProperties(
        list.map((p) => ({
          ...p,
          coverImageUrl: coverMap.has(p.id) ? getPublicImageUrl(coverMap.get(p.id)!) : null,
          isAgentListed: agentPropertyIds.has(p.id),
        }))
      );
      setLoading(false);
    })();
  }, [operation, type, district, maxPrice, bedrooms, bathrooms, parking]);

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

        <div className="mt-6 grid gap-3 rounded-card border border-border bg-white p-4 shadow-card sm:grid-cols-2 lg:grid-cols-6">
          <Select
            options={[{ value: 'all', label: 'Comprar o alquilar' }, { value: 'sale', label: 'Comprar' }, { value: 'rent', label: 'Alquilar' }]}
            value={operation}
            onChange={(e) => setParam('operation', e.target.value)}
          />
          <Select options={propertyTypeOptions} value={type} onChange={(e) => setParam('type', e.target.value)} />
          <Input placeholder="Distrito" value={district} onChange={(e) => setParam('district', e.target.value)} />
          <Input placeholder="Precio máximo" type="number" value={maxPrice} onChange={(e) => setParam('maxPrice', e.target.value)} />
          <Input placeholder="Dormitorios mín." type="number" value={bedrooms} onChange={(e) => setParam('bedrooms', e.target.value)} />
          <Input placeholder="Baños mín." type="number" value={bathrooms} onChange={(e) => setParam('bathrooms', e.target.value)} />
        </div>
        <label className="mt-3 flex items-center gap-2 text-sm text-ink">
          <input
            type="checkbox"
            checked={parking}
            onChange={(e) => setParam('parking', e.target.checked)}
            className="h-4 w-4 rounded border-border text-brand focus:ring-brand"
          />
          Con cochera
        </label>

        <div className="mt-8">
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
    </div>
  );
}
