interface LogoProps {
  className?: string;
  dark?: boolean;
}

// Placeholder de marca: ícono de pin + wordmark "UBICAS".
// Reemplazar el <svg> del ícono por el logo oficial cuando esté disponible.
export function Logo({ className = '', dark = false }: LogoProps) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <svg
        width="28"
        height="28"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <path
          d="M12 2C7.58 2 4 5.58 4 10c0 5.25 6.5 11.14 7.5 12a1 1 0 0 0 1 0C13.5 21.14 20 15.25 20 10c0-4.42-3.58-8-8-8Z"
          fill="#E31345"
        />
        <circle cx="12" cy="10" r="3.2" fill="white" />
      </svg>
      <span
        className={`text-xl font-extrabold tracking-tight ${
          dark ? 'text-white' : 'text-ink'
        }`}
      >
        UBICAS
      </span>
    </div>
  );
}
