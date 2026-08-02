import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Users, List, Map as MapIcon, SlidersHorizontal } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Navbar } from '@/components/Navbar';
import { RequirementCard } from '@/components/RequirementCard';
import { SkeletonCard } from '@/components/ui/LoadingState';
import { EmptyState } from '@/components/ui/EmptyState';
import { Select } from '@/components/ui/Select';
import { Input } from '@/components/ui/Input';
import { MultiSelectDropdown } from '@/components/ui/MultiSelectDropdown';
import { ZoneMultiSelect } from '@/components/ZoneMultiSelect';
import { PricePopover } from '@/components/PricePopover';
import { SortDropdown } from '@/components/SortDropdown';
import { FilterSidePanel } from '@/components/FilterSidePanel';
import { Button } from '@/components/ui/Button';
import { requirementTypeLabels, urgencyOptions } from '@/lib/requirementHelpers';
import type { Requirement, ProposalStatus } from '@/types/database';

interface RequirementWithFavorite extends Requirement {
  isFavorite?: boolean;
  isContacted?: boolean;
  proposalStatus?: ProposalStatus | null;
}

const propertyTypeOptions = Object.entries(requirementTypeLabels)
  .filter(([value]) => value !== 'other')
  .map(([value, label]) => ({ value, label }));

const sortOptions = [
  { value: 'recent', label: 'Más recientes' },
  { value: 'budget_desc', label: 'Mayor presupuesto' },
  { value: 'budget_asc', label: 'Menor presupuesto' },
  { value: 'urgent', label: 'Compra urgente' },
  { value: 'urgency_soon', label: 'Fecha esperada más próxima' },
];

const publishedWithinOptions = [
  { value: '', label: 'Cualquier momento' },
  { value: '1', label: 'Hoy' },
  { value: '7', label: 'Últimos 7 días' },
  { value: '30', label: 'Últimos 30 días' },
];

