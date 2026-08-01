/** Ilustración neutra para la tarjeta de "cliente" (requerimiento): no hay
 * foto de un inmueble real, así que se reemplaza por un ícono de búsqueda
 * de vivienda, manteniendo la misma proporción 4:3 que las fotos de las
 * tarjetas de inmuebles para no romper la consistencia visual. */
export function RequirementIllustration() {
  return (
    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-brand-soft to-surface-muted">
      <svg width="72" height="72" viewBox="0 0 72 72" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="36" cy="36" r="34" stroke="currentColor" className="text-brand/20" strokeWidth="2" />
        <path
          d="M22 38V33.5L36 23L50 33.5V38"
          stroke="currentColor"
          className="text-brand"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M25 37V49C25 49.5523 25.4477 50 26 50H46C46.5523 50 47 49.5523 47 49V37"
          stroke="currentColor"
          className="text-brand"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="42" cy="43" r="7" fill="white" stroke="currentColor" className="text-brand" strokeWidth="2" />
        <path d="M47 48L50.5 51.5" stroke="currentColor" className="text-brand" strokeWidth="2.5" strokeLinecap="round" />
      </svg>
    </div>
  );
}
