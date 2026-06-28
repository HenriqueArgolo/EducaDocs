"use client";

import * as React from "react";
import { Brain, CheckCircle2, Database, FileText, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { DOCUMENT_TYPE_LABELS, type DocumentType } from "@/lib/types";

export function GenerationLoading({ type }: { type: DocumentType }) {
  const [step, setStep] = React.useState(0);

  const steps = React.useMemo(
    () => [
      { icon: Database, text: "Validando habilidades BNCC selecionadas..." },
      { icon: Brain, text: "Montando prompt pedagogico estruturado..." },
      {
        icon: FileText,
        text: `Gerando ${DOCUMENT_TYPE_LABELS[type].toLowerCase()}...`,
      },
      { icon: CheckCircle2, text: "Salvando historico na API..." },
    ],
    [type]
  );

  React.useEffect(() => {
    const timer = window.setInterval(() => {
      setStep((prev) => (prev < steps.length - 1 ? prev + 1 : prev));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [steps.length]);

  return (
    <div className="min-h-[500px] flex flex-col items-center justify-center p-8 bg-surface-0 rounded-xl shadow-[0_0_80px_rgba(0,0,0,0.5)] border border-surface-200 max-w-3xl mx-auto">
      <div className="w-20 h-20 bg-primary-600 rounded-xl flex items-center justify-center shadow-lg mb-10">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
        >
          <Sparkles className="w-10 h-10 text-white" />
        </motion.div>
      </div>

      <h2 className="text-2xl font-bold text-text-900 mb-8 text-center">
        Gerando documento com a API
      </h2>

      <div className="w-full max-w-sm space-y-4">
        {steps.map((item, index) => {
          const isActive = index === step;
          const isPast = index < step;

          return (
            <motion.div
              key={item.text}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`flex items-center gap-4 p-3 rounded-lg transition-colors duration-500 ${
                isActive
                  ? "bg-primary-500/10 border border-primary-500/20 shadow-sm"
                  : isPast
                    ? "opacity-70"
                    : "opacity-40"
              }`}
            >
              <div
                className={`p-2 rounded-full ${
                  isPast
                    ? "bg-success-500/20 text-success-400"
                    : isActive
                      ? "bg-primary-500/20 text-primary-400"
                      : "bg-surface-100 text-surface-400"
                }`}
              >
                {isPast ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : (
                  <item.icon className="w-4 h-4" />
                )}
              </div>
              <span
                className={`text-sm font-medium ${
                  isActive ? "text-primary-400 font-bold" : "text-text-200"
                }`}
              >
                {item.text}
              </span>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
