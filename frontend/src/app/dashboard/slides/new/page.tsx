"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Sparkles, AlertCircle, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { generatePresentation, fetchClassrooms, updateTimelineItem } from "@/lib/api";

const SUBJECT_OPTIONS = [
  "Matemática", "Português", "História", "Geografia", "Ciências", "Biologia", "Física", "Química", "Artes", "Inglês"
];

const GRADE_OPTIONS = [
  "Educação Infantil", "1º Ano (Fundamental I)", "2º Ano (Fundamental I)", "3º Ano (Fundamental I)", 
  "4º Ano (Fundamental I)", "5º Ano (Fundamental I)", "6º Ano (Fundamental II)", "7º Ano (Fundamental II)",
  "8º Ano (Fundamental II)", "9º Ano (Fundamental II)", "1º Ano (Ensino Médio)", "2º Ano (Ensino Médio)",
  "3º Ano (Ensino Médio)"
];

function mapClassroomGradeToSlidesPreset(classroomGrade: string): string {
  const g = classroomGrade.toLowerCase();
  if (g.includes("infantil")) return "Educação Infantil";
  if (g.includes("1")) {
    if (g.includes("médio") || g.includes("medio") || g.includes("em")) return "1º Ano (Ensino Médio)";
    return "1º Ano (Fundamental I)";
  }
  if (g.includes("2")) {
    if (g.includes("médio") || g.includes("medio") || g.includes("em")) return "2º Ano (Ensino Médio)";
    return "2º Ano (Fundamental I)";
  }
  if (g.includes("3")) {
    if (g.includes("médio") || g.includes("medio") || g.includes("em")) return "3º Ano (Ensino Médio)";
    return "3º Ano (Fundamental I)";
  }
  if (g.includes("4")) return "4º Ano (Fundamental I)";
  if (g.includes("5")) return "5º Ano (Fundamental I)";
  if (g.includes("6")) return "6º Ano (Fundamental II)";
  if (g.includes("7")) return "7º Ano (Fundamental II)";
  if (g.includes("8")) return "8º Ano (Fundamental II)";
  if (g.includes("9")) return "9º Ano (Fundamental II)";
  return "1º Ano (Fundamental I)";
}

function mapClassroomSubjectToSlidesPreset(classroomSubject: string): string {
  const s = classroomSubject.toLowerCase();
  if (s.includes("mat")) return "Matemática";
  if (s.includes("port") || s.includes("ling")) return "Português";
  if (s.includes("his")) return "História";
  if (s.includes("geo")) return "Geografia";
  if (s.includes("cie") || s.includes("ciê")) return "Ciências";
  if (s.includes("bio")) return "Biologia";
  if (s.includes("fis") || s.includes("fís")) return "Física";
  if (s.includes("qui") || s.includes("quí")) return "Química";
  if (s.includes("art")) return "Artes";
  if (s.includes("ing")) return "Inglês";
  return "Matemática";
}

function NewPresentationContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const topicParam = searchParams.get("topic") ?? "";
  const classroomIdParam = searchParams.get("classroomId");
  const timelineItemIdParam = searchParams.get("timelineItemId");

  const [formData, setFormData] = React.useState({
    topic: topicParam,
    grade: "",
    subject: "",
    additionalInstructions: ""
  });
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const [classroomName, setClassroomName] = React.useState<string | null>(null);
  const [isLockedByClassroom, setIsLockedByClassroom] = React.useState(false);

  React.useEffect(() => {
    async function loadClassroomContext() {
      if (!classroomIdParam) return;
      try {
        const classroomsList = await fetchClassrooms();
        const currentClassroom = classroomsList.find(c => c.id.toString() === classroomIdParam);
        if (currentClassroom) {
          setClassroomName(currentClassroom.name);
          setFormData((prev) => ({
            ...prev,
            grade: mapClassroomGradeToSlidesPreset(currentClassroom.grade),
            subject: mapClassroomSubjectToSlidesPreset(currentClassroom.subject)
          }));
          setIsLockedByClassroom(true);
        }
      } catch (err) {
        console.error("Erro ao carregar contexto de turma:", err);
      }
    }
    loadClassroomContext();
  }, [classroomIdParam]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.topic || !formData.grade || !formData.subject) {
      setError("Por favor, preencha todos os campos obrigatórios.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const presentation = await generatePresentation(formData);
      
      if (classroomIdParam && timelineItemIdParam) {
        await updateTimelineItem(classroomIdParam, timelineItemIdParam, {
          title: presentation.title,
          description: presentation.topic,
          type: "SLIDES",
          presentationId: presentation.id
        });
        router.push(`/dashboard/classrooms/${classroomIdParam}`);
      } else {
        router.push(`/dashboard/slides/${presentation.id}`);
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Erro ao gerar a apresentação de slides. Tente novamente."
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto pb-16">
      {/* Voltar */}
      <div className="mb-6">
        <Link 
          href={classroomIdParam ? `/dashboard/classrooms/${classroomIdParam}` : "/dashboard/slides"} 
          className="inline-flex items-center text-xs font-semibold text-text-500 hover:text-text-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-1.5" />
          {classroomIdParam ? "Voltar para Turma" : "Voltar para Apresentações"}
        </Link>
      </div>

      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-extrabold text-text-900 tracking-tight flex items-center gap-2">
            <Sparkles className="w-7 h-7 text-primary-500 animate-pulse" />
            Nova Apresentação de Slides
          </h1>
          <p className="text-text-500 mt-1.5">
            Preencha os detalhes e nossa IA desenhará os slides pedagógicos completos com ilustrações automáticas.
          </p>
        </div>

        {error && (
          <div className="p-4 bg-error-50 border border-error-200 rounded-xl text-error-800 text-xs flex items-start gap-2.5 shadow-sm">
            <AlertCircle className="w-5 h-5 text-error-500 shrink-0" />
            <div>
              <strong className="font-bold block mb-0.5">Ocorreu um erro:</strong>
              {error}
            </div>
          </div>
        )}

        <Card className="p-6 sm:p-8 bg-surface-0 border-surface-200 rounded-2xl shadow-xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {isLockedByClassroom && (
              <div className="p-4 bg-primary/10 border border-primary/20 rounded-xl text-sm text-primary font-medium flex items-center gap-2 mb-4">
                <Sparkles className="w-4 h-4 text-primary" />
                Série e Disciplina pré-preenchidas com base na turma: <strong className="text-primary">{classroomName}</strong>
              </div>
            )}

            {/* 1. DISCIPLINA */}
            <div>
              <label className="block text-xs font-bold text-text-700 uppercase tracking-wider mb-2">
                Matéria / Disciplina *
              </label>
              <div className={`grid grid-cols-2 sm:grid-cols-5 gap-2 ${isLockedByClassroom ? "pointer-events-none opacity-80" : ""}`}>
                {SUBJECT_OPTIONS.map((sub) => (
                  <button
                    key={sub}
                    type="button"
                    disabled={isLockedByClassroom}
                    onClick={() => setFormData({ ...formData, subject: sub })}
                    className={`px-3 py-2 text-xs font-bold rounded-lg border transition-all text-center cursor-pointer ${
                      formData.subject === sub
                        ? "bg-primary-600 border-primary-600 text-white shadow-sm"
                        : "bg-surface-0 border-surface-200 text-text-600 hover:bg-surface-50 hover:border-surface-300"
                    }`}
                  >
                    {sub}
                  </button>
                ))}
              </div>
            </div>

            {/* 2. SÉRIE */}
            <div>
              <label className="block text-xs font-bold text-text-700 uppercase tracking-wider mb-2">
                Série / Ano de Ensino *
              </label>
              <select
                value={formData.grade}
                disabled={isLockedByClassroom}
                onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                className="w-full h-11 px-3 bg-surface-0 border border-surface-200 rounded-lg text-sm text-text-800 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-shadow disabled:opacity-80"
              >
                <option value="">Selecione o nível escolar...</option>
                {GRADE_OPTIONS.map((g) => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>

            {/* 3. TEMA / ASSUNTO */}
            <div>
              <label className="block text-xs font-bold text-text-700 uppercase tracking-wider mb-2 flex items-center justify-between">
                <span>Tema ou Tópico Central *</span>
                <span className="text-[10px] text-text-400 normal-case font-medium">Ex: Ciclo da Água, Frações de Pizza</span>
              </label>
              <Input
                value={formData.topic}
                onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                placeholder="Qual conteúdo os slides devem ensinar?"
                className="h-11 text-sm bg-white"
                required
              />
            </div>

            {/* 4. INSTRUÇÕES ADICIONAIS */}
            <div>
              <label className="block text-xs font-bold text-text-700 uppercase tracking-wider mb-2 flex items-center gap-1">
                Instruções Pedagógicas Extras (Opcional)
                <span className="text-text-400 cursor-help" title="Diga à IA se prefere foco teórico, prático, metodologias ativas ou tópicos específicos.">
                  <HelpCircle className="w-3.5 h-3.5" />
                </span>
              </label>
              <Textarea
                value={formData.additionalInstructions}
                onChange={(e) => setFormData({ ...formData, additionalInstructions: e.target.value })}
                placeholder="Ex: Foco em atividades experimentais e dinâmicas de grupo. Evitar termos matemáticos muito avançados."
                className="min-h-[110px] text-xs bg-white resize-none"
                maxLength={1000}
              />
            </div>

            {/* BOTÃO SUBMIT */}
            <div className="pt-4">
              <Button
                type="submit"
                variant="primary"
                className="w-full h-12 text-sm font-bold shadow-md shadow-primary-500/10 justify-center rounded-xl"
                isLoading={isLoading}
                leftIcon={<Sparkles className="w-4.5 h-4.5" />}
              >
                {isLoading ? "Criando slides..." : "Gerar Apresentação de Slides"}
              </Button>
            </div>

          </form>
        </Card>
      </div>
    </div>
  );
}

export default function NewPresentationPage() {
  return (
    <React.Suspense fallback={<div className="flex items-center justify-center min-h-[400px]">Carregando...</div>}>
      <NewPresentationContent />
    </React.Suspense>
  );
}
