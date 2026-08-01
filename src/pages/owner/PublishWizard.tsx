import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Home, Building2, Briefcase, Trees, Store, MoreHorizontal, Check, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { uploadPropertyImage, getPublicImageUrl } from '@/lib/storage';
import { getDistrictCoords } from '@/lib/limaDistricts';
import { Navbar } from '@/components/Navbar';
import { WizardStepper } from '@/components/WizardStepper';
import { ToggleGroup } from '@/components/ToggleGroup';
import { CardSelect } from '@/components/CardSelect';
import { ZoneMultiSelect } from '@/components/ZoneMultiSelect';
import { PriceInput } from '@/components/PriceInput';
import { NumberStepper } from '@/components/NumberStepper';
import { PropertyMapView } from '@/components/PropertyMapView';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { ImageUpload, type UploadedImage } from '@/components/ui/ImageUpload';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { PropertyCard } from '@/components/ui/PropertyCard';
import type { OperationType, PropertyType } from '@/types/database';

const STEPS = ['Datos principales', 'Descripción', 'Publicación'];

const propertyTypeOptions: { value: PropertyType; label: string; icon: typeof Home }[] = [
  { value: 'apartment', label: 'Departamento', icon: Building2 },
  { value: 'house', label: 'Casa', icon: Home },
  { value: 'office', label: 'Oficina', icon: Briefcase },
  { value: 'land', label: 'Terreno', icon: Trees },
  { value: 'commercial', label: 'Local', icon: Store },
  { value: 'other', label: 'Otro', icon: MoreHorizontal },
];

const ageOptions = [
  { value: '', label: 'Antigüedad' },
  { value: '0', label: 'A estrenar' },
  { value: '3', label: '1 a 5 años' },
  { value: '8', label: '6 a 10 años' },
  { value: '15', label: '11 a 20 años' },
  { value: '25', label: 'Más de 20 años' },
];

const AMENITIES = ['Piscina', 'Terraza', 'Ascensor', 'Balcón', 'Jardín', 'Seguridad', 'Depósito', 'Mascotas', 'Gimnasio'];

const typeLabels: Record<string, string> = {
  apartment: 'Departamento',
  house: 'Casa',
  office: 'Oficina',
  land: 'Terreno',
  commercial: 'Local',
  other: 'Otro',
};

interface FormData {
  operation: OperationType;
  propertyType: PropertyType;
  district: string[];
  price: string;
  currency: 'PEN' | 'USD';
  areaTotal: string;
  areaBuilt: string;
  bedrooms: number;
  bathrooms: number;
  parking: number;
  floor: string;
  age: string;
  amenities: string[];
  description: string;
}

const initialForm: FormData = {
  operation: 'sale',
  propertyType: 'apartment',
  district: [],
  price: '',
  currency: 'PEN',
  areaTotal: '',
  areaBuilt: '',
  bedrooms: 0,
  bathrooms: 0,
  parking: 0,
  floor: '',
  age: '',
  amenities: [],
  description: '',
};

