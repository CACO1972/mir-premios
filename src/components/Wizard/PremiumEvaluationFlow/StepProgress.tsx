import { CheckCircle } from 'lucide-react';

type Step = 'confirm' | 'payment' | 'schedule';

interface StepProgressProps {
  currentStep: Step;
}

const steps: Step[] = ['confirm', 'payment', 'schedule'];

const StepProgress = ({ currentStep }: StepProgressProps) => {
  const currentIndex = steps.indexOf(currentStep);

  return (
    <div className="flex items-center justify-center gap-2 mb-8">
      {steps.map((s, i) => (
        <div key={s} className="flex items-center">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
              s === currentStep
                ? 'bg-gold text-primary-foreground'
                : i < currentIndex
                  ? 'bg-accent text-accent-foreground'
                  : 'bg-secondary text-muted-foreground'
            }`}
          >
            {i < currentIndex ? <CheckCircle className="w-4 h-4" /> : i + 1}
          </div>
          {i < steps.length - 1 && (
            <div
              className={`w-12 h-0.5 ${
                i < currentIndex ? 'bg-accent' : 'bg-border'
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
};

export default StepProgress;
