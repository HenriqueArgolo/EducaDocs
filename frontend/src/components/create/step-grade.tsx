"use client";

import { AlertCircle } from "lucide-react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import type {
  EducationStageOption,
  EducationStageValue,
  GradeOption,
  SubjectOption,
} from "@/lib/bncc-taxonomy";

interface StepGradeProps {
  stage: string | null;
  grade: string | null;
  subject: string | null;
  stages: EducationStageOption[];
  grades: GradeOption[];
  subjects: SubjectOption[];
  isLoading: boolean;
  hasSkills: boolean;
  error: string | null;
  onStageChange: (stage: EducationStageValue) => void;
  onGradeChange: (grade: string) => void;
  onSubjectChange: (subject: string) => void;
}

export function StepGrade({
  stage,
  grade,
  subject,
  stages,
  grades,
  subjects,
  isLoading,
  hasSkills,
  error,
  onStageChange,
  onGradeChange,
  onSubjectChange,
}: StepGradeProps) {
  const selectedStage = stage as EducationStageValue | null;
  const gradeTitle =
    selectedStage === "EDUCACAO_INFANTIL" ? "Faixa etária" : "Ano escolar";
  const subjectTitle =
    selectedStage === "EDUCACAO_INFANTIL"
      ? "Campo de experiência"
      : selectedStage === "ENSINO_MEDIO"
        ? "Área do conhecimento"
        : "Disciplina";

  return (
    <div className="flex flex-col h-full">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-text-900 mb-2">
          Filtro da BNCC
        </h2>
        <p className="text-text-500">
          Escolha a etapa, o ano ou faixa e o componente curricular adequado.
        </p>
      </div>

      {error && (
        <div className="mb-6 rounded-lg border border-error-500 bg-error-50 p-4 text-sm text-error-600 flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {Array.from({ length: 8 }).map((_, index) => (
            <div key={index} className="h-14 rounded-lg animate-shimmer" />
          ))}
        </div>
      ) : !hasSkills ? (
        <Card className="p-6 bg-surface-50 border-dashed border-surface-300">
          <p className="text-sm text-text-500">
            Nenhuma habilidade BNCC foi retornada pela API.
          </p>
        </Card>
      ) : (
        <div className="space-y-8 flex-1 overflow-y-auto pr-2 pb-4">
          <div>
            <h3 className="font-semibold text-text-900 mb-4">
              Etapa de ensino
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {stages.map((item, i) => (
                <motion.button
                  type="button"
                  key={item.value}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{
                    delay: i * 0.03,
                    type: "spring",
                    stiffness: 300,
                    damping: 20,
                  }}
                  className={`relative overflow-hidden rounded-xl border p-3 flex items-center justify-center text-center transition-all duration-300 min-h-[4rem] ${
                    stage === item.value
                      ? "border-primary-500 bg-primary-500/10 shadow-md ring-1 ring-primary-500"
                      : "border-surface-200 bg-surface-50 hover:border-primary-500/50 hover:bg-surface-100"
                  }`}
                  onClick={() => onStageChange(item.value)}
                >
                  <span
                    className={`text-sm font-medium ${
                      stage === item.value
                        ? "text-primary-400 font-bold"
                        : "text-text-200"
                    }`}
                  >
                    {item.label}
                  </span>
                </motion.button>
              ))}
            </div>
          </div>

          <div
            className={`transition-opacity duration-300 ${
              !stage ? "opacity-40 pointer-events-none" : "opacity-100"
            }`}
          >
            <h3 className="font-semibold text-text-900 mb-4">{gradeTitle}</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {grades.map((item, i) => (
                <motion.button
                  type="button"
                  key={item.value}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{
                    delay: i * 0.03,
                    type: "spring",
                    stiffness: 300,
                    damping: 20,
                  }}
                  className={`relative overflow-hidden rounded-xl border p-3 flex items-center justify-center text-center transition-all duration-300 min-h-[4rem] ${
                    grade === item.value
                      ? "border-primary-500 bg-primary-500/10 shadow-md ring-1 ring-primary-500"
                      : "border-surface-200 bg-surface-50 hover:border-primary-500/50 hover:bg-surface-100"
                  }`}
                  onClick={() => onGradeChange(item.value)}
                >
                  <span
                    className={`text-sm font-medium ${
                      grade === item.value ? "text-primary-700 font-bold" : "text-text-700"
                    }`}
                  >
                    {item.label}
                  </span>
                </motion.button>
              ))}
            </div>
          </div>

          <div
            className={`transition-opacity duration-300 ${
              !grade ? "opacity-40 pointer-events-none" : "opacity-100"
            }`}
          >
            <h3 className="font-semibold text-text-900 mb-4">{subjectTitle}</h3>
            <div className="flex flex-wrap gap-2">
              {subjects.map((item, i) => (
                <motion.button
                  type="button"
                  key={item.value}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{
                    delay: i * 0.03,
                    type: "spring",
                    stiffness: 300,
                    damping: 20,
                  }}
                  className={`rounded-lg border px-4 py-2 text-sm font-medium transition-all ${
                    subject === item.value
                      ? "border-accent-500 bg-accent-50 text-accent-700 ring-1 ring-accent-500"
                      : "border-surface-200 bg-surface-50 text-text-700 hover:border-accent-200 hover:bg-surface-100"
                  }`}
                  onClick={() => onSubjectChange(item.value)}
                >
                  {item.label}
                </motion.button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
