import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Home, Users, Search } from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { useAuth } from '@/contexts/AuthContext';
import type { UserRole } from '@/types/database';

const roleOptions: { value: UserRole; label: string; description: string; icon: typeof Home }[] = [
  {
    value: 'owner',
    label: 'Propietario',
    description: 'Quiero vender o alquilar mi inmueble.',
    icon: Home,
  },
  {
    value: 'agent',
    label: 'Agente inmobiliario',
    description: 'Intermedio entre propietarios y compradores.',
    icon: Users,
  },
  {
    value: 'buyer',
    label: 'Comprador / arrendatario',
    description: 'Busco un inmueble para vivir.',
    icon: Search,
  },
];

export function RegisterPage() {
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const [role, setRole] = useState<UserRole>('buyer');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!fullName.trim()) return setError('Ingresa tu nombre completo.');
    if (!email.trim()) return setError('Ingresa tu correo electrónico.');
    if (password.length < 6) return setError('La contraseña debe tener al menos 6 caracteres.');
    if (password !== confirmPassword) return setError('Las contraseñas no coinciden.');

    setLoading(true);
    const { error: signUpError } = await signUp({ email, password, fullName, phone, role });
    setLoading(false);

    if (signUpError) {
      setError(
        signUpError.includes('already registered')
          ? 'Ese correo ya está registrado.'
          : signUpError
      );
      return;
    }

    setSuccess(true);
    setTimeout(() => navigate('/login'), 2500);
  };

  if (success) {
    return (
      <div className="min-h-screen bg-surface-muted">
        <Navbar />
        <div className="mx-auto flex max-w-md flex-col items-center px-4 py-24 text-center">
          <div className="rounded-xl bg-white p-8 shadow-sm">
            <h1 className="text-xl font-bold text-ink">¡Cuenta creada!</h1>
            <p className="mt-2 text-sm text-ink-light">
              Revisa tu correo para confirmar tu cuenta. Te redirigiremos al inicio de sesión…
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-muted">
      <Navbar />
      <div className="mx-auto flex max-w-xl flex-col px-4 py-16">
        <h1 className="text-2xl font-bold text-ink">Crea tu cuenta gratis</h1>
        <p className="mt-1 text-sm text-ink-light">
          Comprar, vender y alquilar propiedades nunca fue tan fácil.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-5 rounded-xl bg-white p-6 shadow-sm">
          {error && (
            <div className="rounded-lg bg-brand-soft px-3 py-2 text-sm text-brand">{error}</div>
          )}

          <div>
            <label className="mb-2 block text-sm font-medium text-ink">¿Cuál es tu perfil?</label>
            <div className="grid gap-3 sm:grid-cols-3">
              {roleOptions.map(({ value, label, description, icon: Icon }) => (
                <button
                  type="button"
                  key={value}
                  onClick={() => setRole(value)}
                  className={`flex flex-col items-start gap-2 rounded-xl border p-3 text-left transition ${
                    role === value
                      ? 'border-brand bg-brand-soft'
                      : 'border-surface-muted hover:border-brand/40'
                  }`}
                >
                  <Icon size={20} className={role === value ? 'text-brand' : 'text-ink-light'} />
                  <span className="text-sm font-semibold text-ink">{label}</span>
                  <span className="text-xs text-ink-light">{description}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="fullName" className="mb-1 block text-sm font-medium text-ink">
              Nombre completo
            </label>
            <input
              id="fullName"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full rounded-lg border border-surface-muted px-3 py-2 text-sm focus:border-brand"
              placeholder="Nombre y apellido"
            />
          </div>

          <div>
            <label htmlFor="phone" className="mb-1 block text-sm font-medium text-ink">
              Celular (opcional)
            </label>
            <input
              id="phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full rounded-lg border border-surface-muted px-3 py-2 text-sm focus:border-brand"
              placeholder="+51 9XX XXX XXX"
            />
          </div>

          <div>
            <label htmlFor="email" className="mb-1 block text-sm font-medium text-ink">
              Correo electrónico
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-surface-muted px-3 py-2 text-sm focus:border-brand"
              placeholder="tucorreo@ejemplo.com"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="password" className="mb-1 block text-sm font-medium text-ink">
                Contraseña
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-surface-muted px-3 py-2 text-sm focus:border-brand"
                placeholder="Mínimo 6 caracteres"
              />
            </div>
            <div>
              <label htmlFor="confirmPassword" className="mb-1 block text-sm font-medium text-ink">
                Confirmar contraseña
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full rounded-lg border border-surface-muted px-3 py-2 text-sm focus:border-brand"
                placeholder="Repite la contraseña"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-2 rounded-lg bg-brand py-2.5 text-sm font-semibold text-white transition hover:bg-brand-hover disabled:opacity-60"
          >
            {loading ? 'Creando cuenta…' : 'Crear cuenta'}
          </button>

          <p className="text-center text-sm text-ink-light">
            ¿Ya tienes cuenta?{' '}
            <Link to="/login" className="font-medium text-brand hover:underline">
              Inicia sesión
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