export function PublishWizardPage() {
  const { profile, user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const editId = searchParams.get('edit');

  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormData>(initialForm);
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [propertyId, setPropertyId] = useState<string | null>(editId);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loadingExisting, setLoadingExisting] = useState(!!editId);
  const [saving, setSaving] = useState(false);
  const [published, setPublished] = useState(false);
  const [autosaveLabel, setAutosaveLabel] = useState('');
  const autosaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const skipNextAutosave = useRef(!!editId);

  const update = <K extends keyof FormData>(key: K, value: FormData[K]) => setForm((f) => ({ ...f, [key]: value }));

  // Carga un borrador existente (?edit=)
  useEffect(() => {
    if (!editId) return;
    (async () => {
      const { data: property } = await supabase.from('properties').select('*').eq('id', editId).single();
      const { data: features } = await supabase.from('property_features').select('feature').eq('property_id', editId);
      const { data: existingImages } = await supabase
        .from('property_images')
        .select('*')
        .eq('property_id', editId)
        .order('sort_order', { ascending: true });

      if (property) {
        setForm({
          operation: property.operation,
          propertyType: property.property_type,
          district: property.district ? [property.district] : [],
          price: property.price ? String(property.price) : '',
          currency: property.currency ?? 'PEN',
          areaTotal: property.area_m2?.toString() ?? '',
          areaBuilt: property.area_built_m2?.toString() ?? '',
          bedrooms: property.bedrooms ?? 0,
          bathrooms: property.bathrooms ?? 0,
          parking: property.parking_spots ?? 0,
          floor: property.floor_number?.toString() ?? '',
          age: property.age_years != null ? String(property.age_years) : '',
          amenities: (features ?? []).map((f) => f.feature),
          description: property.description ?? '',
        });
        setImages(
          (existingImages ?? []).map((img) => ({
            id: img.id,
            url: getPublicImageUrl(img.storage_path),
            storagePath: img.storage_path,
          }))
        );
      }
      setLoadingExisting(false);
    })();
  }, [editId]);

  // Guardado automático de los datos principales (sin fotos/amenidades),
  // con un breve debounce para no disparar una escritura por cada tecla.
  useEffect(() => {
    if (loadingExisting || published) return;
    if (skipNextAutosave.current) {
      skipNextAutosave.current = false;
      return;
    }
    if (!profile) return;
    if (!form.district.length && !form.price && form.description.length === 0) return;

    if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    autosaveTimer.current = setTimeout(async () => {
      const zone = form.district[0] ?? '';
      const coords = zone ? getDistrictCoords(zone) : null;
      const title = zone
        ? `${typeLabels[form.propertyType]} en ${form.operation === 'sale' ? 'venta' : 'alquiler'} en ${zone}`
        : `${typeLabels[form.propertyType]} en ${form.operation === 'sale' ? 'venta' : 'alquiler'}`;

      const payload = {
        owner_id: profile.id,
        operation: form.operation,
        property_type: form.propertyType,
        title,
        district: zone,
        lat: coords?.lat ?? null,
        lng: coords?.lng ?? null,
        price: Number(form.price) || 0,
        currency: form.currency,
        area_m2: form.areaTotal ? Number(form.areaTotal) : null,
        area_built_m2: form.areaBuilt ? Number(form.areaBuilt) : null,
        bedrooms: form.bedrooms,
        bathrooms: form.bathrooms,
        parking_spots: form.parking,
        floor_number: form.floor ? Number(form.floor) : null,
        age_years: form.age !== '' ? Number(form.age) : null,
        description: form.description,
        contact_name: profile.full_name,
        contact_phone: profile.phone,
        contact_email: user?.email ?? null,
        contact_preference: 'whatsapp',
        status: 'draft' as const,
      };

      if (propertyId) {
        await supabase.from('properties').update(payload).eq('id', propertyId);
      } else {
        const { data } = await supabase.from('properties').insert(payload).select('id').single();
        if (data) {
          setPropertyId(data.id);
          setSearchParams({ edit: data.id }, { replace: true });
        }
      }
      setAutosaveLabel('Guardado ✓');
      setTimeout(() => setAutosaveLabel(''), 2000);
    }, 1200);

    return () => {
      if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form, profile, propertyId, loadingExisting, published]);

  const validateStep0 = () => {
    const newErrors: Record<string, string> = {};
    if (form.district.length === 0) newErrors.district = 'Ingresa la ubicación del inmueble.';
    if (!form.price || Number(form.price) <= 0) newErrors.price = 'Ingresa un precio válido.';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep1 = () => {
    const newErrors: Record<string, string> = {};
    if (form.description.trim().length < 20) newErrors.description = 'Cuéntanos un poco más sobre el inmueble (mínimo 20 caracteres).';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const persistFeaturesAndImages = async () => {
    if (!propertyId) return;

    await supabase.from('property_features').delete().eq('property_id', propertyId);
    if (form.amenities.length > 0) {
      await supabase
        .from('property_features')
        .insert(form.amenities.map((feature) => ({ property_id: propertyId, feature })));
    }

    const updatedImages = [...images];
    for (let i = 0; i < updatedImages.length; i++) {
      const img = updatedImages[i];
      if (img.file && !img.storagePath) {
        const { path } = await uploadPropertyImage(profile!.id, propertyId, img.file);
        if (path) {
          updatedImages[i] = { ...img, storagePath: path, url: getPublicImageUrl(path) };
          await supabase.from('property_images').insert({
            property_id: propertyId,
            storage_path: path,
            sort_order: i,
            is_primary: i === 0,
          });
        }
      } else if (img.storagePath) {
        await supabase
          .from('property_images')
          .update({ sort_order: i, is_primary: i === 0 })
          .eq('property_id', propertyId)
          .eq('storage_path', img.storagePath);
      }
    }
    setImages(updatedImages);
  };

  const goNext = async () => {
    if (step === 0) {
      if (!validateStep0()) return;
      setStep(1);
      return;
    }
    if (step === 1) {
      if (!validateStep1()) return;
      setSaving(true);
      await persistFeaturesAndImages();
      setSaving(false);
      setStep(2);
    }
  };

  const goBack = () => setStep((s) => Math.max(0, s - 1));

  const handlePublish = async () => {
    if (!propertyId) return;
    setSaving(true);
    const { error } = await supabase
      .from('properties')
      .update({ status: 'published', published_at: new Date().toISOString() })
      .eq('id', propertyId);
    setSaving(false);
    if (!error) setPublished(true);
  };

  if (loadingExisting) {
    return (
      <div className="min-h-screen bg-surface-muted">
        <Navbar />
        <div className="py-24 text-center text-sm text-ink-light">Cargando…</div>
      </div>
    );
  }

  if (published) {
    return (
      <div className="min-h-screen bg-surface-muted">
        <Navbar />
        <div className="mx-auto max-w-md px-4 py-24 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-success-soft text-success">
            <Check size={32} />
          </div>
          <h1 className="mt-5 text-2xl font-extrabold text-ink">¡Tu inmueble ya está publicado!</h1>
          <p className="mt-2 text-sm text-ink-light">Ahora cualquier comprador podrá encontrarlo desde Ubicas.</p>
          <div className="mt-8 flex flex-col gap-3">
            <Link to={`/inmuebles/${propertyId}`}>
              <Button variant="primary" fullWidth>
                Ver publicación
              </Button>
            </Link>
            <Button
              variant="secondary"
              fullWidth
              onClick={() => {
                setForm(initialForm);
                setImages([]);
                setPropertyId(null);
                setPublished(false);
                setStep(0);
                skipNextAutosave.current = true;
                setSearchParams({}, { replace: true });
              }}
            >
              Publicar otro inmueble
            </Button>
            <Link to="/panel/propietario">
              <Button variant="neutral" fullWidth>
                Ir a mi panel
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const zone = form.district[0] ?? '';
  const coords = zone ? getDistrictCoords(zone) : null;

  const checklist = [
    { label: 'Precio agregado', done: !!form.price && Number(form.price) > 0 },
    { label: 'Ubicación completa', done: form.district.length > 0 },
    { label: 'Fotografías cargadas', done: images.length > 0 },
    { label: 'Descripción', done: form.description.trim().length >= 20 },
  ];
  const warnings: string[] = [];
  if (images.length < 5) warnings.push('Añadir más fotografías puede aumentar el interés de los compradores.');
  if (form.description.trim().length < 100) warnings.push('Una descripción más detallada ayuda a generar más contactos.');

  const previewProperty = {
    id: propertyId ?? 'preview',
    owner_id: profile?.id ?? '',
    operation: form.operation,
    property_type: form.propertyType,
    title: zone
      ? `${typeLabels[form.propertyType]} en ${form.operation === 'sale' ? 'venta' : 'alquiler'} en ${zone}`
      : `${typeLabels[form.propertyType]} en ${form.operation === 'sale' ? 'venta' : 'alquiler'}`,
    description: form.description,
    district: zone,
    city: 'Lima',
    address: null,
    lat: coords?.lat ?? null,
    lng: coords?.lng ?? null,
    price: Number(form.price) || 0,
    currency: form.currency,
    original_price: null,
    area_m2: form.areaTotal ? Number(form.areaTotal) : null,
    area_built_m2: form.areaBuilt ? Number(form.areaBuilt) : null,
    bedrooms: form.bedrooms,
    bathrooms: form.bathrooms,
    parking_spots: form.parking,
    status: 'draft' as const,
    published_at: null,
    hide_exact_address: true,
    negotiable: false,
    age_years: form.age !== '' ? Number(form.age) : null,
    floor_number: form.floor ? Number(form.floor) : null,
    total_floors: null,
    pets_allowed: null,
    furnished: null,
    highlights: null,
    terms: null,
    additional_info: null,
    contact_name: profile?.full_name ?? null,
    contact_phone: profile?.phone ?? null,
    contact_email: user?.email ?? null,
    contact_preference: 'whatsapp' as const,
    contact_hours: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  return (
    <div className="min-h-screen bg-surface-muted">
      <Navbar />
      <div className="mx-auto max-w-2xl px-4 py-8">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-extrabold text-ink">Publicar inmueble</h1>
          {autosaveLabel && <span className="text-xs font-medium text-success">{autosaveLabel}</span>}
        </div>
        <p className="mt-1 text-sm text-ink-light">Publica en pocos minutos. Guardamos tu progreso automáticamente.</p>

        <div className="mt-6">
          <WizardStepper steps={STEPS} current={step} />
        </div>

        <div className="mt-6 rounded-card border border-border bg-white p-6 shadow-card">
          {step === 0 && (
            <div className="flex flex-col gap-6">
              <div>
                <label className="mb-2 block text-sm font-semibold text-ink">Tipo de operación</label>
                <ToggleGroup
                  options={[
                    { value: 'sale', label: 'Venta' },
                    { value: 'rent', label: 'Alquiler' },
                  ]}
                  value={form.operation}
                  onChange={(v) => update('operation', v as OperationType)}
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-ink">Tipo de inmueble</label>
                <CardSelect
                  options={propertyTypeOptions}
                  value={form.propertyType}
                  onChange={(v) => update('propertyType', v as PropertyType)}
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-ink">Ubicación</label>
                <ZoneMultiSelect selected={form.district} onChange={(v) => update('district', v)} single placeholder="Busca tu distrito" />
                {errors.district && <span className="mt-1 block text-xs font-medium text-red-600">{errors.district}</span>}
                {zone && coords && (
                  <div className="mt-3">
                    <PropertyMapView
                      height="180px"
                      properties={[
                        { id: 'confirm', title: zone, price: 0, currency: 'PEN', operation: form.operation, district: zone, coverImageUrl: null, ...coords },
                      ]}
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-ink">Precio</label>
                <PriceInput
                  placeholder="Ej. 850000 o $250000"
                  value={form.price}
                  initialCurrency={form.currency}
                  onValueChange={(amount, currency) => {
                    update('price', amount ? String(amount) : '');
                    update('currency', currency);
                  }}
                />
                {errors.price && <span className="mt-1 block text-xs font-medium text-red-600">{errors.price}</span>}
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-ink">Características principales</label>
                <div className="flex flex-col gap-2">
                  <NumberStepper label="Dormitorios" value={form.bedrooms} onChange={(v) => update('bedrooms', v)} />
                  <NumberStepper label="Baños" value={form.bathrooms} onChange={(v) => update('bathrooms', v)} />
                  <NumberStepper label="Estacionamientos" value={form.parking} onChange={(v) => update('parking', v)} />
                </div>
                <div className="mt-3 grid grid-cols-2 gap-3">
                  <Input placeholder="Área total (m²)" type="number" value={form.areaTotal} onChange={(e) => update('areaTotal', e.target.value)} />
                  <Input placeholder="Área construida (m²)" type="number" value={form.areaBuilt} onChange={(e) => update('areaBuilt', e.target.value)} />
                  <Input placeholder="Piso" value={form.floor} onChange={(e) => update('floor', e.target.value)} />
                  <Select value={form.age} onChange={(e) => update('age', e.target.value)} options={ageOptions} />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-ink">Amenidades</label>
                <div className="flex flex-wrap gap-2">
                  {AMENITIES.map((a) => (
                    <button
                      type="button"
                      key={a}
                      onClick={() =>
                        update('amenities', form.amenities.includes(a) ? form.amenities.filter((x) => x !== a) : [...form.amenities, a])
                      }
                      className={`rounded-full border px-3 py-1.5 text-sm font-medium transition ${
                        form.amenities.includes(a)
                          ? 'border-brand bg-brand-soft text-brand'
                          : 'border-border text-ink-light hover:border-brand/40'
                      }`}
                    >
                      {a}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="flex flex-col gap-6">
              <Textarea
                label="Descripción"
                value={form.description}
                onChange={(e) => update('description', e.target.value.slice(0, 1000))}
                error={errors.description}
                showCount
                maxLength={1000}
                placeholder="Describe los principales beneficios del inmueble, ubicación, iluminación, acabados y cualquier característica importante."
              />

              <div>
                <label className="mb-2 block text-sm font-semibold text-ink">Fotografías</label>
                <ImageUpload images={images} onChange={setImages} recommended={10} />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="flex flex-col gap-6">
              <div>
                <p className="mb-2 text-sm font-semibold text-ink">Vista previa</p>
                <div className="max-w-xs">
                  <PropertyCard property={previewProperty as any} coverImageUrl={images[0]?.url ?? null} />
                </div>
              </div>

              <div>
                <p className="mb-2 text-sm font-semibold text-ink">Checklist</p>
                <div className="flex flex-col gap-2">
                  {checklist.map((item) => (
                    <div key={item.label} className="flex items-center gap-2 text-sm">
                      <span
                        className={`flex h-5 w-5 items-center justify-center rounded-full ${
                          item.done ? 'bg-success-soft text-success' : 'bg-surface-muted text-ink-light'
                        }`}
                      >
                        <Check size={12} />
                      </span>
                      <span className={item.done ? 'text-ink' : 'text-ink-light'}>{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {warnings.length > 0 && (
                <div className="flex flex-col gap-2">
                  {warnings.map((w) => (
                    <Alert key={w} type="warning">
                      <span className="flex items-start gap-1.5">
                        <AlertTriangle size={14} className="mt-0.5 shrink-0" /> {w}
                      </span>
                    </Alert>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="mt-6 flex items-center justify-between gap-3">
          <Button variant="neutral" onClick={goBack} disabled={step === 0}>
            Atrás
          </Button>
          {step < 2 ? (
            <Button variant="primary" onClick={goNext} loading={saving}>
              Continuar
            </Button>
          ) : (
            <Button variant="primary" onClick={handlePublish} loading={saving}>
              Publicar inmueble
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
