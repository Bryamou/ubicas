import { type TextareaHTMLAttributes, forwardRef } from 'react';
import clsx from 'clsx';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
  showCount?: boolean;
  maxLength?: number;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, hint, showCount, maxLength, className, id, value, ...props }, ref) => {
    const textareaId = id ?? props.name;
    const length = typeof value === 'string' ? value.length : 0;

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={textareaId} className="text-sm font-semibold text-ink">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          value={value}
          maxLength={maxLength}
          className={clsx(
            'min-h-[120px] w-full resize-y rounded-input border bg-white px-3 py-2.5 text-sm text-ink placeholder:text-ink-light/60',
            'focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20',
            error ? 'border-red-400' : 'border-border',
            className
          )}
          {...props}
        />
        <div className="flex items-center justify-between">
          {error ? (
            <span className="text-xs font-medium text-red-600">{error}</span>
          ) : hint ? (
            <span className="text-xs text-ink-light">{hint}</span>
          ) : (
            <span />
          )}
          {showCount && maxLength && (
            <span
              className={clsx(
                'text-xs',
                length > maxLength ? 'text-red-600' : 'text-ink-light'
              )}
            >
              {length}/{maxLength}
            </span>
          )}
        </div>
      </div>
    );
  }
);
Textarea.displayName = 'Textarea';
