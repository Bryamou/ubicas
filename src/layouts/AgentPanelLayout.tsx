import { Outlet } from 'react-router-dom';
import { LayoutGrid, Building2, Users, Heart, Handshake, UserCircle } from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { PanelSidebar, type SidebarItem } from '@/components/PanelSidebar';
import { useAuth } from '@/contexts/AuthContext';

const items: SidebarItem[] = [
  { to: '/panel/agente', label: 'Resumen', icon: LayoutGrid, end: true },
  { to: '/panel/agente/inmuebles', label: 'Inmuebles', icon: Building2 },
  { to: '/panel/agente/clientes', label: 'Clientes', icon: Users },
  { to: '/panel/agente/favoritos', label: 'Favoritos', icon: Heart },
  { to: '/panel/agente/propuestas', label: 'Mis propuestas', icon: Handshake },
  { to: '/panel/agente/perfil', label: 'Mi perfil', icon: UserCircle },
];

export function AgentPanelLayout() {
  const { profile } = useAuth();

  return (
    <div className="min-h-screen bg-surface-muted">
      <Navbar />
      <div className="mx-auto flex max-w-7xl flex-col md:flex-row">
        <PanelSidebar items={items} />
        <div className="flex-1 p-4 sm:p-6 lg:p-8">
          <div className="mb-6">
            <h1 className="text-xl font-extrabold text-ink">Panel del agente</h1>
            <p className="text-sm text-ink-light">
              {profile?.agent_verified ? 'Cuenta verificada' : 'Verificación pendiente'} · Envía propuestas y da seguimiento a tu cartera.
            </p>
          </div>
          <Outlet />
        </div>
      </div>
    </div>
  );
}
