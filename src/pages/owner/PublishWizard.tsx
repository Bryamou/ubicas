import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Check } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { uploadPropertyImage, getPublicImageUrl } from '@/lib/storage';
import { getDistrictCoords } from '@/lib/limaDistricts';
import { Navbar } from '@/components/Navbar';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { ImageUpload, type UploadedImage } from '@/components/ui/ImageUpload';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import type { OperationType, PropertyType } from '@/types/database';

const STEPS = ['Información principal', 'Características', 'Descripción', 'Fotos', 'Contacto y publicación'];

const AMENITIES = ['Ascensor', 'Seguridad', 'Áreas verdes', 'Piscina', 'Gimnasio', 'Terraza', 'Depósito', 'Otros'];

const propertyTypeOptions: { value: PropertyType; label: string }[] = [
  { value: 'apartment', label: 'Departamento' },
  { value: 'house', label: 'Casa' },
  { value: 'land', label: 'Terreno' },
  { value: 'office', label: 'Oficina' },
  { value: 'commercial', label: 'Local comercial' },
  { value: 'other', label: 'Otro' },
];

interface FormData {
  operation: OperationType;
  property_type: PropertyType;
  title: string;
  district: string;
  address: string;
  hide_exact_address: boolean;
  price: string;
  currency: 'PEN' | 'USD';
  negotiable: boolean;

  area_m2: string;
  area_built_m2: string;
  bedrooms: string;
  bathrooms: string;
  parking_spots: string;
  age_years: string;
  floor_number: string;
  total_floors: string;
  pets_allowed: boolean;
  furnished: boolean;
  amenities: string[];

  description: string;
  highlights: string;
  terms: string;
  additional_info: string;

  contact_name: string;
  contact_phone: string;
  contact_email: string;
  contact_preference: 'call' | 'whatsapp' | 'email';
  contact_hours: string;
  accepted_terms: boolean;
}

const initialForm: FormData = {
  operation: 'sale',
  property_type: 'apartment',
  title: '',
  district: '',
  address: '',
  hide_exact_address: false,
  price: '',
  currency: 'PEN',
  negotiable: false,
  area_m2: '',
  area_built_m2: '',
  bedrooms: '',
  bathrooms: '',
  parking_spots: '',
  age_years: '',
  floor_number: '',
  total_floors: '',
  pets_allowed: false,
  furnished: false,
  amenities: [],
  description: '',
  highlights: '',
  terms: '',
  additional_info: '',
  contact_name: '',
  contact_phone: '',
  contact_email: '',
  contact_preference: 'whatsapp',
  contact_hours: '',
  accepted_terms: false,
};

// Detección simple de datos personales dentro de la descripción (HU-02, paso 3)
function containsPersonalData(text: string) {
  const phoneRegex = /(\+?\d[\d\s-]{7,}\d)/;
  const emailRegex = /[\w.-]+@[\w.-]+\.\w+/;
  return phoneRegex.test(text) || emailRegex.test(text);
}