export function RequirementsListPage() {
  const { user, profile } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [requirements, setRequirements] = useState<RequirementWithFavorite[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [filtersOpen, setFiltersOpen] = useState(false);

  const operation = searchParams.get('operation') ?? 'all';
  const typeParam = searchParams.get('type') ?? '';
  const selectedTypes = typeParam ? typeParam.split(',') : [];
  const districtParam = searchParams.get('district') ?? '';
  const selectedDistricts = districtParam ? districtParam.split(',') : [];
  const minBudget = searchParams.get('minBudget') ?? '';
  const maxBudget = searchParams.get('maxBudget') ?? '';

  // Más filtros
  const bedrooms = searchParams.get('bedrooms') ?? '';
  const bathrooms = searchParams.get('bathrooms') ?? '';
  const areaMin = searchParams.get('areaMin') ?? '';
  const areaMax = searchParams.get('areaMax') ?? '';
  const parking = searchParams.get('parking') ?? '';
  const pets = searchParams.get('pets') ?? '';
  const urgency = searchParams.get('urgency') ?? '';
  const publishedWithin = searchParams.get('publishedWithin') ?? '';
  const keyword = searchParams.get('keyword') ?? '';

  const sort = searchParams.get('sort') ?? 'recent';

  // Estado local del panel "Más filtros"
  const [draftBedrooms, setDraftBedrooms] = useState(bedrooms);
  const [draftBathrooms, setDraftBathrooms] = useState(bathrooms);
  const [draftAreaMin, setDraftAreaMin] = useState(areaMin);
  const [draftAreaMax, setDraftAreaMax] = useState(areaMax);
  const [draftParking, setDraftParking] = useState(parking);
  const [draftPets, setDraftPets] = useState(pets);
  const [draftUrgency, setDraftUrgency] = useState(urgency);
  const [draftPublishedWithin, setDraftPublishedWithin] = useState(publishedWithin);
  const [draftKeyword, setDraftKeyword] = useState(keyword);

  const openFilters = () => {
    setDraftBedrooms(bedrooms);
    setDraftBathrooms(bathrooms);
    setDraftAreaMin(areaMin);
    setDraftAreaMax(areaMax);
    setDraftParking(parking);
    setDraftPets(pets);
    setDraftUrgency(urgency);
    setDraftPublishedWithin(publishedWithin);
    setDraftKeyword(keyword);
    setFiltersOpen(true);
  };

  const applyFilters = () => {
    const next = new URLSearchParams(searchParams);
    const setOrDelete = (key: string, value: string) => (value ? next.set(key, value) : next.delete(key));
    setOrDelete('bedrooms', draftBedrooms);
    setOrDelete('bathrooms', draftBathrooms);
    setOrDelete('areaMin', draftAreaMin);
    setOrDelete('areaMax', draftAreaMax);
    setOrDelete('parking', draftParking);
    setOrDelete('pets', draftPets);
    setOrDelete('urgency', draftUrgency);
    setOrDelete('publishedWithin', draftPublishedWithin);
    setOrDelete('keyword', draftKeyword);
    setSearchParams(next);
    setFiltersOpen(false);
  };

  const clearFilters = () => {
    setDraftBedrooms('');
    setDraftBathrooms('');
    setDraftAreaMin('');
    setDraftAreaMax('');
    setDraftParking('');
    setDraftPets('');
    setDraftUrgency('');
    setDraftPublishedWithin('');
    setDraftKeyword('');
  };

  const activeExtraFiltersCount = [
    bedrooms,
    bathrooms,
    areaMin,
    areaMax,
    parking,
    pets,
    urgency,
    publishedWithin,
    keyword,
  ].filter(Boolean).length;

  const setParam = (key: string, value: string | string[]) => {
    const next = new URLSearchParams(searchParams);
    const joined = Array.isArray(value) ? value.join(',') : value;
    if (!joined) next.delete(key);
    else next.set(key, joined);
    setSearchParams(next);
  };

  const applyBudget = (_currency: 'PEN' | 'USD', min: string, max: string) => {
    const next = new URLSearchParams(searchParams);
    const setOrDelete = (key: string, value: string) => (value ? next.set(key, value) : next.delete(key));
    setOrDelete('minBudget', min);
    setOrDelete('maxBudget', max);
    setSearchParams(next);
  };

  const clearBudget = () => {
    const next = new URLSearchParams(searchParams);
    next.delete('minBudget');
    next.delete('maxBudget');
    setSearchParams(next);
  };

  useEffect(() => {
    (async () => {
      setLoading(true);

      let query = supabase
        .from('requirements')
        .select('*')
        .eq('status', 'active')
        .or('expiry_date.is.null,expiry_date.gt.' + new Date().toISOString());

      if (operation !== 'all') query = query.eq('operation', operation as 'sale' | 'rent');
      if (selectedTypes.length > 0) query = query.in('property_type', selectedTypes as any);
      if (selectedDistricts.length > 0) query = query.in('district', selectedDistricts);
      if (minBudget) query = query.gte('max_budget', Number(minBudget));
      if (maxBudget) query = query.lte('max_budget', Number(maxBudget));
      if (bedrooms) query = query.gte('bedrooms', Number(bedrooms));
      if (bathrooms) query = query.gte('bathrooms', Number(bathrooms));
      if (areaMin) query = query.gte('min_area_m2', Number(areaMin));
      if (areaMax) query = query.lte('min_area_m2', Number(areaMax));
      if (parking === 'yes') query = query.eq('parking', true);
      if (parking === 'no') query = query.eq('parking', false);
      if (pets === 'yes') query = query.eq('pets', true);
      if (pets === 'no') query = query.eq('pets', false);
      if (urgency) query = query.eq('urgency', urgency);
      if (publishedWithin) {
        const since = new Date(Date.now() - Number(publishedWithin) * 24 * 60 * 60 * 1000).toISOString();
        query = query.gte('created_at', since);
      }
      if (keyword) query = query.or(`description.ilike.%${keyword}%,extra_notes.ilike.%${keyword}%`);
      if (sort === 'urgent') query = query.eq('urgency', 'asap');

      if (sort === 'budget_desc') query = query.order('max_budget', { ascending: false });
      else if (sort === 'budget_asc') query = query.order('max_budget', { ascending: true });
      else query = query.order('created_at', { ascending: false });

      const { data } = await query;
      let list = (data as Requirement[]) ?? [];

      if (sort === 'urgency_soon') {
        const rank: Record<string, number> = { asap: 0, within_30_days: 1, '1_3_months': 2, more_than_3_months: 3, flexible: 4 };
        list = [...list].sort((a, b) => (rank[a.urgency ?? 'flexible'] ?? 5) - (rank[b.urgency ?? 'flexible'] ?? 5));
      }

      let withFavorites: RequirementWithFavorite[] = list;
      if (user && list.length > 0) {
        const ids = list.map((r) => r.id);
        const isAgent = profile?.role === 'agent';
        const [{ data: favs }, { data: contacts }] = await Promise.all([
          supabase.from('favorites').select('requirement_id').eq('user_id', user.id).in('requirement_id', ids),
          isAgent
            ? supabase
                .from('requirement_agent_proposals')
                .select('requirement_id, status')
                .eq('agent_id', user.id)
                .in('requirement_id', ids)
            : supabase.from('requirement_contacts').select('requirement_id').eq('contacter_id', user.id).in('requirement_id', ids),
        ]);
        const favSet = new Set((favs ?? []).map((f: any) => f.requirement_id));
        const contactedSet = new Set((contacts ?? []).map((c: any) => c.requirement_id));
        const statusMap = new Map<string, ProposalStatus>();
        if (isAgent) (contacts ?? []).forEach((c: any) => statusMap.set(c.requirement_id, c.status));
        withFavorites = list.map((r) => ({
          ...r,
          isFavorite: favSet.has(r.id),
          isContacted: contactedSet.has(r.id),
          proposalStatus: statusMap.get(r.id) ?? null,
        }));
      }

      setRequirements(withFavorites);
      setLoading(false);
    })();
  }, [
    operation,
    typeParam,
    districtParam,
    minBudget,
    maxBudget,
    bedrooms,
    bathrooms,
    areaMin,
    areaMax,
    parking,
    pets,
    urgency,
    publishedWithin,
    keyword,
    sort,
    user,
    profile,
  ]);

  const resultsLabel = useMemo(() => {
    if (loading) return 'Buscando…';
    return `${requirements.length} cliente${requirements.length === 1 ? '' : 's'} encontrado${requirements.length === 1 ? '' : 's'}`;
  }, [loading, requirements.length]);

  const filtersPanelContent = (
    <div className="flex flex-col gap-5">
      {/* En móvil, tipo/presupuesto/ordenar viven aquí (no en la barra)
          para no saturar la pantalla. Desde tablet ya están en la barra
          principal, así que se ocultan para no duplicar. */}
      <div className="flex flex-col gap-5 border-b border-border pb-5 sm:hidden">
        <div>
          <p className="mb-1.5 text-sm font-semibold text-ink">Tipo de inmueble</p>
          <MultiSelectDropdown
            options={propertyTypeOptions}
            selected={selectedTypes.length > 0 ? selectedTypes : propertyTypeOptions.map((o) => o.value)}
            onChange={(v) => setParam('type', v.length === propertyTypeOptions.length ? [] : v)}
            placeholder="Tipo de inmueble"
          />
        </div>
        <div>
          <p className="mb-1.5 text-sm font-semibold text-ink">Presupuesto</p>
          <PricePopover currency="PEN" minPrice={minBudget} maxPrice={maxBudget} onApply={applyBudget} onClear={clearBudget} />
        </div>
        <div>
          <p className="mb-1.5 text-sm font-semibold text-ink">Ordenar</p>
          <SortDropdown options={sortOptions} value={sort} onChange={(v) => setParam('sort', v)} />
        </div>
      </div>

      <Select
        label="Dormitorios"
        options={[
          { value: '', label: 'Cualquiera' },
          { value: '1', label: '1+' },
          { value: '2', label: '2+' },
          { value: '3', label: '3+' },
          { value: '4', label: '4+' },
        ]}
        value={draftBedrooms}
        onChange={(e) => setDraftBedrooms(e.target.value)}
      />

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

      <div>
        <p className="mb-2 text-sm font-semibold text-ink">Área (m²)</p>
        <div className="grid grid-cols-2 gap-3">
          <Input placeholder="Mínima" type="number" value={draftAreaMin} onChange={(e) => setDraftAreaMin(e.target.value)} />
          <Input placeholder="Máxima" type="number" value={draftAreaMax} onChange={(e) => setDraftAreaMax(e.target.value)} />
        </div>
      </div>

      <Select
        label="Cochera"
        options={[
          { value: '', label: 'Indiferente' },
          { value: 'yes', label: 'Sí' },
          { value: 'no', label: 'No' },
        ]}
        value={draftParking}
        onChange={(e) => setDraftParking(e.target.value)}
      />

      <Select
        label="Mascotas"
        options={[
          { value: '', label: 'Indiferente' },
          { value: 'yes', label: 'Sí' },
          { value: 'no', label: 'No' },
        ]}
        value={draftPets}
        onChange={(e) => setDraftPets(e.target.value)}
      />

      <Select
        label="Fecha esperada"
        options={[{ value: '', label: 'Cualquiera' }, ...urgencyOptions]}
        value={draftUrgency}
        onChange={(e) => setDraftUrgency(e.target.value)}
      />

      <Select
        label="Publicado"
        options={publishedWithinOptions}
        value={draftPublishedWithin}
        onChange={(e) => setDraftPublishedWithin(e.target.value)}
      />

      <Input
        label="Características"
        placeholder="Ej. piscina, amoblado…"
        value={draftKeyword}
        onChange={(e) => setDraftKeyword(e.target.value)}
      />
    </div>
  );

  return (
    <div className="min-h-screen bg-surface-muted">
      <Navbar />
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-extrabold text-ink">Clientes activos</h1>
            <p className="mt-1 text-sm text-ink-light">
              Personas que actualmente buscan comprar o alquilar un inmueble.
            </p>
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
              disabled
              title="Disponible próximamente"
              className="flex cursor-not-allowed items-center gap-1.5 rounded-[6px] px-3 py-1.5 text-sm font-semibold text-ink-light/50"
            >
              <MapIcon size={15} /> Mapa
            </button>
          </div>
        </div>

        {/* Barra de filtros: operación, ubicaciones, tipo, presupuesto (popover), ordenar, más filtros */}
        <div className="mt-6 flex flex-wrap items-center gap-3 rounded-card border border-border bg-white p-4 shadow-card">
          <div className="w-full sm:w-40">
            <Select
              options={[{ value: 'all', label: 'Ambos' }, { value: 'sale', label: 'Comprar' }, { value: 'rent', label: 'Alquilar' }]}
              value={operation}
              onChange={(e) => setParam('operation', e.target.value)}
            />
          </div>

          <div className="w-full sm:min-w-[260px] sm:flex-[2]">
            <ZoneMultiSelect selected={selectedDistricts} onChange={(v) => setParam('district', v)} />
          </div>

          <div className="hidden w-full sm:block sm:min-w-[160px] sm:flex-1">
            <MultiSelectDropdown
              options={propertyTypeOptions}
              selected={selectedTypes.length > 0 ? selectedTypes : propertyTypeOptions.map((o) => o.value)}
              onChange={(v) => setParam('type', v.length === propertyTypeOptions.length ? [] : v)}
              placeholder="Tipo de inmueble"
            />
          </div>

          <div className="hidden w-full sm:block sm:w-44">
            <PricePopover currency="PEN" minPrice={minBudget} maxPrice={maxBudget} onApply={applyBudget} onClear={clearBudget} />
          </div>

          <div className="hidden w-full sm:block sm:w-52">
            <SortDropdown options={sortOptions} value={sort} onChange={(v) => setParam('sort', v)} />
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
        </div>

        <div className="mt-5">
          {loading ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : requirements.length === 0 ? (
            <EmptyState
              icon={<Users size={28} />}
              title="No encontramos clientes con esos filtros"
              description="Prueba ajustando la ubicación, el presupuesto o el tipo de inmueble."
            />
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {requirements.map((r) => (
                <RequirementCard
                  key={r.id}
                  requirement={r}
                  initialFavorite={r.isFavorite}
                  initialContacted={r.isContacted}
                  proposalStatus={r.proposalStatus}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <FilterSidePanel
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
        {filtersPanelContent}
      </FilterSidePanel>
    </div>
  );
}
