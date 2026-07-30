import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, Users, Search as SearchIcon } from 'lucide-react';
import { Navbar } from '@/components/Navbar';

export function LandingPage() {
  const navigate = useNavigate();
  const [operation, setOperation] = useState('sale');
  const [district, setDistrict] = useState('');
  const [type, setType] = useState('apartment');
  const [maxPrice, setMaxPrice] = useState('');

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    params.set('operation', operation);
    if (district) params.set('district', district);
    if (type) params.set('type', type);
    if (maxPrice) params.set('maxPrice', maxPrice);
    navigate(`/inmuebles?${params.toString()}`);
  };

  return (
    <div className="min-h-screen">
      <Navbar />

      <section className="bg-ink text-white">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <h1 className="max-w-2xl text-4xl font-extrabold leading-tight sm:text-5xl">
            Comprar, vender y alquilar propiedades{' '}
            <span className="text-brand">nunca fue tan fácil</span>.
          </h1>
          <p className="mt-4 max-w-xl text-ink-light text-white/70">
            Ubicas conecta directamente a propietarios, agentes inmobiliarios y personas
            que buscan un lugar para vivir — sin intermediarios innecesarios.
          </p>

          <form
            onSubmit={handleSearch}
            className="mt-10 grid gap-3 rounded-xl bg-white p-4 text-ink shadow-lg sm:grid-cols-5"
          >
            <select
              value={operation}
              onChange={(e) => setOperation(e.target.value)}
              className="rounded-lg border border-surface-muted px-3 py-2 text-sm"
            >
              <option value="sale">Comprar</option>
              <option value="rent">Alquilar</option>
            </select>

            <input
              value={district}
              onChange={(e) => setDistrict(e.target.value)}
              placeholder="Distrito o zona"
              className="rounded-lg border border-surface-muted px-3 py-2 text-sm"
            />

            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="rounded-lg border border-surface-muted px-3 py-2 text-sm"
            >
              <option value="apartment">Departamento</option>
              <option value="house">Casa</option>
              <option value="office">Oficina</option>
              <option value="land">Terreno</option>
              <option value="commercial">Local comercial</option>
              <option value="other">Otro</option>
            </select>

            <input
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              placeholder="Precio máximo"
              type="number"
              className="rounded-lg border border-surface-muted px-3 py-2 text-sm"
            />

            <button
              type="submit"
              className="flex items-center justify-center gap-2 rounded-lg bg-brand py-2 text-sm font-semibold text-white hover:bg-brand-hover"
            >
              <SearchIcon size={16} /> Buscar
            </button>
          </form>
        </div>
      </section>

      <section id="como-funciona" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <h2 className="text-2xl font-bold text-ink">Una plataforma, tres perfiles</h2>
        <div className="mt-8 grid gap-6 sm:grid-cols-3">
          <div className="rounded-xl border border-surface-muted p-6">
            <Home className="text-brand" />
            <h3 className="mt-3 font-semibold text-ink">Propietarios</h3>
            <p className="mt-2 text-sm text-ink-light">
              Publica gratis tu inmueble en venta o alquiler y recibe contactos y propuestas
              de agentes verificados.
            </p>
          </div>
          <div id="para-agentes" className="rounded-xl border border-surface-muted p-6">
            <Users className="text-brand" />
            <h3 className="mt-3 font-semibold text-ink">Agentes inmobiliarios</h3>
            <p className="mt-2 text-sm text-ink-light">
              Envía propuestas a propietarios y a personas con requerimientos activos para
              ampliar tu cartera.
            </p>
          </div>
          <div className="rounded-xl border border-surface-muted p-6">
            <SearchIcon className="text-brand" />
            <h3 className="mt-3 font-semibold text-ink">Compradores y arrendatarios</h3>
            <p className="mt-2 text-sm text-ink-light">
              Busca inmuebles o publica lo que necesitas: te contactarán propietarios y
              agentes con opciones reales.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
