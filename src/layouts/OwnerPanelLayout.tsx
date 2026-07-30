import { Outlet } from 'react-router-dom';
import { LayoutGrid, Building2, MessagesSquare, Handshake, BarChart3, UserCircle } from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { PanelSidebar, type SidebarItem } from '@/components/PanelSidebar';
import { Button } from '@/components/ui/Button';
import { Link } from 'react-router-dom';

const items: SidebarItem[] = [
  { to: '/panel/propietario', label: 'Resumen', icon: LayoutGrid, end: true },
  { to: '/panel/propietario/inmuebles', label: 'Mis inmuebles', icon: Building2 },
  { to: '/panel/propietario/contactos', label: 'Contactos y visitas', icon: MessagesSquare },
  { to: '/panel/propietario/propuestas', label: 'Propuestas de agentes', icon: Handshake },
  { to: '/panel/propietario/metricas', label: 'Métricas', icon: BarChart3 },
  { to: '/panel/propietario/perfil', label: 'Mi perfil', icon: UserCircle },
];

export function OwnerPanelLayout() {
  return (
    <div className="min-h-screen bg-surface-muted">
      <Navbar />
      <div className="mx-auto flex max-w-7xl flex-col md:flex-row">
        <PanelSidebar items={items} />
        <div className="flex-1 p-4 sm:p-6 lg:p-8">
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-xl font-extrabold text-ink">Panel del propietario</h1>
              <p className="text-sm text-ink-light">Administra tus inmuebles, contactos y propuestas.</p>
            </div>
            <Link to="/publicar-inmueble">
              <Button variant="primary">Publicar inmueble gratis</Button>
            </Link>
          </div>
          <Outlet />
        </div>
      </div>
    </div>
  );
}