export function PublishWizardPage() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('edit');

  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormData>(initialForm);
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loadingExisting, setLoadingExisting] = useState(!!editId);
  const [saving, setSaving] = useState<'draft' | 'publish' | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const update = <K extends keyof FormData>(key: K, value: FormData[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  // Precarga en modo edición
  useEffect(() => {
    if (!editId) return;
    (async () => {
      const { data: property } = await supabase.from('properties').select('*').eq('id', editId).single();
      const { data: features } = await supabase
        .from('property_features')
        .select('feature')
        .eq('property_id', editId);
      const { data: existingImages } = await supabase
        .from('property_images')
        .select('*')
        .eq('property_id', editId)
        .order('sort_order', { ascending: true });

      if (property) {
        setForm({
          operation: property.operation,
          property_type: property.property_type,
          title: property.title ?? '',
          district: property.district ?? '',
          address: property.address ?? '',
          hide_exact_address: property.hide_exact_address ?? false,
          price: property.price?.toString() ?? '',
          currency: property.currency ?? 'PEN',
          negotiable: property.negotiable ?? false,
          area_m2: property.area_m2?.toString() ?? '',
          area_built_m2: property.area_built_m2?.toString() ?? '',
          bedrooms: property.bedrooms?.toString() ?? '',
          bathrooms: property.bathrooms?.toString() ?? '',
          parking_spots: property.parking_spots?.toString() ?? '',
          age_years: property.age_years?.toString() ?? '',
          floor_number: property.floor_number?.toString() ?? '',
          total_floors: property.total_floors?.toString() ?? '',
          pets_allowed: property.pets_allowed ?? false,
          furnished: property.furnished ?? false,
          amenities: (features ?? []).map((f) => f.feature),
          description: property.description ?? '',
          highlights: property.highlights ?? '',
          terms: property.terms ?? '',
          additional_info: property.additional_info ?? '',
          contact_name: property.contact_name ?? '',
          contact_phone: property.contact_phone ?? '',
          contact_email: property.contact_email ?? '',
          contact_preference: property.contact_preference ?? 'whatsapp',
          contact_hours: property.contact_hours ?? '',
          accepted_terms: true,
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

  const toggleAmenity = (amenity: string) => {
    setForm((f) => ({
      ...f,
      amenities: f.amenities.includes(amenity)
        ? f.amenities.filter((a) => a !== amenity)
        : [...f.amenities, amenity],
    }));
  };

  const validateStep = (currentStep: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (currentStep === 0) {
      if (!form.title.trim()) newErrors.title = 'Ingresa un título para tu inmueble.';
      if (!form.district.trim()) newErrors.district = 'Ingresa el distrito o zona.';
      if (!form.price || Number(form.price) <= 0) newErrors.price = 'Ingresa un precio válido.';
    }

    if (currentStep === 2) {
      if (form.description.trim().length < 100) {
        newErrors.description = 'La descripción debe tener al menos 100 caracteres.';
      } else if (form.description.length > 3000) {
        newErrors.description = 'La descripción no puede superar los 3,000 caracteres.';
      } else if (containsPersonalData(form.description)) {
        newErrors.description = 'No incluyas teléfonos ni correos dentro de la descripción.';
      }
    }

    if (currentStep === 4) {
      if (!form.contact_name.trim()) newErrors.contact_name = 'Ingresa un nombre de contacto.';
      if (!form.contact_phone.trim() && !form.contact_email.trim()) {
        newErrors.contact_phone = 'Ingresa al menos un teléfono o correo de contacto.';
      }
      if (!form.accepted_terms) newErrors.accepted_terms = 'Debes aceptar los términos para publicar.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const goNext = () => {
    if (validateStep(step)) setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };
  const goBack = () => setStep((s) => Math.max(s - 1, 0));

  const buildPayload = (status: 'draft' | 'published') => {
    // Ubica el pin en el centro del distrito con una pequeña variación
    // aleatoria (~500m) para que inmuebles del mismo distrito no se apilen
    // exactamente en el mismo punto del mapa.
    const base = getDistrictCoords(form.district);
    const jitter = () => (Math.random() - 0.5) * 0.01;

    return {
      owner_id: profile!.id,
      operation: form.operation,
      property_type: form.property_type,
      title: form.title.trim(),
      district: form.district.trim(),
      address: form.address.trim() || null,
      hide_exact_address: form.hide_exact_address,
      lat: base.lat + jitter(),
      lng: base.lng + jitter(),
      price: Number(form.price) || 0,
      currency: form.currency,
      negotiable: form.negotiable,
      area_m2: form.area_m2 ? Number(form.area_m2) : null,
      area_built_m2: form.area_built_m2 ? Number(form.area_built_m2) : null,
      bedrooms: form.bedrooms ? Number(form.bedrooms) : null,
      bathrooms: form.bathrooms ? Number(form.bathrooms) : null,
      parking_spots: form.parking_spots ? Number(form.parking_spots) : null,
      age_years: form.age_years ? Number(form.age_years) : null,
      floor_number: form.floor_number ? Number(form.floor_number) : null,
      total_floors: form.total_floors ? Number(form.total_floors) : null,
      pets_allowed: form.pets_allowed,
      furnished: form.furnished,
      description: form.description.trim(),
      highlights: form.highlights.trim() || null,
      terms: form.terms.trim() || null,
      additional_info: form.additional_info.trim() || null,
      contact_name: form.contact_name.trim(),
      contact_phone: form.contact_phone.trim() || null,
      contact_email: form.contact_email.trim() || null,
      contact_preference: form.contact_preference,
      contact_hours: form.contact_hours.trim() || null,
      status,
      published_at: status === 'published' ? new Date().toISOString() : null,
    };
  };

  const persistFeaturesAndImages = async (propertyId: string) => {
    // Amenidades: reemplaza todas
    await supabase.from('property_features').delete().eq('property_id', propertyId);
    if (form.amenities.length > 0) {
      await supabase
        .from('property_features')
        .insert(form.amenities.map((feature) => ({ property_id: propertyId, feature })));
    }

    // Imágenes nuevas: subir a Storage y guardar fila
    for (let i = 0; i < images.length; i++) {
      const img = images[i];
      if (img.file && !img.storagePath) {
        const { path, error } = await uploadPropertyImage(profile!.id, propertyId, img.file);
        if (path && !error) {
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
  };

  const handleSave = async (status: 'draft' | 'published') => {
    if (status === 'published' && !validateStep(4)) return;
    if (!profile) return;

    setSaving(status === 'published' ? 'publish' : 'draft');
    setFeedback(null);

    try {
      const payload = buildPayload(status);
      let propertyId = editId;

      if (propertyId) {
        const { error } = await supabase.from('properties').update(payload).eq('id', propertyId);
        if (error) throw error;
      } else {
        const { data, error } = await supabase.from('properties').insert(payload).select('id').single();
        if (error) throw error;
        propertyId = data.id;
      }

      await persistFeaturesAndImages(propertyId!);

      setFeedback({
        type: 'success',
        message:
          status === 'published'
            ? '¡Tu inmueble fue publicado! Ya es visible en el mercado público.'
            : 'Guardado como borrador. Puedes seguir editándolo cuando quieras.',
      });

      setTimeout(() => navigate('/panel/propietario/inmuebles'), 1500);
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : 'Ocurrió un error al guardar el inmueble.',
      });
    } finally {
      setSaving(null);
    }
  };

  const progressPercent = useMemo(() => ((step + 1) / STEPS.length) * 100, [step]);

  if (loadingExisting) {
    return (
      <div className="min-h-screen bg-surface-muted">
        <Navbar />
        <div className="py-24 text-center text-sm text-ink-light">Cargando inmueble…</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-muted">
      <Navbar />
      <div className="mx-auto max-w-3xl px-4 py-10">
        <h1 className="text-2xl font-extrabold text-ink">
          {editId ? 'Editar inmueble' : 'Publicar inmueble gratis'}
        </h1>
        <p className="mt-1 text-sm text-ink-light">Completa los 5 pasos. Puedes guardar como borrador en cualquier momento.</p>

        {/* Indicador de avance */}
        <div className="mt-6">
          <div className="h-2 w-full overflow-hidden rounded-full bg-surface-muted">
            <div className="h-full rounded-full bg-brand transition-all" style={{ width: `${progressPercent}%` }} />
          </div>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-light">
            {STEPS.map((label, i) => (
              <span key={label} className={i === step ? 'font-semibold text-brand' : ''}>
                {i + 1}. {label}
              </span>
            ))}
          </div>
        </div>

        {feedback && (
          <div className="mt-4">
            <Alert type={feedback.type === 'success' ? 'success' : 'error'}>{feedback.message}</Alert>
          </div>
        )}

        <div className="mt-6 rounded-card border border-border bg-white p-6 shadow-card">
          {step === 0 && (
            <div className="flex flex-col gap-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Select
                  label="Operación"
                  value={form.operation}
                  onChange={(e) => update('operation', e.target.value as OperationType)}
                  options={[
                    { value: 'sale', label: 'Venta' },
                    { value: 'rent', label: 'Alquiler' },
                  ]}
                />
                <Select
                  label="Tipo de inmueble"
                  value={form.property_type}
                  onChange={(e) => update('property_type', e.target.value as PropertyType)}
                  options={propertyTypeOptions}
                />
              </div>
              <Input
                label="Título del inmueble"
                placeholder="Ej. Departamento moderno con vista al parque"
                value={form.title}
                onChange={(e) => update('title', e.target.value)}
                error={errors.title}
              />
              <Input
                label="Distrito o zona"
                placeholder="Ej. Miraflores"
                value={form.district}
                onChange={(e) => update('district', e.target.value)}
                error={errors.district}
              />
              <Input
                label="Dirección exacta"
                placeholder="Ej. Av. Larco 123"
                value={form.address}
                onChange={(e) => update('address', e.target.value)}
                hint="Puedes ocultarla de la vista pública abajo."
              />
              <label className="flex items-center gap-2 text-sm text-ink">
                <input
                  type="checkbox"
                  checked={form.hide_exact_address}
                  onChange={(e) => update('hide_exact_address', e.target.checked)}
                  className="h-4 w-4 rounded border-border text-brand focus:ring-brand"
                />
                Ocultar dirección exacta en la vista pública
              </label>
              <div className="grid gap-4 sm:grid-cols-2">
                <Input
                  label="Precio"
                  type="number"
                  placeholder="0"
                  value={form.price}
                  onChange={(e) => update('price', e.target.value)}
                  error={errors.price}
                />
                <Select
                  label="Moneda"
                  value={form.currency}
                  onChange={(e) => update('currency', e.target.value as 'PEN' | 'USD')}
                  options={[
                    { value: 'PEN', label: 'Soles (S/)' },
                    { value: 'USD', label: 'Dólares (US$)' },
                  ]}
                />
              </div>
              <label className="flex items-center gap-2 text-sm text-ink">
                <input
                  type="checkbox"
                  checked={form.negotiable}
                  onChange={(e) => update('negotiable', e.target.checked)}
                  className="h-4 w-4 rounded border-border text-brand focus:ring-brand"
                />
                Precio negociable
              </label>
            </div>
          )}

          {step === 1 && (
            <div className="flex flex-col gap-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Input label="Área total (m²)" type="number" value={form.area_m2} onChange={(e) => update('area_m2', e.target.value)} />
                <Input label="Área construida (m²)" type="number" value={form.area_built_m2} onChange={(e) => update('area_built_m2', e.target.value)} />
                <Input label="Dormitorios" type="number" value={form.bedrooms} onChange={(e) => update('bedrooms', e.target.value)} />
                <Input label="Baños" type="number" value={form.bathrooms} onChange={(e) => update('bathrooms', e.target.value)} />
                <Input label="Estacionamientos" type="number" value={form.parking_spots} onChange={(e) => update('parking_spots', e.target.value)} />
                <Input label="Antigüedad (años)" type="number" value={form.age_years} onChange={(e) => update('age_years', e.target.value)} />
                <Input label="Piso" type="number" value={form.floor_number} onChange={(e) => update('floor_number', e.target.value)} />
                <Input label="Total de pisos" type="number" value={form.total_floors} onChange={(e) => update('total_floors', e.target.value)} />
              </div>
              <div className="flex flex-wrap gap-4">
                <label className="flex items-center gap-2 text-sm text-ink">
                  <input type="checkbox" checked={form.pets_allowed} onChange={(e) => update('pets_allowed', e.target.checked)} className="h-4 w-4 rounded border-border text-brand focus:ring-brand" />
                  Mascotas permitidas
                </label>
                <label className="flex items-center gap-2 text-sm text-ink">
                  <input type="checkbox" checked={form.furnished} onChange={(e) => update('furnished', e.target.checked)} className="h-4 w-4 rounded border-border text-brand focus:ring-brand" />
                  Amoblado
                </label>
              </div>
              <div>
                <p className="mb-2 text-sm font-semibold text-ink">Amenidades</p>
                <div className="flex flex-wrap gap-2">
                  {AMENITIES.map((amenity) => (
                    <button
                      type="button"
                      key={amenity}
                      onClick={() => toggleAmenity(amenity)}
                      className={`rounded-full border px-3 py-1.5 text-sm font-medium transition ${
                        form.amenities.includes(amenity)
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
          )}

          {step === 2 && (
            <div className="flex flex-col gap-4">
              <Textarea
                label="Descripción comercial"
                value={form.description}
                onChange={(e) => update('description', e.target.value)}
                error={errors.description}
                showCount
                maxLength={3000}
                hint="Mínimo 100 caracteres. No incluyas teléfonos ni correos."
              />
              <Textarea
                label="Puntos destacados"
                value={form.highlights}
                onChange={(e) => update('highlights', e.target.value)}
                hint="Ej. Cerca al parque, remodelado, con vista despejada…"
              />
              <Textarea
                label="Condiciones de venta o alquiler"
                value={form.terms}
                onChange={(e) => update('terms', e.target.value)}
              />
              <Textarea
                label="Información adicional"
                value={form.additional_info}
                onChange={(e) => update('additional_info', e.target.value)}
              />
            </div>
          )}

          {step === 3 && (
            <ImageUpload images={images} onChange={setImages} />
          )}

          {step === 4 && (
            <div className="flex flex-col gap-4">
              <Input
                label="Nombre de contacto"
                value={form.contact_name}
                onChange={(e) => update('contact_name', e.target.value)}
                error={errors.contact_name}
              />
              <div className="grid gap-4 sm:grid-cols-2">
                <Input
                  label="Teléfono"
                  value={form.contact_phone}
                  onChange={(e) => update('contact_phone', e.target.value)}
                  error={errors.contact_phone}
                />
                <Input
                  label="Correo"
                  type="email"
                  value={form.contact_email}
                  onChange={(e) => update('contact_email', e.target.value)}
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Select
                  label="Preferencia de contacto"
                  value={form.contact_preference}
                  onChange={(e) => update('contact_preference', e.target.value as FormData['contact_preference'])}
                  options={[
                    { value: 'whatsapp', label: 'WhatsApp' },
                    { value: 'call', label: 'Llamada' },
                    { value: 'email', label: 'Correo' },
                  ]}
                />
                <Input
                  label="Horario de contacto"
                  placeholder="Ej. Lunes a viernes, 9am - 6pm"
                  value={form.contact_hours}
                  onChange={(e) => update('contact_hours', e.target.value)}
                />
              </div>
              <label className="flex items-start gap-2 text-sm text-ink">
                <input
                  type="checkbox"
                  checked={form.accepted_terms}
                  onChange={(e) => update('accepted_terms', e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-border text-brand focus:ring-brand"
                />
                Confirmo que la información es correcta y acepto los términos de publicación de Ubicas.
              </label>
              {errors.accepted_terms && <span className="text-xs font-medium text-red-600">{errors.accepted_terms}</span>}
            </div>
          )}
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <Button variant="neutral" onClick={goBack} disabled={step === 0}>
            Anterior
          </Button>

          <div className="flex flex-wrap gap-3">
            <Button variant="secondary" onClick={() => handleSave('draft')} loading={saving === 'draft'}>
              Guardar borrador
            </Button>
            {step < STEPS.length - 1 ? (
              <Button variant="primary" onClick={goNext}>
                Siguiente
              </Button>
            ) : (
              <Button variant="primary" icon={<Check size={16} />} onClick={() => handleSave('published')} loading={saving === 'publish'}>
                Publicar inmueble
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
