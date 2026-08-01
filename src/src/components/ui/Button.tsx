import { type ButtonHTMLAttributes, type ReactNode } from 'react';
import clsx from 'clsx';

type Variant = 'primary' | 'secondary' | 'neutral' | 'danger';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  icon?: ReactNode;
  fullWidth?: boolean;
}

const variantClasses: Record<Variant, string> = {
  primary: 'bg-brand text-white hover:bg-brand-hover disabled:bg-brand/50',
  secondary:
    'bg-transparent text-brand border border-brand hover:bg-brand-soft disabled:opacity-50',
  neutral:
    'bg-white text-ink border border-border hover:bg-surface-muted disabled:opacity-50',
  danger: 'bg-white text-red-600 border border-red-200 hover:bg-red-50 disabled:opacity-50',
};

const sizeClasses: Record<Size, string> = {
  sm: 'h-10 px-3 text-sm',
  md: 'h-11 px-4 text-sm',
  lg: 'h-12 px-6 text-base',
};

/** Botón del sistema de diseño Ubicas. Usar "primary" para acciones prioritarias
 * (publicar, guardar, aceptar, enviar, iniciar sesión). */
export function Button({
  variant = 'primary',
  size = 'md',
  loading,
  icon,
  fullWidth,
  className,
  children,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={clsx(
        'inline-flex items-center justify-center gap-2 rounded-input font-semibold transition disabled:cursor-not-allowed',
        variantClasses[variant],
        sizeClasses[size],
        fullWidth && 'w-full',
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      ) : (
        icon
      )}
      {children}
    </button>
  );
}
