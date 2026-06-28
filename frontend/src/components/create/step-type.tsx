"use client";

import { BarChart3, BookOpen, ClipboardList, FileCheck2 } from "lucide-react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import type { DocumentType } from "@/lib/types";

const types: {
  id: DocumentType;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}[] = [
  {
    id: "LESSON_PLAN",
    label: "Plano de aula",
    description: "Documento completo com objetivo, metodologia e avaliacao.",
    icon: BookOpen,
    color: "text-blue-400 bg-blue-500/20",
  },
  {
    id: "EXAM",
    label: "Prova",
    description: "Avaliacao com questoes alinhadas as habilidades escolhidas.",
    icon: ClipboardList,
    color: "text-purple-400 bg-purple-500/20",
  },
  {
    id: "RUBRIC",
    label: "Rubrica",
    description: "Criterios de desempenho claros para acompanhar a aprendizagem.",
    icon: FileCheck2,
    color: "text-emerald-400 bg-emerald-500/20",
  },
  {
    id: "REPORT",
    label: "Relatorio",
    description: "Registro pedagogico formal para comunicar resultados.",
    icon: BarChart3,
    color: "text-amber-400 bg-amber-500/20",
  },
];

export function StepType({
  value,
  onChange,
}: {
  value: DocumentType | null;
  onChange: (value: DocumentType) => void;
}) {
  return (
    <div className="flex flex-col h-full">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-text-900 mb-2">
          Tipo de documento
        </h2>
        <p className="text-text-500">
          Selecione uma opcao suportada pela API do EduDocs AI.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {types.map((type, i) => {
          const isSelected = value === type.id;
          return (
            <motion.div
              key={type.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Card
                className={`cursor-pointer h-full relative overflow-hidden transition-all border-2 ${
                  isSelected
                    ? "border-primary-500 bg-primary-500/10 shadow-md"
                    : "border-surface-200 hover:border-primary-500/50"
                }`}
                onClick={() => onChange(type.id)}
              >
                {isSelected && <div className="border-beam" />}
                <div className="flex items-start gap-4 p-2 relative z-10">
                  <div className={`p-3 rounded-lg ${type.color}`}>
                    <type.icon className="w-6 h-6" />
                  </div>
                  <div>
                    <h3
                      className={`font-bold mb-1 ${
                        isSelected ? "text-primary-400" : "text-text-900"
                      }`}
                    >
                      {type.label}
                    </h3>
                    <p className="text-sm text-text-500 leading-snug">
                      {type.description}
                    </p>
                  </div>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
