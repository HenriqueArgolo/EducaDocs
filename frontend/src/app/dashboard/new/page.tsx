"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertCircle, ArrowLeft, ArrowRight, Sparkles } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ProgressSteps } from "@/components/ui/progress-steps";
import { StepBncc } from "@/components/create/step-bncc";
import { StepGrade } from "@/components/create/step-grade";
import { StepInstructions } from "@/components/create/step-instructions";
import { StepTopic } from "@/components/create/step-topic";
import { StepType } from "@/components/create/step-type";
import { StepStyle } from "@/components/create/step-style";
import { GenerationLoading } from "@/components/create/generation-loading";
import {
  fetchBnccSkills,
  generateDocument,
  recommendBnccSkills,
  fetchClassrooms,
} from "@/lib/api";
import { wizardStepVariants, wizardTransition } from "@/lib/animations";
import { includeHeaderForDocument } from "@/lib/document-generation";
import {
  EDUCATION_STAGE_OPTIONS,
  filterSkillsForSelection,
  getBnccRecommendationParams,
  getGradeOptionsForStage,
  getSubjectOptionsForSelection,
  type EducationStageValue,
} from "@/lib/bncc-taxonomy";
import {
  documentTypeFromSlug,
  type BNCCSkill,
  type DocumentFormData,
  type PlanningPeriod,
} from "@/lib/types";

const STEPS = ["Tipo", "Estilo", "Filtro", "Tema", "BNCC", "Ajustes"];

