import { Navbar } from '@/components/Navbar';

interface PlaceholderPageProps {
  title: string;
  description: string;
}

// Página temporal usada por rutas que se implementarán en las
// siguientes fases del plan (ver README). El layout, la navegación
// y las rutas protegidas ya están funcionando end-to-end.
export function PlaceholderPage({ title, description }: PlaceholderPageProps) {
  return (
    <div className="min-h-screen bg-surface-muted">
      <Navbar />
      <div className="mx-auto max-w-3xl px-4 py-24 text-center">
        <h1 className="text-2xl font-bold text-ink">{title}</h1>
        <p className="mt-3 text-sm text-ink-light">{description}</p>
      </div>
    </div>
  );
}
