import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Navbar } from '@/components/Navbar';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import type { OperationType, PropertyType } from '@/types/database';

const propertyTypeOptions: { value: PropertyType; label: string }[] = [
  { value: 'apartment', label: 'Departamento' },
  { value: 'house', label: 'Casa' },
  { value: 'land', label: 'Terreno' },
  { value: 'office', label: 'Oficina' },
  { value: 'commercial', label: 'Local comercial' },
  { value: 'other', label: 'Otro' },
];

export function PublishRequirementPage() {
  const { profile } = useAuth();
  const navigate = useNavigate();

  const [operation, setOperation] = useState<OperationType>('rent');
  const [propertyType, setPropertyType] = useState<PropertyType>('apartment');
  const [district, setDistrict] = useState('');
  const [maxBudget, setMaxBudget] = useState('');
  const [bedrooms, setBedrooms] = useState('');
  const [bathrooms, setBathrooms] = useState('');
  const [parking, setParking] = useState(false);
  const [pets, setPets] = useState(false);
  const [targetDate, setTargetDate] = useState('');
  const [extraNotes, setExtraNotes] = useState('');

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const handleSubmit = async () => {
    const newErrors: Record<string, string> = {};
    if (!district.trim()) newErrors.district = 'Ingresa el distrito o zona.';
    if (!maxBudget || Number(maxBudget) <= 0) newErrors.maxBudget = 'Ingresa un presupuesto válido.';
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0 || !profile) return;

    setSaving(true);
    const { error } = await supabase.from('requirements').insert({
      buyer_id: profile.id,
      operation,
      property_type: propertyType,
      district: district.trim(),
      max_budget: Number(maxBudget),
      bedrooms: bedrooms ? Number(bedrooms) : null,
      bathrooms: bathrooms ? Number(bathrooms) : null,
      parking,
      pets,
      target_date: targetDate || null,
      extra_notes: extraNotes.trim() || null,
    });
    setSaving(false);

    if (error) {
      setFeedback(error.message);
      return;
    }
    navigate('/panel/comprador/requerimientos');
  };

  return (
    <div className="min-h-screen bg-surface-muted">
      <Navbar />
      <div className="mx-auto max-w-2xl px-4 py-10">
        <h1 className="text-2xl font-extrabold text-ink">Publicar requerimiento</h1>
        <p className="mt-1 text-sm text-ink-light">
          Cuéntanos qué inmueble buscas. Propietarios y agentes podrán contactarte con opciones reales.
        </p>

        {feedback && (
          <div className="mt-4">
            <Alert type="error">{feedback}</Alert>
          </div>
        )}

        <div className="mt-6 flex flex-col gap-4 rounded-card border border-border bg-white p-6 shadow-card">
          <div className="grid gap-4 sm:grid-cols-2">
            <Select
              label="Operación"
              value={operation}
              onChange={(e) => setOperation(e.target.value as OperationType)}
              options={[
                { value: 'rent', label: 'Alquiler' },
                { value: 'sale', label: 'Compra' },
              ]}
            />
            <Select
              label="Tipo de inmueble"
              value={propertyType}
              onChange={(e) => setPropertyType(e.target.value as PropertyType)}
              options={propertyTypeOptions}
            />
          </div>

          <Input
            label="Distrito o zona"
            value={district}
            onChange={(e) => setDistrict(e.target.value)}
            error={errors.district}
            placeholder="Ej. Barranco"
          />

          <Input
            label="Presupuesto máximo (S/)"
            type="number"
            value={maxBudget}
            onChange={(e) => setMaxBudget(e.target.value)}
            error={errors.maxBudget}
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Dormitorios" type="number" value={bedrooms} onChange={(e) => setBedrooms(e.target.value)} />
            <Input label="Baños" type="number" value={bathrooms} onChange={(e) => setBathrooms(e.target.value)} />
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

          <Input
            label="Fecha estimada (opcional)"
            type="date"
            value={targetDate}
            onChange={(e) => setTargetDate(e.target.value)}
          />

          <Textarea
            label="Características adicionales"
            value={extraNotes}
            onChange={(e) => setExtraNotes(e.target.value)}
            placeholder="Ej. Piso alto, cerca a un colegio, semi-amoblado…"
          />

          <Button variant="primary" onClick={handleSubmit} loading={saving}>
            Publicar requerimiento
          </Button>
        </div>
      </div>
    </div>
  );
}
