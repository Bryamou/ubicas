import { Outlet, Link } from 'react-router-dom';
import { Heart, MessagesSquare, ClipboardList, Handshake, UserCircle, Search } from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { PanelSidebar, type SidebarItem } from '@/components/PanelSidebar';
import { Button } from '@/components/ui/Button';

const items: SidebarItem[] = [
  { to: '/panel/comprador', label: 'Favoritos', icon: Heart, end: true },
  { to: '/panel/comprador/contactos', label: 'Contactos y visitas', icon: MessagesSquare },
  { to: '/panel/comprador/requerimientos', label: 'Mis requerimientos', icon: ClipboardList },
  { to: '/panel/comprador/propuestas', label: 'Propuestas recibidas', icon: Handshake },
  { to: '/panel/comprador/perfil', label: 'Mi perfil', icon: UserCircle },
];

export function BuyerPanelLayout() {
  return (
    <div className="min-h-screen bg-surface-muted">
      <Navbar />
      <div className="mx-auto flex max-w-7xl flex-col md:flex-row">
        <PanelSidebar items={items} />
        <div className="flex-1 p-4 sm:p-6 lg:p-8">
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-xl font-extrabold text-ink">Panel del comprador/arrendatario</h1>
              <p className="text-sm text-ink-light">Tus favoritos, contactos, requerimientos y propuestas.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link to="/inmuebles">
                <Button variant="neutral" icon={<Search size={16} />}>
                  Buscar inmuebles
                </Button>
              </Link>
              <Link to="/publicar-requerimiento">
                <Button variant="primary">Publicar requerimiento</Button>
              </Link>
            </div>
          </div>
          <Outlet />
        </div>
      </div>
    </div>
  );
}
