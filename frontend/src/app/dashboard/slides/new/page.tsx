"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  FileUp,
  Link2,
  LockKeyhole,
  RefreshCw,
  Sparkles,
  Upload,
} from "lucide-react";
import { CreatorProgress } from "@/components/presentation-creator/CreatorProgress";
import { OutlineEditor } from "@/components/presentation-creator/OutlineEditor";
import { ThemeGallery } from "@/components/presentation-creator/ThemeGallery";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  fetchClassrooms,
  generateOutline,
  generatePresentation,
  updateTimelineItem,
} from "@/lib/api";

const SUBJECT_OPTIONS = [
  "Matemática",
  "Português",
  "História",
  "Geografia",
  "Ciências",
  "Biologia",
  "Física",
  "Química",
  "Artes",
  "Inglês",
];

const GRADE_OPTIONS = [
  "Educação Infantil",
  "1º Ano (Fundamental I)",
  "2º Ano (Fundamental I)",
  "3º Ano (Fundamental I)",
  "4º Ano (Fundamental I)",
  "5º Ano (Fundamental I)",
  "6º Ano (Fundamental II)",
  "7º Ano (Fundamental II)",
  "8º Ano (Fundamental II)",
  "9º Ano (Fundamental II)",
  "1º Ano (Ensino Médio)",
  "2º Ano (Ensino Médio)",
  "3º Ano (Ensino Médio)",
];

const SLIDE_COUNT_OPTIONS = [6, 8, 10, 12, 15];
const LANGUAGE_OPTIONS = ["Português", "Inglês", "Espanhol"];

function mapClassroomGradeToSlidesPreset(classroomGrade: string): string {
  const grade = classroomGrade.toLowerCase();
  if (grade.includes("infantil")) return "Educação Infantil";
  const isHighSchool = grade.includes("médio") || grade.includes("medio") || grade.includes("em");
  for (const year of [1, 2, 3]) {
    if (grade.includes(String(year))) {
      return `${year}º Ano (${isHighSchool ? "Ensino Médio" : "Fundamental I"})`;
    }
  }
  for (const year of [4, 5]) if (grade.includes(String(year))) return `${year}º Ano (Fundamental I)`;
  for (const year of [6, 7, 8, 9]) if (grade.includes(String(year))) return `${year}º Ano (Fundamental II)`;
  return "1º Ano (Fundamental I)";
}

function mapClassroomSubjectToSlidesPreset(classroomSubject: string): string {
  const subject = classroomSubject.toLowerCase();
  if (subject.includes("mat")) return "Matemática";
  if (subject.includes("port") || subject.includes("ling")) return "Português";
  if (subject.includes("his")) return "História";
  if (subject.includes("geo")) return "Geografia";
  if (subject.includes("cie") || subject.includes("ciê")) return "Ciências";
  if (subject.includes("bio")) return "Biologia";
  if (subject.includes("fis") || subject.includes("fís")) return "Física";
  if (subject.includes("qui") || subject.includes("quí")) return "Química";
  if (subject.includes("art")) return "Artes";
  if (subject.includes("ing")) return "Inglês";
  return "Matemática";
}

function NewPresentationContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const topicInputRef = React.useRef<HTMLInputElement>(null);

  const classroomIdParam = searchParams.get("classroomId");
  const timelineItemIdParam = searchParams.get("timelineItemId");
  const [step, setStep] = React.useState<1 | 2 | 3>(1);
  const [formData, setFormData] = React.useState({
    topic: searchParams.get("topic") ?? "",
    grade: "",
    subject: "",
    numberOfSlides: 8,
    language: "Português",
    additionalInstructions: "",
  });
  const [outline, setOutline] = React.useState<string[]>([]);
  const [selectedTheme, setSelectedTheme] = React.useState("early-years-chalkie-studio");
  const [isOutlineLoading, setIsOutlineLoading] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [classroomName, setClassroomName] = React.useState<string | null>(null);
  const [isLockedByClassroom, setIsLockedByClassroom] = React.useState(false);

  React.useEffect(() => {
    async function loadClassroomContext() {
      if (!classroomIdParam) return;
      try {
        const classrooms = await fetchClassrooms();
        const classroom = classrooms.find((item) => item.id.toString() === classroomIdParam);
        if (!classroom) return;
        setClassroomName(classroom.name);
        setFormData((current) => ({
          ...current,
          grade: mapClassroomGradeToSlidesPreset(classroom.grade),
          subject: mapClassroomSubjectToSlidesPreset(classroom.subject),
        }));
        setIsLockedByClassroom(true);
      } catch (loadError) {
        console.error("Erro ao carregar contexto de turma:", loadError);
      }
    }
    void loadClassroomContext();
  }, [classroomIdParam]);

  function validateTopicStep() {
    if (formData.topic.trim() && formData.grade && formData.subject) return true;
    setError("Preencha o tema, a série e a disciplina para criar o roteiro.");
    if (!formData.topic.trim()) topicInputRef.current?.focus();
    return false;
  }

  async function handleCreateOutline() {
    if (!validateTopicStep()) return;
    setIsOutlineLoading(true);
    setError(null);
    try {
      const result = await generateOutline({
        topic: formData.topic.trim(),
        grade: formData.grade,
        subject: formData.subject,
        numberOfSlides: formData.numberOfSlides,
        additionalInstructions: formData.additionalInstructions,
      });
      if (!result.outline?.length) {
        setError("O roteiro veio vazio. Tente gerar novamente ou ajuste as orientações.");
        return;
      }
      setOutline(result.outline);
      setStep(2);
    } catch (outlineError) {
      setError(
        outlineError instanceof Error
          ? outlineError.message
          : "Não foi possível criar o roteiro. Tente novamente.",
      );
    } finally {
      setIsOutlineLoading(false);
    }
  }

  function handleUpdateOutlineItem(index: number, value: string) {
    setOutline((current) => current.map((item, itemIndex) => (itemIndex === index ? value : item)));
  }

  function handleAddOutlineItem() {
    setOutline((current) => [...current, "Novo momento de aprendizagem"]);
  }

  function handleRemoveOutlineItem(index: number) {
    setOutline((current) => current.filter((_, itemIndex) => itemIndex !== index));
  }

  function handleMoveOutlineItem(index: number, direction: -1 | 1) {
    setOutline((current) => {
      const targetIndex = index + direction;
      if (targetIndex < 0 || targetIndex >= current.length) return current;
      const reordered = [...current];
      [reordered[index], reordered[targetIndex]] = [reordered[targetIndex], reordered[index]];
      return reordered;
    });
  }

  function goToThemeStep() {
    const hasValidOutline = outline.length > 0 && outline.every((item) => item.trim());
    if (!hasValidOutline) {
      setError("O roteiro precisa ter ao menos um slide e nenhum título pode ficar vazio.");
      return;
    }
    setError(null);
    setStep(3);
  }

  async function handleFinalGenerate() {
    if (outline.length === 0) {
      setError("Adicione ao menos um slide ao roteiro antes de gerar a apresentação.");
      setStep(2);
      return;
    }
    setIsLoading(true);
    setError(null);
    const outlineInstruction = [
      "Gere a apresentação seguindo rigorosamente esta jornada pedagógica:",
      ...outline.map((item, index) => `Slide ${index + 1}: ${item}`),
      `Idioma: ${formData.language}`,
      `Quantidade máxima: ${formData.numberOfSlides} slides`,
      `Instruções extras do professor: ${formData.additionalInstructions || "Nenhuma"}`,
    ].join("\n");
    try {
      const presentation = await generatePresentation({
        topic: formData.topic,
        grade: formData.grade,
        subject: formData.subject,
        additionalInstructions: outlineInstruction,
      });
      if (classroomIdParam && timelineItemIdParam) {
        await updateTimelineItem(classroomIdParam, timelineItemIdParam, {
          title: presentation.title,
          description: presentation.topic,
          type: "SLIDES",
          presentationId: presentation.id,
        });
        router.push(`/dashboard/classrooms/${classroomIdParam}`);
        return;
      }
      router.push(`/dashboard/slides/${presentation.id}?theme=${selectedTheme}`);
    } catch (generationError) {
      setError(
        generationError instanceof Error
          ? generationError.message
          : "Não foi possível gerar a apresentação. Tente novamente.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  const backHref = classroomIdParam ? `/dashboard/classrooms/${classroomIdParam}` : "/dashboard/slides";
  const primaryAction = step === 1 ? handleCreateOutline : step === 2 ? goToThemeStep : handleFinalGenerate;

  return (
    <div className="mx-auto min-h-[calc(100vh-7rem)] max-w-[900px] pb-28">
      <Link
        href={backHref}
        className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-surface-200 bg-white px-3 text-xs font-bold text-text-600 shadow-sm transition-colors hover:border-primary-200 hover:text-primary-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        {classroomIdParam ? "Voltar para a turma" : "Voltar para apresentações"}
      </Link>

      <div className="mt-3 sm:mt-0">
        <CreatorProgress step={step} />
      </div>

      {error && (
        <div
          role="alert"
          aria-live="assertive"
          className="mx-auto mt-6 flex max-w-3xl items-start gap-3 rounded-2xl border border-error-200 bg-error-50 p-4 text-sm text-error-800"
        >
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-error-500" aria-hidden="true" />
          <div>
            <strong className="block font-extrabold">Não foi possível avançar</strong>
            <span>{error}</span>
          </div>
        </div>
      )}

      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.section
            key="topic"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="mx-auto mt-10 max-w-3xl"
            aria-labelledby="topic-title"
          >
            <div className="mb-7 text-center">
              <h1 id="topic-title" className="font-serif text-3xl font-bold tracking-[-0.035em] text-text-900 sm:text-4xl">
                Qual é o tema da aula? <Sparkles className="inline h-6 w-6 text-primary-600" aria-hidden="true" />
              </h1>
              <p className="mt-2 text-sm text-text-500">Comece pelo assunto. O EducaDocs organiza o percurso pedagógico.</p>
            </div>

            <Input
              ref={topicInputRef}
              value={formData.topic}
              onChange={(event) => setFormData((current) => ({ ...current, topic: event.target.value }))}
              placeholder="Ex.: Segunda Guerra Mundial ou frações no cotidiano"
              aria-label="Tema da aula"
              className="h-16 rounded-2xl bg-white px-5 text-base shadow-sm"
            />

            <div className="mt-4 rounded-[22px] border border-surface-200 bg-white p-4 shadow-sm sm:p-5">
              {isLockedByClassroom && (
                <div className="mb-4 flex items-center gap-2 rounded-xl bg-primary-50 px-3 py-2 text-xs font-semibold text-primary-800">
                  <LockKeyhole className="h-4 w-4" aria-hidden="true" />
                  Série e disciplina definidas pela turma {classroomName}.
                </div>
              )}

              <div className="grid grid-cols-2 gap-2 border-b border-surface-100 pb-4 sm:grid-cols-4">
                <CompactSelect
                  label="Série"
                  value={formData.grade}
                  disabled={isLockedByClassroom}
                  onChange={(grade) => setFormData((current) => ({ ...current, grade }))}
                  options={GRADE_OPTIONS}
                  placeholder="Selecionar série"
                />
                <CompactSelect
                  label="Disciplina"
                  value={formData.subject}
                  disabled={isLockedByClassroom}
                  onChange={(subject) => setFormData((current) => ({ ...current, subject }))}
                  options={SUBJECT_OPTIONS}
                  placeholder="Selecionar disciplina"
                />
                <CompactSelect
                  label="Slides"
                  value={String(formData.numberOfSlides)}
                  onChange={(numberOfSlides) =>
                    setFormData((current) => ({ ...current, numberOfSlides: Number(numberOfSlides) }))
                  }
                  options={SLIDE_COUNT_OPTIONS.map(String)}
                  formatOption={(value) => `${value} slides`}
                />
                <CompactSelect
                  label="Idioma"
                  value={formData.language}
                  onChange={(language) => setFormData((current) => ({ ...current, language }))}
                  options={LANGUAGE_OPTIONS}
                />
              </div>

              <Textarea
                value={formData.additionalInstructions}
                onChange={(event) =>
                  setFormData((current) => ({ ...current, additionalInstructions: event.target.value }))
                }
                placeholder="Alguma orientação, objetivo ou conteúdo que não pode faltar?"
                aria-label="Orientações adicionais"
                className="min-h-28 resize-none border-0 px-1 py-5 text-sm shadow-none focus-visible:ring-0"
              />

              <button
                type="button"
                onClick={handleCreateOutline}
                disabled={isOutlineLoading}
                className="inline-flex min-h-11 items-center gap-2 rounded-lg px-1 text-sm font-extrabold text-primary-700 underline decoration-primary-300 underline-offset-4 hover:text-primary-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 disabled:opacity-60"
              >
                <Sparkles className="h-4 w-4" aria-hidden="true" />
                {isOutlineLoading ? "Criando roteiro…" : "Criar roteiro pedagógico"}
              </button>

              <div className="mt-2 flex min-h-40 flex-col items-center justify-center rounded-2xl border border-dashed border-surface-300 bg-surface-50 px-5 text-center">
                <div className="flex gap-2" aria-hidden="true">
                  {[Upload, FileUp, Link2].map((Icon, index) => (
                    <span key={index} className="grid h-10 w-10 place-items-center rounded-full border border-surface-200 bg-white text-primary-600">
                      <Icon className="h-4 w-4" />
                    </span>
                  ))}
                </div>
                <strong className="mt-3 text-sm text-text-800">Materiais de referência</strong>
                <span className="mt-1 text-xs text-text-500">Upload de planos, textos e links — Em breve</span>
                <button type="button" disabled className="sr-only">Enviar material — Em breve</button>
              </div>
            </div>
          </motion.section>
        )}

        {step === 2 && (
          <motion.section
            key="outline"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="mx-auto mt-10 max-w-3xl"
            aria-labelledby="outline-title"
          >
            <div className="mb-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
              <div>
                <h1 id="outline-title" className="font-serif text-3xl font-bold tracking-[-0.035em] text-text-900">
                  Refine a jornada da aula
                </h1>
                <p className="mt-2 text-sm text-text-500">Uma ideia por slide. Edite a progressão antes de escolher o visual.</p>
              </div>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={handleCreateOutline}
                isLoading={isOutlineLoading}
                leftIcon={<RefreshCw className="h-4 w-4" aria-hidden="true" />}
                className="h-11 rounded-xl bg-white"
              >
                Gerar novamente
              </Button>
            </div>
            <OutlineEditor
              outline={outline}
              onChange={handleUpdateOutlineItem}
              onAdd={handleAddOutlineItem}
              onRemove={handleRemoveOutlineItem}
              onMove={handleMoveOutlineItem}
            />
          </motion.section>
        )}

        {step === 3 && (
          <motion.section
            key="theme"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="mt-10"
            aria-labelledby="theme-title"
          >
            <div className="mb-6 text-center">
              <h1 id="theme-title" className="font-serif text-3xl font-bold tracking-[-0.035em] text-text-900 sm:text-4xl">
                Escolha a aparência <Sparkles className="inline h-6 w-6 text-primary-600" aria-hidden="true" />
              </h1>
              <p className="mx-auto mt-2 max-w-xl text-sm text-text-500">
                O tema adapta a experiência à turma sem alterar a qualidade pedagógica do roteiro.
              </p>
            </div>

            <ThemeGallery
              value={selectedTheme}
              onChange={setSelectedTheme}
            />
            <p className="mt-4 text-center text-xs text-text-400">
              Os temas acessíveis aplicam contraste, tipografia e densidade como regras — não apenas decoração.
            </p>
          </motion.section>
        )}
      </AnimatePresence>

      <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-surface-200 bg-white/95 px-4 py-3 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[900px] justify-center gap-3">
          {step > 1 && (
            <Button
              type="button"
              variant="secondary"
              onClick={() => setStep((step - 1) as 1 | 2)}
              className="h-12 rounded-xl bg-white px-6"
            >
              Voltar
            </Button>
          )}
          <Button
            type="button"
            variant="cta"
            onClick={primaryAction}
            isLoading={isOutlineLoading || isLoading}
            rightIcon={step < 3 ? <ArrowRight className="h-4 w-4" aria-hidden="true" /> : <Sparkles className="h-4 w-4" aria-hidden="true" />}
            className="h-12 min-w-48 rounded-xl px-7"
          >
            {step === 1 ? "Continuar" : step === 2 ? "Escolher aparência" : "Gerar apresentação"}
          </Button>
        </div>
      </div>
    </div>
  );
}

interface CompactSelectProps {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  formatOption?: (value: string) => string;
}

function CompactSelect({
  label,
  value,
  options,
  onChange,
  placeholder,
  disabled,
  formatOption = (option) => option,
}: CompactSelectProps) {
  return (
    <label className="min-w-0">
      <span className="sr-only">{label}</span>
      <select
        aria-label={label}
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        className="h-11 w-full rounded-full border border-surface-200 bg-surface-100 px-3 text-xs font-bold text-text-700 outline-none transition-colors hover:bg-surface-50 focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((option) => (
          <option key={option} value={option}>{formatOption(option)}</option>
        ))}
      </select>
    </label>
  );
}

export default function NewPresentationPage() {
  return (
    <React.Suspense fallback={<div className="grid min-h-[400px] place-items-center text-sm text-text-500">Carregando criador…</div>}>
      <NewPresentationContent />
    </React.Suspense>
  );
}
