import { Link, useNavigate } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { useState } from 'react';
import { Logo } from './Logo';
import { useAuth } from '@/contexts/AuthContext';

const dashboardPathByRole: Record<string, string> = {
  owner: '/panel/propietario',
  agent: '/dashboard/agent',
  buyer: '/dashboard/buyer',
};

export function Navbar() {
  const { session, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const links = [
    { label: 'Inmuebles', to: '/inmuebles' },
    { label: 'Cómo funciona', to: '/#como-funciona' },
    { label: 'Para agentes', to: '/#para-agentes' },
    { label: 'Requerimientos', to: '/requerimientos' },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-surface-muted bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link to="/">
          <Logo />
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className="text-sm font-medium text-ink-light hover:text-brand"
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          {session && profile ? (
            <>
              <Link
                to={dashboardPathByRole[profile.role]}
                className="text-sm font-medium text-ink-light hover:text-brand"
              >
                Mi panel
              </Link>
              <button
                onClick={handleSignOut}
                className="rounded-lg border border-surface-muted px-4 py-2 text-sm font-medium text-ink hover:bg-surface-muted"
              >
                Cerrar sesión
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="text-sm font-medium text-ink-light hover:text-brand"
              >
                Iniciar sesión
              </Link>
              <Link
                to="/register"
                className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-hover"
              >
                Publicar gratis
              </Link>
            </>
          )}
        </div>

        <button
          className="md:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label="Abrir menú"
        >
          {open ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {open && (
        <div className="border-t border-surface-muted bg-white px-4 py-4 md:hidden">
          <div className="flex flex-col gap-3">
            {links.map((l) => (
              <Link key={l.to} to={l.to} onClick={() => setOpen(false)} className="text-sm font-medium">
                {l.label}
              </Link>
            ))}
            <hr className="border-surface-muted" />
            {session && profile ? (
              <>
                <Link to={dashboardPathByRole[profile.role]} onClick={() => setOpen(false)} className="text-sm font-medium">
                  Mi panel
                </Link>
                <button onClick={handleSignOut} className="text-left text-sm font-medium text-brand">
                  Cerrar sesión
                </button>
              </>
            ) : (
              <>
                <Link to="/login" onClick={() => setOpen(false)} className="text-sm font-medium">
                  Iniciar sesión
                </Link>
                <Link to="/register" onClick={() => setOpen(false)} className="text-sm font-semibold text-brand">
                  Publicar gratis
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
