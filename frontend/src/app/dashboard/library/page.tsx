"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen,
  Search,
  Sparkles,
  Printer,
  ChevronLeft,
  ChevronRight,
  Filter,
  Plus,
  Loader2,
  Trash2,
  Calendar,
  Layers,
  HelpCircle,
  FileText,
  AlertCircle
} from "lucide-react";
import {
  fetchActivities,
  generateActivity,
  deleteActivity,
  PageResponse,
  getCachedData,
  fetchClassrooms,
  updateTimelineItem,
} from "@/lib/api";
import type { ActivityMaterial, ActivityType } from "@/lib/types";
import { ACTIVITY_TYPE_LABELS } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const PRESET_GRADES = [
  "Educação Infantil",
  "Maternal",
  "1º Ano",
  "2º Ano",
  "3º Ano",
  "4º Ano",
  "5º Ano",
  "Ensino Fundamental"
];

const PRESET_SUBJECTS = [
  "Artes",
  "Matemática",
  "Português",
  "Educação Física",
  "Ciências",
  "História",
  "Geografia",
  "Ensino Religioso",
  "Inglês",
  "Música"
];

function mapClassroomGradeToPreset(classroomGrade: string): string {
  const g = classroomGrade.toLowerCase();
  if (g.includes("infantil")) return "Educação Infantil";
  if (g.includes("maternal")) return "Maternal";
  if (g.includes("1")) return "1º Ano";
  if (g.includes("2")) return "2º Ano";
  if (g.includes("3")) return "3º Ano";
  if (g.includes("4")) return "4º Ano";
  if (g.includes("5")) return "5º Ano";
  return "Ensino Fundamental";
}

function mapClassroomSubjectToPreset(classroomSubject: string): string {
  const s = classroomSubject.toLowerCase();
  if (s.includes("art")) return "Artes";
  if (s.includes("mat")) return "Matemática";
  if (s.includes("port") || s.includes("ling")) return "Português";
  if (s.includes("fis") || s.includes("fís")) return "Educação Física";
  if (s.includes("cie") || s.includes("ciê")) return "Ciências";
  if (s.includes("his")) return "História";
  if (s.includes("geo")) return "Geografia";
  if (s.includes("rel")) return "Ensino Religioso";
  if (s.includes("ing")) return "Inglês";
  if (s.includes("mus") || s.includes("mús")) return "Música";
  return "Matemática";
}

function LibraryContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const tabParam = searchParams.get("tab");
  const topicParam = searchParams.get("topic") ?? "";
  const classroomIdParam = searchParams.get("classroomId");
  const timelineItemIdParam = searchParams.get("timelineItemId");

  const [activeTab, setActiveTab] = React.useState<"explore" | "generate">(() => {
    return tabParam === "generate" ? "generate" : "explore";
  });
  
  // Listagem e Filtros
  const [materials, setMaterials] = React.useState<ActivityMaterial[]>(() => {
    if (typeof window === "undefined") return [];
    const cached = getCachedData<PageResponse<ActivityMaterial>>("/activities?page=0&size=12");
    return cached ? (cached.content || []) : [];
  });
  const [isLoading, setIsLoading] = React.useState(() => {
    if (typeof window === "undefined") return true;
    const cached = getCachedData<PageResponse<ActivityMaterial>>("/activities?page=0&size=12");
    return !cached;
  });
  const [error, setError] = React.useState<string | null>(null);
  
  const [filterType, setFilterType] = React.useState<ActivityType | null>(null);
  const [filterGrade, setFilterGrade] = React.useState<string | null>(null);
  const [filterSubject, setFilterSubject] = React.useState<string | null>(null);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [debouncedSearch, setDebouncedSearch] = React.useState("");

  const [currentPage, setCurrentPage] = React.useState(0);
  const [totalPages, setTotalPages] = React.useState(() => {
    if (typeof window === "undefined") return 0;
    const cached = getCachedData<PageResponse<ActivityMaterial>>("/activities?page=0&size=12");
    return cached ? (cached.totalPages || 0) : 0;
  });
  const [totalElements, setTotalElements] = React.useState(() => {
    if (typeof window === "undefined") return 0;
    const cached = getCachedData<PageResponse<ActivityMaterial>>("/activities?page=0&size=12");
    return cached ? (cached.totalElements || 0) : 0;
  });
  const PAGE_SIZE = 12;

  // Reset da página quando filtros mudarem
  React.useEffect(() => {
    setCurrentPage(0);
  }, [filterType, filterGrade, filterSubject, debouncedSearch]);

  // Gerador por IA
  const [genTopic, setGenTopic] = React.useState(topicParam);
  const [genType, setGenType] = React.useState<ActivityType>("COLORING_BOOK");
  const [genGrade, setGenGrade] = React.useState("Educação Infantil");
  const [genSubject, setGenSubject] = React.useState("Artes");
  const [genFormat, setGenFormat] = React.useState<"MARCAR" | "ESCREVER" | "MISTA">("MISTA");
  const [genInstructions, setGenInstructions] = React.useState("");
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [genError, setGenError] = React.useState<string | null>(null);

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
          setGenGrade(mapClassroomGradeToPreset(currentClassroom.grade));
          setGenSubject(mapClassroomSubjectToPreset(currentClassroom.subject));
          setIsLockedByClassroom(true);
        }
      } catch (err) {
        console.error("Erro ao carregar contexto de turma:", err);
      }
    }
    loadClassroomContext();
  }, [classroomIdParam]);

  // Debounce da busca de texto
  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 400);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  const loadMaterials = React.useCallback(async () => {
    const searchParams = new URLSearchParams();
    if (filterType) searchParams.set("type", filterType);
    if (filterGrade) searchParams.set("grade", filterGrade);
    if (filterSubject) searchParams.set("subject", filterSubject);
    if (debouncedSearch) searchParams.set("search", debouncedSearch);
    searchParams.set("page", String(currentPage));
    searchParams.set("size", String(PAGE_SIZE));
    const cacheKey = `/activities?${searchParams.toString()}`;

    const cached = getCachedData<PageResponse<ActivityMaterial>>(cacheKey);
    if (cached) {
      setMaterials(cached.content || []);
      setTotalPages(cached.totalPages || 0);
      setTotalElements(cached.totalElements || 0);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const response = await fetchActivities({
        type: filterType,
        grade: filterGrade,
        subject: filterSubject,
        search: debouncedSearch || null,
        page: currentPage,
        size: PAGE_SIZE
      });
      setMaterials(response.content || []);
      setTotalPages(response.totalPages || 0);
      setTotalElements(response.totalElements || 0);
    } catch (err) {
      setError("Não foi possível carregar os materiais. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  }, [filterType, filterGrade, filterSubject, debouncedSearch, currentPage]);

  React.useEffect(() => {
    loadMaterials();
  }, [loadMaterials]);

  // Ação de Geração
  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    if (!genTopic.trim()) {
      setGenError("Por favor, informe o tema ou assunto.");
      return;
    }

    setIsGenerating(true);
    setGenError(null);

    try {
      const material = await generateActivity({
        topic: genTopic.trim(),
        type: genType,
        grade: genGrade,
        subject: genSubject,
        additionalInstructions: genInstructions.trim(),
        questionFormat: genType === "WORKSHEET" ? genFormat : undefined
      });
      
      // Limpa formulário
      setGenTopic("");
      setGenInstructions("");

      if (classroomIdParam && timelineItemIdParam) {
        await updateTimelineItem(classroomIdParam, timelineItemIdParam, {
          title: material.title,
          description: material.description,
          type: "ACTIVITY",
          activityId: material.id
        });
        router.push(`/dashboard/classrooms/${classroomIdParam}`);
      } else {
        router.push(`/dashboard/library/${material.id}`);
      }
    } catch (err) {
      setGenError(
        err instanceof Error ? err.message : "Erro ao gerar material. Tente novamente."
      );
      setIsGenerating(false);
    }
  }

  // Ação de Exclusão
  async function handleDelete(id: number, e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    
    if (!confirm("Tem certeza que deseja excluir este material de sua biblioteca pessoal?")) {
      return;
    }

    try {
      await deleteActivity(id);
      setMaterials((prev) => prev.filter((m) => m.id !== id));
    } catch (err) {
      alert("Não foi possível excluir o material.");
    }
  }

  return (
    <div className="max-w-6xl mx-auto pb-20">
      {/* Título da Seção */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl md:text-4xl font-bold text-text-900 mb-2 flex items-center gap-3">
          <BookOpen className="w-8 h-8 text-primary-600" />
          Biblioteca de Recursos Didáticos
        </h1>
        <p className="text-lg text-text-500">
          Encontre desenhos para colorir, fichas de atividades e jogos rápidos prontos para impressão.
        </p>
      </motion.div>

      {/* Abas Superiores Estilo Switcher Premium */}
      <div className="flex border-b border-surface-200 mb-8 relative">
        <button
          onClick={() => setActiveTab("explore")}
          className={`px-6 py-3 font-semibold text-sm transition-all relative cursor-pointer ${
            activeTab === "explore" ? "text-primary-600" : "text-text-500 hover:text-text-800"
          }`}
        >
          Explorar Banco de Recursos
          {activeTab === "explore" && (
            <motion.div
              layoutId="library-tab-underline"
              className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600"
            />
          )}
        </button>
        <button
          onClick={() => setActiveTab("generate")}
          className={`px-6 py-3 font-semibold text-sm transition-all relative cursor-pointer flex items-center gap-1.5 ${
            activeTab === "generate" ? "text-primary-600" : "text-text-500 hover:text-text-800"
          }`}
        >
          <Sparkles className="w-4 h-4" />
          Gerar Atividade com IA
          {activeTab === "generate" && (
            <motion.div
              layoutId="library-tab-underline"
              className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600"
            />
          )}
        </button>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === "explore" ? (
          <motion.div
            key="explore-tab"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            transition={{ duration: 0.2 }}
          >
            {/* Barra de Busca e Filtros */}
            <div className="bg-surface-0 border border-surface-200 rounded-xl p-5 mb-8 flex flex-col gap-4 shadow-sm">
              <div className="flex flex-col md:flex-row gap-4">
                {/* Campo de Busca */}
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-400" />
                  <Input
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Pesquisar por título ou palavra-chave..."
                    className="pl-10 h-12"
                  />
                </div>
                {/* Filtro de Tipo */}
                <div className="w-full md:w-56">
                  <select
                    value={filterType || ""}
                    onChange={(e) => setFilterType((e.target.value as ActivityType) || null)}
                    className="w-full h-12 px-3 border border-surface-200 rounded-md bg-white text-text-700 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">Todos os Tipos</option>
                    <option value="COLORING_BOOK">Livros de Colorir</option>
                    <option value="WORKSHEET">Fichas de Atividades</option>
                    <option value="FLASHCARD">Fichas de Estudo</option>
                    <option value="GAME">Dinâmicas e Jogos</option>
                  </select>
                </div>
              </div>

              {/* Filtros Secundários */}
              <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-surface-100 text-sm">
                <span className="text-text-400 flex items-center gap-1 font-medium">
                  <Filter className="w-4 h-4" />
                  Filtrar por:
                </span>
                {/* Grade filter */}
                <select
                  value={filterGrade || ""}
                  onChange={(e) => setFilterGrade(e.target.value || null)}
                  className="px-3 py-1.5 border border-surface-200 rounded bg-white text-text-600 text-xs focus:ring-1 focus:ring-primary-500"
                >
                  <option value="">Nível de Ensino (Todos)</option>
                  {PRESET_GRADES.map((g) => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
                {/* Subject filter */}
                <select
                  value={filterSubject || ""}
                  onChange={(e) => setFilterSubject(e.target.value || null)}
                  className="px-3 py-1.5 border border-surface-200 rounded bg-white text-text-600 text-xs focus:ring-1 focus:ring-primary-500"
                >
                  <option value="">Disciplina (Todas)</option>
                  {PRESET_SUBJECTS.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>

                {/* Reset button */}
                {(filterType || filterGrade || filterSubject || searchTerm) && (
                  <button
                    onClick={() => {
                      setFilterType(null);
                      setFilterGrade(null);
                      setFilterSubject(null);
                      setSearchTerm("");
                    }}
                    className="text-primary-600 hover:text-primary-700 text-xs font-semibold cursor-pointer ml-auto"
                  >
                    Limpar filtros
                  </button>
                )}
              </div>
            </div>

            {/* Listagem de Recursos */}
            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-60 rounded-xl bg-surface-100 animate-shimmer" />
                ))}
              </div>
            ) : error ? (
              <div className="text-center p-12 bg-surface-0 border border-surface-200 rounded-xl">
                <p className="text-error-500 font-medium">{error}</p>
                <Button onClick={loadMaterials} className="mt-4" variant="outline">
                  Tentar Novamente
                </Button>
              </div>
            ) : materials.length === 0 ? (
              <div className="text-center p-16 bg-surface-0 border border-surface-200 rounded-xl max-w-md mx-auto shadow-sm">
                <BookOpen className="w-12 h-12 text-text-300 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-text-900 mb-1">Nenhum recurso encontrado</h3>
                <p className="text-sm text-text-500 mb-6 leading-relaxed">
                  Tente alterar seus termos de busca ou clique na aba para criar uma nova atividade customizada com IA!
                </p>
                <Button onClick={() => setActiveTab("generate")} leftIcon={<Sparkles className="w-4 h-4" />}>
                  Gerar novo recurso
                </Button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {materials.map((item, index) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.04 }}
                    >
                      <Link href={`/dashboard/library/${item.id}`} className="block h-full group">
                        <Card className="h-full flex flex-col justify-between hover:shadow-lg transition-all duration-300 border border-surface-200 hover:border-primary-500/25 relative overflow-hidden group">
                          {/* Gradiente sutil decorativo de acordo com o tipo */}
                          <div className={`absolute top-0 left-0 right-0 h-1.5 ${
                            item.type === "COLORING_BOOK" ? "bg-amber-400" :
                            item.type === "WORKSHEET" ? "bg-blue-500" :
                            item.type === "FLASHCARD" ? "bg-emerald-500" : "bg-purple-500"
                          }`} />
                          
                          <div className="p-6 flex-1 flex flex-col">
                            {/* Tipo e Selo de Privacidade */}
                            <div className="flex items-center justify-between gap-2 mb-3">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-text-400">
                                {ACTIVITY_TYPE_LABELS[item.type]}
                              </span>
                              {!item.isPublic && (
                                <span className="text-[9px] bg-purple-50 text-purple-700 font-semibold px-2 py-0.5 rounded-full border border-purple-100">
                                  Pessoal
                                </span>
                              )}
                            </div>

                            {/* Título e Descrição */}
                            <h3 className="font-bold text-lg text-text-900 group-hover:text-primary-600 transition-colors mb-2 leading-snug">
                              {item.title}
                            </h3>
                            <p className="text-sm text-text-500 leading-relaxed mb-4 flex-1 line-clamp-3">
                              {item.description}
                            </p>

                            {/* Tags de Filtro */}
                            <div className="flex flex-wrap gap-1.5 mt-auto">
                              <Badge variant="secondary" className="text-[10px] py-0 px-2 font-medium">
                                {item.grade}
                              </Badge>
                              <Badge variant="outline" className="text-[10px] py-0 px-2 font-medium text-primary-600 border-primary-200">
                                {item.subject}
                              </Badge>
                            </div>
                          </div>

                          {/* Botões de Ação no Rodapé do Card */}
                          <div className="border-t border-surface-100 px-6 py-4 flex items-center justify-between bg-surface-50 group-hover:bg-surface-0 transition-colors">
                            <span className="text-xs text-primary-500 font-bold flex items-center gap-1">
                              Visualizar e Imprimir
                              <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                            </span>
                            {!item.isPublic && (
                              <button
                                onClick={(e) => handleDelete(item.id, e)}
                                className="text-text-400 hover:text-error-500 p-1.5 hover:bg-error-50 rounded-lg transition-colors cursor-pointer"
                                title="Excluir da biblioteca pessoal"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </Card>
                      </Link>
                    </motion.div>
                  ))}
                </div>

                {/* Paginação Premium */}
                {totalPages > 1 && (
                  <div className="flex flex-col sm:flex-row items-center justify-between mt-10 border-t border-surface-200 pt-6 gap-4">
                    <span className="text-xs text-text-500 font-medium">
                      Mostrando <span className="font-semibold text-text-700">{materials.length}</span> de{" "}
                      <span className="font-semibold text-text-700">{totalElements}</span> recursos
                    </span>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={currentPage === 0}
                        onClick={() => setCurrentPage((p) => p - 1)}
                        leftIcon={<ChevronLeft className="w-4 h-4" />}
                      >
                        Anterior
                      </Button>
                      <div className="flex items-center gap-1.5">
                        {(() => {
                          const range = [];
                          const maxVisible = 5;
                          let start = Math.max(0, currentPage - Math.floor(maxVisible / 2));
                          let end = Math.min(totalPages - 1, start + maxVisible - 1);
                          
                          if (end - start + 1 < maxVisible) {
                            start = Math.max(0, end - maxVisible + 1);
                          }
                          
                          for (let i = start; i <= end; i++) {
                            range.push(i);
                          }
                          
                          return range.map((idx) => (
                            <Button
                              key={idx}
                              variant={currentPage === idx ? "primary" : "outline"}
                              size="sm"
                              className="w-9 h-9 p-0"
                              onClick={() => setCurrentPage(idx)}
                            >
                              {idx + 1}
                            </Button>
                          ));
                        })()}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={currentPage === totalPages - 1}
                        onClick={() => setCurrentPage((p) => p + 1)}
                        rightIcon={<ChevronRight className="w-4 h-4" />}
                      >
                        Próximo
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="generate-tab"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.2 }}
            className="max-w-2xl mx-auto"
          >
            <Card className="p-8 border border-surface-200 shadow-md">
              <div className="mb-6 text-center">
                <div className="inline-flex p-3 bg-primary-50 border border-primary-100 rounded-2xl text-primary-600 mb-4 animate-pulse-glow">
                  <Sparkles className="w-6 h-6" />
                </div>
                <h2 className="text-2xl font-bold text-text-900 mb-2">Criar Novo Recurso por IA</h2>
                <p className="text-text-500">
                  Descreva qual conteúdo ou desenho você deseja gerar e a IA criará uma ficha otimizada e pronta para imprimir.
                </p>
              </div>

              {genError && (
                <div className="mb-6 rounded-lg border border-error-500 bg-error-50 p-4 text-sm text-error-600 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  {genError}
                </div>
              )}

              <form onSubmit={handleGenerate} className="space-y-6">
                {isLockedByClassroom && (
                  <div className="p-4 bg-primary/10 border border-primary/20 rounded-xl text-sm text-primary font-medium flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-primary" />
                    Série e Disciplina pré-preenchidas com base na turma: <strong className="text-primary">{classroomName}</strong>
                  </div>
                )}

                {/* 1. Tipo de Recurso */}
                <div>
                  <label className="block text-sm font-semibold text-text-700 mb-2">
                    Tipo de Recurso
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {(Object.keys(ACTIVITY_TYPE_LABELS) as ActivityType[]).map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setGenType(type)}
                        className={`p-3 text-left border rounded-xl flex items-center gap-3 transition-all cursor-pointer ${
                          genType === type
                            ? "border-primary-500 bg-primary-500/5 text-primary-900 font-bold"
                            : "border-surface-200 hover:border-surface-300 text-text-600"
                        }`}
                      >
                        <span className={`w-2.5 h-2.5 rounded-full ${
                          type === "COLORING_BOOK" ? "bg-amber-400" :
                          type === "WORKSHEET" ? "bg-blue-500" :
                          type === "FLASHCARD" ? "bg-emerald-500" : "bg-purple-500"
                        }`} />
                        <span className="text-xs">{ACTIVITY_TYPE_LABELS[type]}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 2. Série e Disciplina */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-text-700 mb-2">
                      Série / Ano
                    </label>
                    <select
                      value={genGrade}
                      onChange={(e) => setGenGrade(e.target.value)}
                      disabled={isLockedByClassroom}
                      className="w-full h-11 px-3 border border-surface-200 rounded-lg bg-white text-text-700 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-80"
                    >
                      {PRESET_GRADES.map((g) => (
                        <option key={g} value={g}>{g}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-text-700 mb-2">
                      Disciplina
                    </label>
                    <select
                      value={genSubject}
                      onChange={(e) => setGenSubject(e.target.value)}
                      disabled={isLockedByClassroom}
                      className="w-full h-11 px-3 border border-surface-200 rounded-lg bg-white text-text-700 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-80"
                    >
                      {PRESET_SUBJECTS.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Formato das Questões (apenas para Fichas de Atividades) */}
                {genType === "WORKSHEET" && (
                  <div>
                    <label className="block text-sm font-semibold text-text-700 mb-2">
                      Formato das Questões
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { val: "MARCAR", label: "Múltipla Escolha (Marcar)" },
                        { val: "ESCREVER", label: "Discursivas (Escrever)" },
                        { val: "MISTA", label: "Mistas (Ambos)" }
                      ].map((item) => (
                        <button
                          key={item.val}
                          type="button"
                          onClick={() => setGenFormat(item.val as any)}
                          className={`p-3 text-center border rounded-xl transition-all cursor-pointer text-xs ${
                            genFormat === item.val
                              ? "border-primary-500 bg-primary-500/5 text-primary-900 font-bold ring-1 ring-primary-500/20"
                              : "border-surface-200 hover:border-surface-300 text-text-600 bg-white"
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* 3. Assunto / Tema */}
                <div>
                  <label className="block text-sm font-semibold text-text-700 mb-2">
                    {genType === "COLORING_BOOK" ? "Tema do Desenho / Caderno" : "Tema do Exercício"}
                  </label>
                  <Input
                    value={genTopic}
                    onChange={(e) => setGenTopic(e.target.value)}
                    placeholder={
                      genType === "COLORING_BOOK"
                        ? "Ex: Animais do Cerrado, Páscoa, Meios de Transporte..."
                        : "Ex: Frações equivalentes, vogais e consoantes, corpo humano..."
                    }
                    className="h-11"
                    maxLength={100}
                    disabled={isGenerating}
                  />
                </div>

                {/* 4. Instruções Complementares */}
                <div>
                  <label className="block text-sm font-semibold text-text-700 mb-2">
                    Instruções Especiais (opcional)
                  </label>
                  <textarea
                    value={genInstructions}
                    onChange={(e) => setGenInstructions(e.target.value)}
                    placeholder="Ex: Focar em palavras fáceis de soletrar; adicionar desenhos de 3 animais apenas; criar perguntas de marcar X..."
                    className="w-full h-24 p-3 border border-surface-200 rounded-lg bg-white text-text-700 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary-500"
                    maxLength={500}
                    disabled={isGenerating}
                  />
                </div>

                {/* Botão de Envio */}
                <Button
                  type="submit"
                  className="w-full h-12 text-base font-bold shadow-md cursor-pointer"
                  disabled={isGenerating}
                  leftIcon={isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                >
                  {isGenerating ? "Criando atividade e imagens..." : "Criar Recurso Didático"}
                </Button>
              </form>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function LibraryPage() {
  return (
    <React.Suspense fallback={<div className="flex items-center justify-center min-h-[400px]">Carregando...</div>}>
      <LibraryContent />
    </React.Suspense>
  );
}