function mapClassroomToBncc(classroomGrade: string, classroomSubject: string): { stage: string; grade: string; subject: string } | null {
  let stage: string = "";
  let gradeValue: string = "";
  
  const g = classroomGrade.toLowerCase().trim();
  if (g.includes("bebê") || g.includes("bebe")) {
    stage = "EDUCACAO_INFANTIL";
    gradeValue = "BEBES";
  } else if (g.includes("bem pequena")) {
    stage = "EDUCACAO_INFANTIL";
    gradeValue = "CRIANCAS_BEM_PEQUENAS";
  } else if (g.includes("criança pequena") || g.includes("crianca pequena") || g.includes("pequena")) {
    stage = "EDUCACAO_INFANTIL";
    gradeValue = "CRIANCAS_PEQUENAS";
  } else if (g.includes("1º") || g.includes("1o") || g.includes("1 ")) {
    if (g.includes("médio") || g.includes("medio") || g.includes("em")) {
      stage = "ENSINO_MEDIO";
      gradeValue = "EM_1";
    } else {
      stage = "FUNDAMENTAL_I";
      gradeValue = "1";
    }
  } else if (g.includes("2º") || g.includes("2o") || g.includes("2 ")) {
    if (g.includes("médio") || g.includes("medio") || g.includes("em")) {
      stage = "ENSINO_MEDIO";
      gradeValue = "EM_2";
    } else {
      stage = "FUNDAMENTAL_I";
      gradeValue = "2";
    }
  } else if (g.includes("3º") || g.includes("3o") || g.includes("3 ")) {
    if (g.includes("médio") || g.includes("medio") || g.includes("em")) {
      stage = "ENSINO_MEDIO";
      gradeValue = "EM_3";
    } else {
      stage = "FUNDAMENTAL_I";
      gradeValue = "3";
    }
  } else if (g.includes("4º") || g.includes("4o") || g.includes("4 ")) {
    stage = "FUNDAMENTAL_I";
    gradeValue = "4";
  } else if (g.includes("5º") || g.includes("5o") || g.includes("5 ")) {
    stage = "FUNDAMENTAL_I";
    gradeValue = "5";
  } else if (g.includes("6º") || g.includes("6o") || g.includes("6 ")) {
    stage = "FUNDAMENTAL_II";
    gradeValue = "6";
  } else if (g.includes("7º") || g.includes("7o") || g.includes("7 ")) {
    stage = "FUNDAMENTAL_II";
    gradeValue = "7";
  } else if (g.includes("8º") || g.includes("8o") || g.includes("8 ")) {
    stage = "FUNDAMENTAL_II";
    gradeValue = "8";
  } else if (g.includes("9º") || g.includes("9o") || g.includes("9 ")) {
    stage = "FUNDAMENTAL_II";
    gradeValue = "9";
  } else if (g.includes("médio") || g.includes("medio")) {
    stage = "ENSINO_MEDIO";
    gradeValue = "EM_1";
  } else {
    return null;
  }

  let subjectValue: string = "";
  const s = classroomSubject.toLowerCase().trim();
  
  if (stage === "EDUCACAO_INFANTIL") {
    if (s.includes("eu") || s.includes("outro") || s.includes("nós") || s.includes("nos")) {
      subjectValue = "O_EU_O_OUTRO_E_O_NOS";
    } else if (s.includes("corpo") || s.includes("gesto") || s.includes("movimento")) {
      subjectValue = "CORPO_GESTOS_MOVIMENTOS";
    } else if (s.includes("traço") || s.includes("traco") || s.includes("som") || s.includes("cor") || s.includes("forma")) {
      subjectValue = "TRACOS_SONS_CORES_FORMAS";
    } else if (s.includes("escuta") || s.includes("fala") || s.includes("pensamento") || s.includes("imagina")) {
      subjectValue = "ESCUTA_FALA_PENSAMENTO_IMAGINACAO";
    } else {
      subjectValue = "ESPACOS_TEMPOS_QUANTIDADES_RELACOES_TRANSFORMACOES";
    }
  } else if (stage === "ENSINO_MEDIO") {
    if (s.includes("português") || s.includes("portugues") || s.includes("linguagem")) {
      subjectValue = "LINGUAGENS";
    } else if (s.includes("matemática") || s.includes("matematica")) {
      subjectValue = "MATEMATICA_TECNOLOGIAS";
    } else if (s.includes("natureza") || s.includes("biologia") || s.includes("física") || s.includes("fisica") || s.includes("química") || s.includes("quimica") || s.includes("ciência") || s.includes("ciencia")) {
      subjectValue = "CIENCIAS_NATUREZA";
    } else {
      subjectValue = "CIENCIAS_HUMANAS";
    }
  } else { 
    if (s.includes("português") || s.includes("portugues") || s.includes("língua") || s.includes("lingua")) {
      subjectValue = "PORTUGUES";
    } else if (s.includes("matemática") || s.includes("matematica")) {
      subjectValue = "MATEMATICA";
    } else if (s.includes("ciência") || s.includes("ciencia")) {
      subjectValue = "CIENCIAS";
    } else if (s.includes("história") || s.includes("historia")) {
      subjectValue = "HISTORIA";
    } else if (s.includes("geografia")) {
      subjectValue = "GEOGRAFIA";
    } else if (s.includes("arte")) {
      subjectValue = "ARTE";
    } else if (s.includes("física") || s.includes("fisica")) {
      subjectValue = "EDUCACAO_FISICA";
    } else if (s.includes("religião") || s.includes("religiao") || s.includes("religioso")) {
      subjectValue = "ENSINO_RELIGIOSO";
    } else if (s.includes("inglês") || s.includes("ingles")) {
      subjectValue = "INGLES";
    } else {
      subjectValue = "MATEMATICA"; 
    }
  }

  return { stage, grade: gradeValue, subject: subjectValue };
}

function WizardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialType = documentTypeFromSlug(searchParams.get("type"));
  const topicParam = searchParams.get("topic") ?? "";
  const classroomIdParam = searchParams.get("classroomId");
  const timelineItemIdParam = searchParams.get("timelineItemId");

  const [currentStep, setCurrentStep] = React.useState(0);
  const [direction, setDirection] = React.useState(0);
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [bnccSkills, setBnccSkills] = React.useState<BNCCSkill[]>([]);
  const [isLoadingBncc, setIsLoadingBncc] = React.useState(true);
  const [bnccError, setBnccError] = React.useState<string | null>(null);
  const [generationError, setGenerationError] = React.useState<string | null>(
    null
  );
  const [recommendedIds, setRecommendedIds] = React.useState<number[]>([]);
  const [isRecommending, setIsRecommending] = React.useState(false);
  const [hasRecommendationAttempted, setHasRecommendationAttempted] = React.useState(false);
  const lastRecommendationKeyRef = React.useRef("");
  const recommendationRequestIdRef = React.useRef(0);
  
  const [classroomName, setClassroomName] = React.useState<string | null>(null);
  const [isLockedByClassroom, setIsLockedByClassroom] = React.useState(false);

  const [formData, setFormData] = React.useState<DocumentFormData>({
    documentType: initialType,
    templateStyle: "INSTITUTIONAL",
    stage: null,
    grade: null,
    subject: null,
    bnccSkillIds: [],
    topic: topicParam,
    duration: "50 minutos",
    additionalInstructions: "",
    numberOfQuestions: 5,
    includeHeader: true,
    planningPeriod: "SINGLE" as PlanningPeriod,
  });

  React.useEffect(() => {
    async function loadBncc() {
      setIsLoadingBncc(true);
      setBnccError(null);

      try {
        const skills = await fetchBnccSkills();
        setBnccSkills(skills);
      } catch (err) {
        setBnccError(
          err instanceof Error
            ? err.message
            : "Nao foi possivel carregar a BNCC."
        );
      } finally {
        setIsLoadingBncc(false);
      }
    }

    loadBncc();
  }, []);

  React.useEffect(() => {
    async function loadClassroomContext() {
      if (!classroomIdParam) return;
      try {
        const classroomsList = await fetchClassrooms();
        const currentClassroom = classroomsList.find(c => c.id.toString() === classroomIdParam);
        if (currentClassroom) {
          setClassroomName(currentClassroom.name);
          const bnccMapping = mapClassroomToBncc(currentClassroom.grade, currentClassroom.subject);
          if (bnccMapping) {
            setFormData((prev) => ({
              ...prev,
              stage: bnccMapping.stage,
              grade: bnccMapping.grade,
              subject: bnccMapping.subject,
            }));
            setIsLockedByClassroom(true);
          }
        }
      } catch (err) {
        console.error("Erro ao carregar contexto de turma:", err);
      }
    }

    loadClassroomContext();
  }, [classroomIdParam]);

  const selectedStage = formData.stage as EducationStageValue | null;

  const grades = React.useMemo(
    () => (selectedStage ? getGradeOptionsForStage(selectedStage) : []),
    [selectedStage]
  );

  const subjects = React.useMemo(
    () =>
      selectedStage
        ? getSubjectOptionsForSelection(bnccSkills, selectedStage, formData.grade)
        : [],
    [bnccSkills, formData.grade, selectedStage]
  );

  const filteredBnccSkills = React.useMemo(
    () =>
      filterSkillsForSelection(
        bnccSkills,
        selectedStage,
        formData.grade,
        formData.subject
      ),
    [bnccSkills, formData.grade, formData.subject, selectedStage]
  );

  const selectedGradeLabel =
    grades.find((option) => option.value === formData.grade)?.label ?? null;
  const selectedSubjectLabel =
    subjects.find((option) => option.value === formData.subject)?.label ?? null;

  const bnccRecommendationParams = React.useMemo(
    () => getBnccRecommendationParams(selectedStage, formData.grade, formData.subject),
    [formData.grade, formData.subject, selectedStage]
  );
  const recommendationTopic = formData.topic.trim();

  const requestBnccRecommendation = React.useCallback(async () => {
    if (!bnccRecommendationParams || recommendationTopic.length < 5) {
      return;
    }

    const recommendationKey = [
      bnccRecommendationParams.grade,
      bnccRecommendationParams.subject,
      recommendationTopic,
    ].join("|");

    if (lastRecommendationKeyRef.current === recommendationKey) {
      return;
    }

    lastRecommendationKeyRef.current = recommendationKey;
    const requestId = recommendationRequestIdRef.current + 1;
    recommendationRequestIdRef.current = requestId;
    setHasRecommendationAttempted(true);
    setIsRecommending(true);
    try {
      const response = await recommendBnccSkills({
        grade: bnccRecommendationParams.grade,
        subject: bnccRecommendationParams.subject,
        topic: recommendationTopic,
      });
      if (recommendationRequestIdRef.current !== requestId) {
        return;
      }

      const ids = response?.recommendedIds || [];
      setRecommendedIds(ids);

      if (ids.length > 0) {
        setFormData((prev) => ({
          ...prev,
          bnccSkillIds: prev.bnccSkillIds.length === 0 ? ids : prev.bnccSkillIds,
        }));
      }
    } catch (err) {
      if (recommendationRequestIdRef.current !== requestId) {
        return;
      }

      console.error("Erro ao obter recomendacoes da BNCC:", err);
      setRecommendedIds([]);
    } finally {
      if (recommendationRequestIdRef.current === requestId) {
        setIsRecommending(false);
      }
    }
  }, [bnccRecommendationParams, recommendationTopic]);

  React.useEffect(() => {
    if (!bnccRecommendationParams || recommendationTopic.length < 5) {
      recommendationRequestIdRef.current += 1;
      lastRecommendationKeyRef.current = "";
      const resetTimer = window.setTimeout(() => {
        setRecommendedIds([]);
        setHasRecommendationAttempted(false);
        setIsRecommending(false);
      }, 0);
      return () => window.clearTimeout(resetTimer);
    }

    const timer = window.setTimeout(() => {
      void requestBnccRecommendation();
    }, 700);

    return () => window.clearTimeout(timer);
  }, [bnccRecommendationParams, recommendationTopic, requestBnccRecommendation]);

  function nextStep() {
    if (currentStep === 3) {
      void requestBnccRecommendation();
    }

    if (currentStep < STEPS.length - 1) {
      setDirection(1);
      setCurrentStep((prev) => prev + 1);
      return;
    }

    handleGenerate();
  }

  function prevStep() {
    if (currentStep > 0) {
      setDirection(-1);
      setCurrentStep((prev) => prev - 1);
      return;
    }

    if (classroomIdParam) {
      router.push(`/dashboard/classrooms/${classroomIdParam}`);
    } else {
      router.push("/dashboard");
    }
  }

  async function handleGenerate() {
    if (!formData.documentType) {
      return;
    }

    setIsGenerating(true);
    setGenerationError(null);

    try {
      const doc = await generateDocument({
        documentType: formData.documentType,
        templateStyle: formData.templateStyle,
        bnccSkillIds: formData.bnccSkillIds,
        topic: formData.topic.trim(),
        grade: selectedGradeLabel ?? undefined,
        subject: selectedSubjectLabel ?? undefined,
        duration: formData.duration.trim(),
        additionalInstructions: formData.additionalInstructions.trim(),
        numberOfQuestions: formData.numberOfQuestions,
        includeHeader: includeHeaderForDocument(formData.documentType, formData.includeHeader),
        planningPeriod: formData.planningPeriod,
        classroomId: classroomIdParam ? parseInt(classroomIdParam) : undefined,
        timelineItemId: timelineItemIdParam ? parseInt(timelineItemIdParam) : undefined,
      });

      if (classroomIdParam) {
        router.push(`/dashboard/classrooms/${classroomIdParam}`);
      } else {
        router.push(`/dashboard/document/${doc.id}`);
      }
    } catch (err) {
      setGenerationError(
        err instanceof Error
          ? err.message
          : "Nao foi possivel gerar o documento."
      );
      setIsGenerating(false);
    }
  }

  function canProceed() {
    switch (currentStep) {
      case 0:
        return Boolean(formData.documentType);
      case 1:
        return Boolean(formData.templateStyle);
      case 2:
        return Boolean(formData.stage && formData.grade && formData.subject);
      case 3:
        return formData.topic.trim().length >= 5;
      case 4:
        return formData.bnccSkillIds.length > 0;
      case 5:
        return formData.duration.trim().length > 0;
      default:
        return false;
    }
  }

  if (isGenerating && formData.documentType) {
    return <GenerationLoading type={formData.documentType} />;
  }

  return (
    <div className="max-w-4xl mx-auto pb-24">
      <div className="mb-8 flex items-center justify-between">
        <button
          type="button"
          onClick={prevStep}
          className="p-2 text-text-400 hover:text-text-100 bg-surface-100 rounded-lg shadow-sm border border-surface-200 transition-colors"
          aria-label="Voltar"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <span className="font-medium text-text-500">
          Etapa {currentStep + 1} de {STEPS.length}
        </span>
      </div>

      <div className="mb-12">
        <ProgressSteps steps={STEPS} currentStep={currentStep} />
      </div>

      {generationError && (
        <div className="mb-6 rounded-lg border border-error-500 bg-error-50 p-4 text-sm text-error-600 flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          {generationError}
        </div>
      )}

      <div className="relative min-h-[440px] bg-surface-0 rounded-xl shadow-sm border border-surface-200 p-6 md:p-10 overflow-hidden">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={currentStep}
            custom={direction}
            variants={wizardStepVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={wizardTransition}
            className="h-full"
          >
            {currentStep === 0 && (
              <StepType
                value={formData.documentType}
                onChange={(documentType) =>
                  setFormData({ ...formData, documentType })
                }
              />
            )}
            {currentStep === 1 && (
              <StepStyle
                value={formData.templateStyle}
                onChange={(templateStyle) =>
                  setFormData({ ...formData, templateStyle })
                }
              />
            )}
            {currentStep === 2 && (
              <div className={isLockedByClassroom ? "pointer-events-none opacity-80" : ""}>
                {isLockedByClassroom && (
                  <div className="mb-6 p-4 bg-primary/10 border border-primary/20 rounded-xl text-sm text-primary font-medium flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-primary" />
                    Série e Disciplina pré-preenchidas com base na turma: <strong className="text-primary">{classroomName}</strong>
                  </div>
                )}
                <StepGrade
                  stage={formData.stage}
                  grade={formData.grade}
                  subject={formData.subject}
                  stages={EDUCATION_STAGE_OPTIONS}
                  grades={grades}
                  subjects={subjects}
                  isLoading={isLoadingBncc}
                  hasSkills={bnccSkills.length > 0}
                  error={bnccError}
                  onStageChange={(stage) =>
                    setFormData({
                      ...formData,
                      stage,
                      grade: null,
                      subject: null,
                      bnccSkillIds: [],
                    })
                  }
                  onGradeChange={(grade) =>
                    setFormData({
                      ...formData,
                      grade,
                      subject: null,
                      bnccSkillIds: [],
                    })
                  }
                  onSubjectChange={(subject) =>
                    setFormData({ ...formData, subject, bnccSkillIds: [] })
                  }
                />
              </div>
            )}
            {currentStep === 3 && (
              <StepTopic
                value={formData.topic}
                onChange={(topic) => setFormData({ ...formData, topic })}
              />
            )}
            {currentStep === 4 && (
              <StepBncc
                skills={filteredBnccSkills}
                selectedIds={formData.bnccSkillIds}
                onChange={(bnccSkillIds) =>
                  setFormData({ ...formData, bnccSkillIds })
                }
                topic={formData.topic}
                recommendedIds={recommendedIds}
                isRecommending={isRecommending}
                hasRecommendationAttempted={hasRecommendationAttempted}
              />
            )}
            {currentStep === 5 && (
              <StepInstructions
                duration={formData.duration}
                instructions={formData.additionalInstructions}
                onDurationChange={(duration) =>
                  setFormData({ ...formData, duration })
                }
                onInstructionsChange={(additionalInstructions) =>
                  setFormData({ ...formData, additionalInstructions })
                }
                documentType={formData.documentType}
                numberOfQuestions={formData.numberOfQuestions}
                onNumberOfQuestionsChange={(numberOfQuestions) =>
                  setFormData({ ...formData, numberOfQuestions })
                }
                includeHeader={formData.includeHeader}
                onIncludeHeaderChange={(includeHeader) =>
                  setFormData({ ...formData, includeHeader })
                }
                planningPeriod={formData.planningPeriod}
                onPlanningPeriodChange={(planningPeriod) =>
                  setFormData({ ...formData, planningPeriod })
                }
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="fixed bottom-0 left-0 right-0 md:relative md:mt-8 p-4 md:p-0 bg-surface-50 md:bg-transparent border-t border-surface-200 md:border-none shadow-[0_-10px_20px_rgba(0,0,0,0.05)] md:shadow-none z-40">
        <div className="max-w-3xl mx-auto flex justify-between items-center">
          <Button variant="ghost" onClick={prevStep} className="md:px-6">
            Voltar
          </Button>

          <Button
            variant="primary"
            size="lg"
            onClick={nextStep}
            disabled={!canProceed()}
            rightIcon={
              currentStep === STEPS.length - 1 ? (
                <Sparkles className="w-5 h-5" />
              ) : (
                <ArrowRight className="w-5 h-5" />
              )
            }
          >
            {currentStep === STEPS.length - 1
              ? "Gerar documento"
              : "Continuar"}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function NewDocumentWizard() {
  return (
    <React.Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[400px]">
          Carregando...
        </div>
      }
    >
      <WizardContent />
    </React.Suspense>
  );
}
