"use client";

import * as React from "react";
import { Clock, HelpCircle, Layers, CalendarDays, SlidersHorizontal } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { shouldShowSchoolHeader } from "@/lib/document-generation";
import type { ActivityGenerationSettings, DocumentType, PlanningPeriod } from "@/lib/types";

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
  planningPeriod = "SINGLE",
  onPlanningPeriodChange,
  lessonsPerWeek,
  onLessonsPerWeekChange,
  activitySettings,
  onActivitySettingsChange,
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
  planningPeriod?: PlanningPeriod;
  onPlanningPeriodChange?: (period: PlanningPeriod) => void;
  lessonsPerWeek?: number;
  onLessonsPerWeekChange?: (count: number | undefined) => void;
  activitySettings?: ActivityGenerationSettings;
  onActivitySettingsChange?: (settings: ActivityGenerationSettings) => void;
}) {
  const presets = [
    { label: "30 min", value: "30 minutos" },
    { label: "45 min", value: "45 minutos" },
    { label: "50 min", value: "50 minutos" },
    { label: "1 hora", value: "1 hora" },
    { label: "1h 30m", value: "1h 30min" },
    { label: "2 horas", value: "2 horas" },
  ];

  const planningPeriods: { label: string; value: PlanningPeriod; description: string }[] = [
    {
      label: "Aula única",
      value: "SINGLE",
      description: "Um plano para uma aula específica",
    },
    {
      label: "Semanal",
      value: "WEEKLY",
      description: "Planejamento distribuído em 5 dias letivos",
    },
    {
      label: "Mensal",
      value: "MONTHLY",
      description: "Planejamento com sequência de 4 semanas",
    },
  ];

  const [showCustom, setShowCustom] = React.useState(
    !presets.some((p) => p.value === duration) && duration !== ""
  );

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

  const lessonPresets = [1, 2, 3, 4, 5];
  const [showCustomLessons, setShowCustomLessons] = React.useState(
    lessonsPerWeek !== undefined && !lessonPresets.includes(lessonsPerWeek)
  );

  React.useEffect(() => {
    if (lessonsPerWeek !== undefined && !lessonPresets.includes(lessonsPerWeek)) {
      setShowCustomLessons(true);
    }
  }, [lessonsPerWeek]);

  const handleLessonPresetSelect = (value: number) => {
    setShowCustomLessons(false);
    if (onLessonsPerWeekChange) {
      onLessonsPerWeekChange(value);
    }
  };

  const handleCustomLessonSelect = () => {
    setShowCustomLessons(true);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-text-900 mb-2">Ajustes finais</h2>
        <p className="text-text-500">
          Personalize as configurações de geração e estrutura para o seu documento.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6">

        {/* Periodicidade do Plano de Aula — apenas para LESSON_PLAN */}
        {documentType === "LESSON_PLAN" && onPlanningPeriodChange && (
          <div className="p-5 border border-surface-200 rounded-xl bg-surface-50/10">
            <label className="flex items-center gap-2 text-sm font-semibold text-text-800 mb-4">
              <CalendarDays className="w-4 h-4 text-primary-500" />
              Periodicidade do plano
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {planningPeriods.map((option) => {
                const isSelected = planningPeriod === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => onPlanningPeriodChange(option.value)}
                    className={`flex flex-col items-start gap-1 px-4 py-3 text-left rounded-xl border-2 transition-all cursor-pointer ${
                      isSelected
                        ? "bg-primary-50 border-primary-500 shadow-sm"
                        : "bg-surface-0 border-surface-200 hover:border-primary-300 hover:bg-surface-50"
                    }`}
                  >
                    <span
                      className={`text-sm font-bold ${
                        isSelected ? "text-primary-700" : "text-text-800"
                      }`}
                    >
                      {option.label}
                    </span>
                    <span
                      className={`text-xs leading-relaxed ${
                        isSelected ? "text-primary-500" : "text-text-400"
                      }`}
                    >
                      {option.description}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Quantidade de Aulas por Semana — apenas para LESSON_PLAN e quando WEEKLY ou MONTHLY */}
        {documentType === "LESSON_PLAN" && (planningPeriod === "WEEKLY" || planningPeriod === "MONTHLY") && onLessonsPerWeekChange && (
          <div className="p-5 border border-surface-200 rounded-xl bg-surface-50/10">
            <label className="flex items-center gap-2 text-sm font-semibold text-text-800 mb-3">
              <CalendarDays className="w-4 h-4 text-primary-500" />
              Aulas por semana
            </label>
            <span className="block text-xs text-text-500 mb-4 leading-relaxed">
              Selecione ou digite a quantidade de aulas que você leciona por semana com esta turma.
            </span>
            <div className="flex flex-wrap gap-2 mb-3">
              {lessonPresets.map((count) => {
                const defaultCount = planningPeriod === "WEEKLY" ? 5 : 3;
                const isSelected = !showCustomLessons && (lessonsPerWeek ?? defaultCount) === count;
                return (
                  <button
                    key={count}
                    type="button"
                    onClick={() => handleLessonPresetSelect(count)}
                    className={`px-4 py-2 text-sm font-semibold rounded-full border transition-all cursor-pointer ${
                      isSelected
                        ? "bg-primary-600 border-primary-600 text-white shadow-sm"
                        : "bg-surface-0 border-surface-200 text-text-600 hover:bg-surface-100 hover:text-text-900"
                    }`}
                  >
                    {count} {count === 1 ? "aula" : "aulas"}
                  </button>
                );
              })}
              <button
                type="button"
                onClick={handleCustomLessonSelect}
                className={`px-4 py-2 text-sm font-semibold rounded-full border transition-all cursor-pointer ${
                  showCustomLessons
                    ? "bg-primary-600 border-primary-600 text-white shadow-sm"
                    : "bg-surface-0 border-surface-200 text-text-600 hover:bg-surface-100 hover:text-text-900"
                }`}
              >
                Outro...
              </button>
            </div>
            {showCustomLessons && (
              <div className="animate-in fade-in slide-in-from-top-1 duration-200">
                <Input
                  type="number"
                  min={1}
                  max={6}
                  value={lessonsPerWeek ?? ""}
                  onChange={(event) => {
                    const val = parseInt(event.target.value);
                    onLessonsPerWeekChange(isNaN(val) ? undefined : val);
                  }}
                  placeholder="Digite o número de aulas (Ex: 6)"
                  className="h-12 w-full max-w-[240px]"
                  autoFocus
                />
              </div>
            )}
          </div>
        )}

        {documentType === "LESSON_PLAN" && activitySettings && onActivitySettingsChange && (
          <fieldset className="p-5 border border-primary-200 rounded-xl bg-primary-50/30">
            <legend className="px-2 flex items-center gap-2 text-sm font-bold text-text-900">
              <SlidersHorizontal className="w-4 h-4 text-primary-600" /> Atividades do kit
            </legend>
            <p className="text-xs text-text-500 mb-5">Defina agora como as atividades complementares deste plano serão geradas.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="space-y-2 text-sm font-semibold text-text-700"><span>Quantidade de atividades</span><Input type="number" min={1} max={10} value={activitySettings.activityCount} onChange={event=>onActivitySettingsChange({...activitySettings,activityCount:Number(event.target.value)})}/><small className="block font-normal text-text-500">Cada atividade corresponde a uma folha.</small></label>
              <label className="space-y-2 text-sm font-semibold text-text-700"><span>Exercícios por atividade</span><Input type="number" min={1} max={20} value={activitySettings.exercisesPerActivity} onChange={event=>onActivitySettingsChange({...activitySettings,exercisesPerActivity:Number(event.target.value)})}/><small className="block font-normal text-text-500">Ex.: 5 atividades × 5 exercícios = 25 exercícios.</small></label>
              <ActivitySelect label="Formato" value={activitySettings.format} options={[["MISTA","Misto"],["ESCREVER","Escrever"],["MARCAR","Marcar"],["ASSOCIAR","Associar"],["COMPLETAR","Completar"],["VERDADEIRO_FALSO","Verdadeiro ou falso"]]} onChange={value=>onActivitySettingsChange({...activitySettings,format:value as ActivityGenerationSettings["format"]})}/>
              <ActivitySelect label="Finalidade" value={activitySettings.purpose} options={[["PRATICA","Prática"],["REVISAO","Revisão"],["DIAGNOSTICA","Diagnóstica"],["AVALIATIVA","Avaliativa"]]} onChange={value=>onActivitySettingsChange({...activitySettings,purpose:value as ActivityGenerationSettings["purpose"]})}/>
              <ActivitySelect label="Dificuldade" value={activitySettings.difficulty} options={[["APOIO","Apoio"],["REGULAR","Regular"],["DESAFIO","Desafio"]]} onChange={value=>onActivitySettingsChange({...activitySettings,difficulty:value as ActivityGenerationSettings["difficulty"]})}/>
              <ActivitySelect label="Modalidade" value={activitySettings.modality} options={[["INDIVIDUAL","Individual"],["DUPLA","Dupla"],["GRUPO","Grupo"]]} onChange={value=>onActivitySettingsChange({...activitySettings,modality:value as ActivityGenerationSettings["modality"]})}/>
            </div>
          </fieldset>
        )}

        {/* Quantidade de Questões — apenas para EXAM */}
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

        {/* Cabeçalho Escolar */}
        {onIncludeHeaderChange && shouldShowSchoolHeader(documentType) && (
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
            {documentType === "LESSON_PLAN" && (planningPeriod === "WEEKLY" || planningPeriod === "MONTHLY")
              ? "Duração de cada aula"
              : "Tempo de aula / duração"}
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

function ActivitySelect({label,value,options,onChange}:{label:string;value:string;options:Array<[string,string]>;onChange:(value:string)=>void}){
  return <label className="space-y-2 text-sm font-semibold text-text-700"><span>{label}</span><select className="h-11 w-full rounded-xl border border-surface-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" value={value} onChange={event=>onChange(event.target.value)}>{options.map(([option,labelText])=><option key={option} value={option}>{labelText}</option>)}</select></label>;
}
