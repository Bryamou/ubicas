import type { ReactNode } from 'react';
import { CheckCircle2, XCircle, AlertTriangle, Info } from 'lucide-react';
import clsx from 'clsx';

type AlertType = 'success' | 'error' | 'warning' | 'info';

const config: Record<AlertType, { icon: typeof Info; classes: string }> = {
  success: { icon: CheckCircle2, classes: 'bg-success-soft text-success' },
  error: { icon: XCircle, classes: 'bg-red-50 text-red-600' },
  warning: { icon: AlertTriangle, classes: 'bg-warning-soft text-warning' },
  info: { icon: Info, classes: 'bg-info-soft text-info' },
};

interface AlertProps {
  type: AlertType;
  title?: string;
  children: ReactNode;
  className?: string;
}

export function Alert({ type, title, children, className }: AlertProps) {
  const { icon: Icon, classes } = config[type];
  return (
    <div className={clsx('flex gap-3 rounded-input p-3 text-sm', classes, className)} role="alert">
      <Icon size={18} className="mt-0.5 shrink-0" />
      <div>
        {title && <p className="font-semibold">{title}</p>}
        <p>{children}</p>
      </div>
    </div>
  );
}
