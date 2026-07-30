import { type InputHTMLAttributes, forwardRef } from 'react';
import clsx from 'clsx';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  suffix?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, suffix, className, id, ...props }, ref) => {
    const inputId = id ?? props.name;
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-sm font-semibold text-ink">
            {label}
          </label>
        )}
        <div className="relative">
          <input
            ref={ref}
            id={inputId}
            className={clsx(
              'h-11 w-full rounded-input border bg-white px-3 text-sm text-ink placeholder:text-ink-light/60',
              'focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20',
              error ? 'border-red-400' : 'border-border',
              suffix && 'pr-12',
              className
            )}
            {...props}
          />
          {suffix && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-ink-light">
              {suffix}
            </span>
          )}
        </div>
        {error ? (
          <span className="text-xs font-medium text-red-600">{error}</span>
        ) : hint ? (
          <span className="text-xs text-ink-light">{hint}</span>
        ) : null}
      </div>
    );
  }
);
Input.displayName = 'Input';
