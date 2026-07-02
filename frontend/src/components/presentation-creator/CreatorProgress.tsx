import { Check } from "lucide-react";

const STEPS = ["Tema", "Refinar", "Aparência"] as const;

export function CreatorProgress({ step }: { step: 1 | 2 | 3 }) {
  return (
    <nav aria-label="Progresso da criação" className="mx-auto flex w-full max-w-md items-start justify-center">
      {STEPS.map((label, index) => {
        const number = index + 1;
        const isCurrent = number === step;
        const isComplete = number < step;
        return (
          <div key={label} className="relative flex flex-1 flex-col items-center text-center">
            {index < STEPS.length - 1 && (
              <span
                aria-hidden="true"
                className={`absolute left-[62%] top-4 h-px w-[76%] ${number < step ? "bg-primary-400" : "bg-surface-200"}`}
              />
            )}
            <span
              aria-current={isCurrent ? "step" : undefined}
              className={`relative z-10 grid h-8 w-8 place-items-center rounded-full border text-xs font-black shadow-sm transition-colors motion-reduce:transition-none ${
                isCurrent || isComplete
                  ? "border-primary-600 bg-primary-600 text-white"
                  : "border-surface-200 bg-surface-50 text-text-500"
              }`}
            >
              {isComplete ? <Check className="h-4 w-4" aria-hidden="true" /> : number}
            </span>
            <span className={`mt-2 text-xs ${isCurrent ? "font-extrabold text-primary-700" : "font-semibold text-text-500"}`}>
              {label}
            </span>
          </div>
        );
      })}
    </nav>
  );
}
