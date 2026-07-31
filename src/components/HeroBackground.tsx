/** Fondo del Hero: fotografía urbana (avenida con edificios y áreas verdes)
 * con un tinte suave encima, solo para que el texto y el buscador tengan
 * buen contraste — la foto debe seguir siendo claramente visible. */
export function HeroBackground() {
  return (
    <div className="absolute inset-0" aria-hidden="true">
      <img src="/hero-bg.jpg" alt="" className="h-full w-full object-cover" />
      {/* Tinte tenue: un poco más oscuro a la izquierda (donde va el texto
       * y el buscador) y prácticamente transparente hacia la derecha. */}
      <div className="absolute inset-0 bg-black/65" />
    </div>
  );
}
