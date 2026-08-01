import { Check } from 'lucide-react';

interface WizardStepperProps {
  steps: string[];
  current: number;
}

/** Indicador de progreso: ●────○────○ con el nombre de cada paso. */
export function WizardStepper({ steps, current }: WizardStepperProps) {
  return (
    <div className="flex items-center">
      {steps.map((label, i) => (
        <div key={label} className="flex flex-1 items-center last:flex-none">
          <div className="flex flex-col items-center gap-1.5">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold transition ${
                i < current
                  ? 'bg-brand text-white'
                  : i === current
                    ? 'bg-brand text-white ring-4 ring-brand-soft'
                    : 'bg-surface-muted text-ink-light'
              }`}
            >
              {i < current ? <Check size={15} /> : i + 1}
            </div>
            <span className={`text-xs font-medium ${i === current ? 'text-ink' : 'text-ink-light'}`}>{label}</span>
          </div>
          {i < steps.length - 1 && (
            <div className={`mx-2 h-0.5 flex-1 rounded-full ${i < current ? 'bg-brand' : 'bg-surface-muted'}`} />
          )}
        </div>
      ))}
    </div>
  );
}
