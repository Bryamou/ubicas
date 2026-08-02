import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { getDistrictCoords } from '@/lib/limaDistricts';
import { urgencyOptions } from '@/lib/requirementHelpers';
import { Navbar } from '@/components/Navbar';
import { ZoneMultiSelect } from '@/components/ZoneMultiSelect';
import { PriceInput } from '@/components/PriceInput';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import type { OperationType, PropertyType, RequirementUrgency } from '@/types/database';

const propertyTypeOptions: { value: PropertyType; label: string }[] = [
  { value: 'apartment', label: 'Departamento' },
  { value: 'house', label: 'Casa' },
  { value: 'land', label: 'Terreno' },
  { value: 'office', label: 'Oficina' },
  { value: 'commercial', label: 'Local' },
  { value: 'project', label: 'Proyecto' },
];

export function PublishRequirementPage() {
  const { profile } = useAuth();
  const navigate = useNavigate();

  // Sección 1
  const [operation, setOperation] = useState<OperationType>('rent');
  // Sección 2
  const [propertyType, setPropertyType] = useState<PropertyType>('apartment');
  // Sección 3
  const [district, setDistrict] = useState<string[]>([]);
  // Sección 4
  const [maxBudget, setMaxBudget] = useState('');
  // Sección 5
  const [bedrooms, setBedrooms] = useState('');
  const [bathrooms, setBathrooms] = useState('');
  const [minArea, setMinArea] = useState('');
  const [parking, setParking] = useState(false);
  const [pets, setPets] = useState(false);
  const [extraNotes, setExtraNotes] = useState('');
  // Sección 6
  const [urgency, setUrgency] = useState<RequirementUrgency>('flexible');
  // Sección 7
  const [description, setDescription] = useState('');

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const handleSubmit = async () => {
    const newErrors: Record<string, string> = {};
    if (district.length === 0) newErrors.district = 'Ingresa el distrito o zona.';
    if (!maxBudget || Number(maxBudget) <= 0) newErrors.maxBudget = 'Ingresa un presupuesto válido.';
    if (!urgency) newErrors.urgency = 'Indica cuándo esperas comprar o alquilar.';
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0 || !profile) return;

    setSaving(true);
    const zone = district[0];
    const coords = getDistrictCoords(zone);

    const { error } = await supabase.from('requirements').insert({
      buyer_id: profile.id,
      operation,
      property_type: propertyType,
      district: zone,
      lat: coords.lat,
      lng: coords.lng,
      max_budget: Number(maxBudget),
      bedrooms: bedrooms ? Number(bedrooms) : null,
      bathrooms: bathrooms ? Number(bathrooms) : null,
      min_area_m2: minArea ? Number(minArea) : null,
      parking,
      pets,
      extra_notes: extraNotes.trim() || null,
      urgency,
      description: description.trim() || null,
    });
    setSaving(false);

    if (error) {
      setFeedback(error.message);
      return;
    }
    navigate(profile.role === 'agent' ? '/panel/agente/clientes' : '/panel/comprador/requerimientos');
  };

  return (
    <div className="min-h-screen bg-surface-muted">
      <Navbar />
      <div className="mx-auto max-w-2xl px-4 py-10">
        <h1 className="text-2xl font-extrabold text-ink">Publicar requerimiento</h1>
        <p className="mt-1 text-sm text-ink-light">
          Cuéntanos qué inmueble buscas. Propietarios y agentes podrán encontrarte y contactarte con opciones reales.
        </p>

        {feedback && (
          <div className="mt-4">
            <Alert type="error">{feedback}</Alert>
          </div>
        )}

        <div className="mt-6 flex flex-col gap-5 rounded-card border border-border bg-white p-6 shadow-card">
          {/* Sección 1: tipo de operación */}
          <Select
            label="Tipo de operación"
            value={operation}
            onChange={(e) => setOperation(e.target.value as OperationType)}
            options={[
              { value: 'rent', label: 'Alquiler' },
              { value: 'sale', label: 'Compra' },
            ]}
          />

          {/* Sección 2: tipo de inmueble */}
          <Select
            label="Tipo de inmueble"
            value={propertyType}
            onChange={(e) => setPropertyType(e.target.value as PropertyType)}
            options={propertyTypeOptions}
          />

          {/* Sección 3: ubicación */}
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-ink">Ubicación</label>
            <ZoneMultiSelect selected={district} onChange={setDistrict} single placeholder="Distrito o zona" />
            {errors.district && <span className="mt-1 block text-xs font-medium text-red-600">{errors.district}</span>}
          </div>

          {/* Sección 4: presupuesto */}
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-ink">Presupuesto máximo</label>
            <PriceInput placeholder="Monto en soles" onValueChange={(v) => setMaxBudget(v ? String(v) : '')} />
            {errors.maxBudget && <span className="mt-1 block text-xs font-medium text-red-600">{errors.maxBudget}</span>}
          </div>

          {/* Sección 5: características */}
          <div className="grid gap-4 sm:grid-cols-3">
            <Input label="Dormitorios" type="number" value={bedrooms} onChange={(e) => setBedrooms(e.target.value)} />
            <Input label="Baños" type="number" value={bathrooms} onChange={(e) => setBathrooms(e.target.value)} />
            <Input label="Área mínima (m²)" type="number" value={minArea} onChange={(e) => setMinArea(e.target.value)} />
          </div>
          <div className="flex flex-wrap gap-4">
            <label className="flex items-center gap-2 text-sm text-ink">
              <input type="checkbox" checked={parking} onChange={(e) => setParking(e.target.checked)} className="h-4 w-4 rounded border-border text-brand focus:ring-brand" />
              Necesito cochera
            </label>
            <label className="flex items-center gap-2 text-sm text-ink">
              <input type="checkbox" checked={pets} onChange={(e) => setPets(e.target.checked)} className="h-4 w-4 rounded border-border text-brand focus:ring-brand" />
              Tengo mascotas
            </label>
          </div>
          <Textarea
            label="Características adicionales (opcional)"
            value={extraNotes}
            onChange={(e) => setExtraNotes(e.target.value)}
            placeholder="Ej. Piso alto, cerca a un colegio, semi-amoblado…"
          />

          {/* Sección 6: fecha esperada (obligatoria) */}
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-ink">
              ¿Cuándo esperas comprar o alquilar este inmueble?
            </label>
            <Select
              value={urgency}
              onChange={(e) => setUrgency(e.target.value as RequirementUrgency)}
              options={urgencyOptions}
            />
            {errors.urgency && <span className="mt-1 block text-xs font-medium text-red-600">{errors.urgency}</span>}
          </div>

          {/* Sección 7: descripción */}
          <Textarea
            label="Descripción"
            value={description}
            onChange={(e) => setDescription(e.target.value.slice(0, 500))}
            placeholder="Describe cualquier característica importante que deba tener el inmueble que buscas."
            showCount
            maxLength={500}
          />

          {/* Sección 8: publicar */}
          <Button variant="primary" onClick={handleSubmit} loading={saving}>
            Publicar requerimiento
          </Button>
        </div>
      </div>
    </div>
  );
}
