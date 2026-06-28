"use client";

import * as React from "react";
import { Clock, HelpCircle, Layers } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { DocumentType } from "@/lib/types";

export function StepInstructions({
  duration,
  instructions,
  onDurationChange,
  onInstructionsChange,
  documentType = null,
  numberOfQuestions = 5,
  onNumberOfQuestionsChange,
  includeHeader = true,
  onIncludeHeaderChange,
}: {
  duration: string;
  instructions: string;
  onDurationChange: (duration: string) => void;
  onInstructionsChange: (instructions: string) => void;
  documentType?: DocumentType | null;
  numberOfQuestions?: number;
  onNumberOfQuestionsChange?: (count: number) => void;
  includeHeader?: boolean;
  onIncludeHeaderChange?: (include: boolean) => void;
}) {
  const presets = [
    { label: "30 min", value: "30 minutos" },
    { label: "45 min", value: "45 minutos" },
    { label: "50 min", value: "50 minutos" },
    { label: "1 hora", value: "1 hora" },
    { label: "1h 30m", value: "1h 30min" },
    { label: "2 horas", value: "2 horas" },
  ];

  const [showCustom, setShowCustom] = React.useState(!presets.some((p) => p.value === duration) && duration !== "");

  React.useEffect(() => {
    const hasMatch = presets.some((p) => p.value === duration);
    if (!hasMatch && duration !== "") {
      setShowCustom(true);
    }
  }, [duration]);

  const handlePresetSelect = (value: string) => {
    setShowCustom(false);
    onDurationChange(value);
  };

  const handleCustomSelect = () => {
    setShowCustom(true);
    if (presets.some((p) => p.value === duration)) {
      onDurationChange("");
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-text-900 mb-2">
          Ajustes finais
        </h2>
        <p className="text-text-500">
          Personalize as configurações de geração e estrutura para o seu documento.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* Escolha da Quantidade de Questões (Apenas para PROVA / EXAM) */}
        {documentType === "EXAM" && onNumberOfQuestionsChange && (
          <div className="p-5 border border-surface-200 rounded-xl bg-surface-50/10">
            <label className="flex items-center gap-2 text-sm font-semibold text-text-800 mb-3">
              <HelpCircle className="w-4 h-4 text-primary-500" />
              Quantidade de Questões
            </label>
            <div className="flex flex-wrap gap-2">
              {[3, 5, 8, 10, 12, 15].map((count) => {
                const isSelected = numberOfQuestions === count;
                return (
                  <button
                    key={count}
                    type="button"
                    onClick={() => onNumberOfQuestionsChange(count)}
                    className={`px-4 py-2 text-sm font-semibold rounded-full border transition-all cursor-pointer ${
                      isSelected
                        ? "bg-primary-600 border-primary-600 text-white shadow-sm"
                        : "bg-surface-0 border-surface-200 text-text-600 hover:bg-surface-100 hover:text-text-900"
                    }`}
                  >
                    {count} questões
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Escolha do Cabeçalho Escolar */}
        {onIncludeHeaderChange && (
          <div className="p-5 border border-surface-200 rounded-xl bg-surface-50/10 flex items-center justify-between gap-4">
            <div className="flex gap-3">
              <div className="p-2 bg-primary-50 rounded-lg text-primary-600 self-start shrink-0">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-text-800">
                  Cabeçalho Escolar Escrito
                </label>
                <span className="block text-xs text-text-500 mt-1 leading-relaxed">
                  Adiciona campos estruturados de identificação (Aluno, Professor, Data, Turma) no topo da folha.
                </span>
              </div>
            </div>
            
            <div className="flex items-center gap-3 shrink-0">
              <span className="text-xs font-semibold text-text-500 hidden sm:inline">
                {includeHeader ? "Ativado" : "Desativado"}
              </span>
              <button
                type="button"
                onClick={() => onIncludeHeaderChange(!includeHeader)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  includeHeader ? "bg-primary-600" : "bg-surface-200"
                }`}
                role="switch"
                aria-checked={includeHeader}
              >
                <span
                  aria-hidden="true"
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    includeHeader ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          </div>
        )}

        {/* Tempo de Aula */}
        <div>
          <label className="flex items-center gap-2 text-sm font-semibold text-text-800 mb-3">
            <Clock className="w-4 h-4 text-primary-500" />
            Tempo de aula / duração
          </label>
          
          <div className="flex flex-wrap gap-2 mb-3">
            {presets.map((preset) => {
              const isSelected = !showCustom && duration === preset.value;
              return (
                <button
                  key={preset.value}
                  type="button"
                  onClick={() => handlePresetSelect(preset.value)}
                  className={`px-4 py-2 text-sm font-semibold rounded-full border transition-all cursor-pointer ${
                    isSelected
                      ? "bg-primary-600 border-primary-600 text-white shadow-sm"
                      : "bg-surface-0 border-surface-200 text-text-600 hover:bg-surface-100 hover:text-text-900"
                  }`}
                >
                  {preset.label}
                </button>
              );
            })}
            <button
              type="button"
              onClick={handleCustomSelect}
              className={`px-4 py-2 text-sm font-semibold rounded-full border transition-all cursor-pointer ${
                showCustom
                  ? "bg-primary-600 border-primary-600 text-white shadow-sm"
                  : "bg-surface-0 border-surface-200 text-text-600 hover:bg-surface-100 hover:text-text-900"
              }`}
            >
              Outro...
            </button>
          </div>

          {showCustom && (
            <div className="animate-in fade-in slide-in-from-top-1 duration-200">
              <Input
                value={duration}
                onChange={(event) => onDurationChange(event.target.value)}
                placeholder="Digite a duração (Ex: 40 minutos, 4 aulas de 50m...)"
                className="h-12"
                maxLength={80}
                autoFocus
              />
            </div>
          )}
        </div>

        {/* Contexto Adicional */}
        <div>
          <label className="block text-sm font-semibold text-text-800 mb-2">
            Contexto adicional ou orientações pedagógicas (opcional)
          </label>
          <Textarea
            value={instructions}
            onChange={(event) => onInstructionsChange(event.target.value)}
            placeholder="Ex: turma com dificuldade de leitura; usar frases curtas e atividade em dupla."
            className="h-[150px] text-base p-4 resize-none"
            maxLength={1000}
          />
        </div>
      </div>
    </div>
  );
}
