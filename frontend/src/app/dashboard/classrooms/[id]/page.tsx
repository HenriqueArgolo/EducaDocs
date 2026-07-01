"use client";

import { useEffect, useState, FormEvent, DragEvent } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
  fetchClassroomRoadmap, 
  fetchClassrooms, 
  fetchClassroomStats, 
  addTimelineItem, 
  changeTimelineItemStatus,
  reorderTimelineItems,
  updateTimelineItemDate,
  fetchClassroomStudents,
  addStudent,
  updateStudent,
  deleteStudent,
  generateClassroomRoadmap,
  downloadClassroomPortfolio,
  deleteTimelineItem,
  updateTimelineItem,
  generateDocument,
  generateActivity,
  generatePresentation,
  recommendBnccSkills
} from "@/lib/api";
import { 
  Classroom, 
  ClassroomTimelineItem, 
  ClassroomStats, 
  TimelineItemType, 
  TimelineItemStatus,
  CreateTimelineItemRequest,
  Student
} from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, BookOpen, Calendar as CalendarIcon, CheckCircle2, ChevronDown, ChevronUp, Circle, Clock, FileText, Image, PenTool, Plus, Presentation, Target, Pencil, Check, X, Users, Download, Sparkles, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { ClassroomKitDropdown } from "@/components/classroom/ClassroomKitDropdown";

export default function ClassroomRoadmapPage() {
  const { id } = useParams();
  const router = useRouter();
  const { toast } = useToast();
  
  const [classroom, setClassroom] = useState<Classroom | null>(null);
  const [items, setItems] = useState<ClassroomTimelineItem[]>([]);
  const [stats, setStats] = useState<ClassroomStats | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"timeline" | "calendar" | "students">("timeline");
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [newItemTitle, setNewItemTitle] = useState("");
  const [newItemDescription, setNewItemDescription] = useState("");
  const [newItemType, setNewItemType] = useState<TimelineItemType>("CUSTOM_EVENT");

  const [isAiDialogOpen, setIsAiDialogOpen] = useState(false);
  const [isGeneratingRoadmap, setIsGeneratingRoadmap] = useState(false);
  const [roadmapTheme, setRoadmapTheme] = useState("");
  const [roadmapLessons, setRoadmapLessons] = useState(8);
  const [roadmapInstructions, setRoadmapInstructions] = useState("");

  const [isStudentDialogOpen, setIsStudentDialogOpen] = useState(false);
  const [isSavingStudent, setIsSavingStudent] = useState(false);
  const [studentName, setStudentName] = useState("");
  const [studentNeeds, setStudentNeeds] = useState("");
  const [editingStudentId, setEditingStudentId] = useState<number | null>(null);

  const [editingItemId, setEditingItemId] = useState<number | null>(null);
  const [editingDateValue, setEditingDateValue] = useState<string>("");

  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [itemToDeleteId, setItemToDeleteId] = useState<number | null>(null);

  const [isStudentDeleteConfirmOpen, setIsStudentDeleteConfirmOpen] = useState(false);
  const [studentToDeleteId, setStudentToDeleteId] = useState<number | null>(null);

  const [isUnlinkConfirmOpen, setIsUnlinkConfirmOpen] = useState(false);
  const [itemToUnlink, setItemToUnlink] = useState<ClassroomTimelineItem | null>(null);

  const [generatingItems, setGeneratingItems] = useState<Record<number, boolean>>({});

  const [calendarDate, setCalendarDate] = useState(new Date());

  const startEditingDate = (item: ClassroomTimelineItem) => {
    setEditingItemId(item.id);
    const dateObj = new Date(item.targetDate || item.createdAt);
    const yyyy = dateObj.getFullYear();
    const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
    const dd = String(dateObj.getDate()).padStart(2, '0');
    setEditingDateValue(`${yyyy}-${mm}-${dd}`);
  };

  const handleSaveDate = async (itemId: number) => {
    if (!id) return;
    try {
      const dateObj = new Date(`${editingDateValue}T12:00:00`);
      const response = await updateTimelineItemDate(id as string, itemId, dateObj.toISOString());
      setItems(items.map(i => i.id === itemId ? response : i));
      setEditingItemId(null);
      toast({ title: "Data atualizada", description: "A data do evento foi atualizada." });
    } catch (error) {
      toast({ title: "Erro", description: "Não foi possível atualizar a data.", variant: "destructive" });
    }
  };

  const loadData = async () => {
    if (!id) return;
    try {
      setIsLoading(true);
      const [allClassrooms, roadmapItems, statsData, studentList] = await Promise.all([
        fetchClassrooms(),
        fetchClassroomRoadmap(id as string),
        fetchClassroomStats(id as string),
        fetchClassroomStudents(id as string)
      ]);
      const currentClassroom = allClassrooms.find(c => c.id.toString() === id);
      if (currentClassroom) setClassroom(currentClassroom);
      setItems(roadmapItems.sort((a, b) => a.orderIndex - b.orderIndex));
      setStats(statsData);
      setStudents(studentList);
    } catch (error) {
      toast({ title: "Erro", description: "Falha ao carregar dados.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { loadData(); }, [id]);

  const handleCreateEvent = async (e: FormEvent) => {
    e.preventDefault();
    if (!id) return;
    try {
      setIsAdding(true);
      await addTimelineItem(id as string, { title: newItemTitle, description: newItemDescription, type: newItemType });
      await loadData();
      setIsDialogOpen(false);
      setNewItemTitle(""); setNewItemDescription(""); setNewItemType("CUSTOM_EVENT");
    } finally { setIsAdding(false); }
  };

  const handleGenerateRoadmap = async (e: FormEvent) => {
    e.preventDefault();
    if (!id || !roadmapTheme.trim()) return;
    try {
      setIsGeneratingRoadmap(true);
      const roadmapItems = await generateClassroomRoadmap(id as string, { theme: roadmapTheme.trim(), numberOfLessons: roadmapLessons, additionalInstructions: roadmapInstructions.trim() || undefined });
      setItems(roadmapItems.sort((a, b) => a.orderIndex - b.orderIndex));
      const statsData = await fetchClassroomStats(id as string);
      setStats(statsData);
      setIsAiDialogOpen(false);
    } finally { setIsGeneratingRoadmap(false); }
  };

  const handleSaveStudent = async (e: FormEvent) => {
    e.preventDefault();
    if (!id || !studentName.trim()) return;
    try {
      setIsSavingStudent(true);
      if (editingStudentId) {
        const response = await updateStudent(id as string, editingStudentId, { name: studentName.trim(), needs: studentNeeds.trim() || undefined });
        setStudents(students.map(s => s.id === editingStudentId ? response : s));
      } else {
        const response = await addStudent(id as string, { name: studentName.trim(), needs: studentNeeds.trim() || undefined });
        setStudents([response, ...students]);
      }
      setIsStudentDialogOpen(false);
    } finally { setIsSavingStudent(false); }
  };

  const startEditStudent = (student: Student) => {
    setEditingStudentId(student.id);
    setStudentName(student.name);
    setStudentNeeds(student.needs || "");
    setIsStudentDialogOpen(true);
  };

  const handleDeleteStudent = (studentId: number) => {
    setStudentToDeleteId(studentId);
    setIsStudentDeleteConfirmOpen(true);
  };

  const confirmDeleteStudent = async () => {
    if (!id || studentToDeleteId === null) return;
    try {
      await deleteStudent(id as string, studentToDeleteId);
      setStudents(students.filter(s => s.id !== studentToDeleteId));
      toast({ title: "Estudante removido", description: "O estudante foi removido com sucesso." });
    } catch (error) {
      toast({ title: "Erro", description: "Não foi possível remover o estudante.", variant: "destructive" });
    } finally {
      setIsStudentDeleteConfirmOpen(false);
      setStudentToDeleteId(null);
    }
  };

  const handleExportPortfolio = async () => {
    if (!classroom) return;
    await downloadClassroomPortfolio(classroom.id, classroom.name);
  };

  const handleToggleStatus = async (item: ClassroomTimelineItem) => {
    if (!id) return;
    const newStatus: TimelineItemStatus = item.status === "COMPLETED" ? "PLANNED" : "COMPLETED";
    await changeTimelineItemStatus(id as string, item.id, newStatus);
    setItems(items.map(i => i.id === item.id ? { ...i, status: newStatus } : i));
  };

  const handleDeleteTimelineItem = (itemId: number) => {
    setItemToDeleteId(itemId);
    setIsDeleteConfirmOpen(true);
  };

  const confirmDeleteTimelineItem = async () => {
    if (!id || itemToDeleteId === null) return;
    try {
      await deleteTimelineItem(id as string, itemToDeleteId);
      setItems(items.filter(i => i.id !== itemToDeleteId).map((item, idx) => ({ ...item, orderIndex: idx })));
      const statsData = await fetchClassroomStats(id as string);
      setStats(statsData);
      toast({ title: "Aula removida", description: "O cronograma foi atualizado com sucesso." });
    } catch (error) {
      toast({ title: "Erro", description: "Não foi possível remover a aula.", variant: "destructive" });
    } finally {
      setIsDeleteConfirmOpen(false);
      setItemToDeleteId(null);
    }
  };

  const handleUnlinkResource = (item: ClassroomTimelineItem) => {
    setItemToUnlink(item);
    setIsUnlinkConfirmOpen(true);
  };

  const confirmUnlinkResource = async () => {
    if (!id || !itemToUnlink) return;
    try {
      const response = await updateTimelineItem(id as string, itemToUnlink.id, {
        title: itemToUnlink.title,
        description: itemToUnlink.description || "",
        type: itemToUnlink.type,
        documentId: undefined,
        activityId: undefined,
        presentationId: undefined
      });
      setItems(items.map(i => i.id === itemToUnlink.id ? response : i));
      const statsData = await fetchClassroomStats(id as string);
      setStats(statsData);
      toast({ title: "Arquivo removido", description: "O arquivo foi desvinculado da aula, mas continua salvo no sistema." });
    } catch (error) {
      toast({ title: "Erro", description: "Não foi possível remover o arquivo.", variant: "destructive" });
    } finally {
      setIsUnlinkConfirmOpen(false);
      setItemToUnlink(null);
    }
  };

  const handleCreateMaterialInPlace = async (item: ClassroomTimelineItem) => {
    if (!classroom) return;
    const itemId = item.id;
    setGeneratingItems(prev => ({ ...prev, [itemId]: true }));

    try {
      if (item.type === "PLAN" || item.type === "EXAM") {
        let bnccSkillIds: number[] = [];
        try {
          const recommend = await recommendBnccSkills({
            grade: classroom.grade,
            subject: classroom.subject,
            topic: item.title
          });
          bnccSkillIds = recommend.recommendedIds || [];
        } catch (e) {
          console.error("Erro ao obter recomendações da BNCC", e);
        }

        const docType = item.type === "PLAN" ? "LESSON_PLAN" : "EXAM";
        
        await generateDocument({
          documentType: docType,
          templateStyle: "MODERN",
          bnccSkillIds,
          topic: item.title,
          grade: classroom.grade,
          subject: classroom.subject,
          classroomId: classroom.id,
          timelineItemId: item.id
        });

        toast({
          title: "Material Gerado",
          description: `${item.type === "PLAN" ? "Plano de Aula" : "Avaliação"} gerado com sucesso!`
        });
      } else if (item.type === "ACTIVITY") {
        const activity = await generateActivity({
          topic: item.title,
          type: "WORKSHEET",
          grade: classroom.grade,
          subject: classroom.subject
        });

        await updateTimelineItem(classroom.id, item.id, {
          title: item.title,
          description: item.description || "",
          type: item.type,
          activityId: activity.id
        });

        toast({
          title: "Atividade Gerada",
          description: "Ficha de atividades gerada e vinculada com sucesso!"
        });
      } else if (item.type === "SLIDES") {
        const presentation = await generatePresentation({
          topic: item.title,
          grade: classroom.grade,
          subject: classroom.subject
        });

        await updateTimelineItem(classroom.id, item.id, {
          title: item.title,
          description: item.description || "",
          type: item.type,
          presentationId: presentation.id
        });

        toast({
          title: "Apresentação Gerada",
          description: "Slides gerados e vinculados com sucesso!"
        });
      }

      await loadData();
    } catch (error) {
      console.error(error);
      toast({
        title: "Erro na geração",
        description: "Não foi possível gerar o material com IA.",
        variant: "destructive"
      });
    } finally {
      setGeneratingItems(prev => ({ ...prev, [itemId]: false }));
    }
  };

  const handleMoveUp = async (index: number) => {
    if (index === 0 || !id) return;
    const newItems = [...items];
    [newItems[index], newItems[index - 1]] = [newItems[index - 1], newItems[index]];
    setItems(newItems);
    await reorderTimelineItems(id as string, { orderedItemIds: newItems.map(i => i.id) });
  };

  const handleMoveDown = async (index: number) => {
    if (index === items.length - 1 || !id) return;
    const newItems = [...items];
    [newItems[index], newItems[index + 1]] = [newItems[index + 1], newItems[index]];
    setItems(newItems);
    await reorderTimelineItems(id as string, { orderedItemIds: newItems.map(i => i.id) });
  };

  const handleDragStart = (e: DragEvent, itemId: number) => e.dataTransfer.setData("text/plain", itemId.toString());

  const handleDrop = async (e: DragEvent, targetDate: Date) => {
    e.preventDefault();
    const itemId = parseInt(e.dataTransfer.getData("text/plain"));
    if (!id) return;
    targetDate.setHours(12, 0, 0, 0);
    const response = await updateTimelineItemDate(id as string, itemId, targetDate.toISOString());
    setItems(items.map(i => i.id === itemId ? response : i));
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear(), month = date.getMonth();
    const firstDayIndex = new Date(year, month, 1).getDay(), totalDays = new Date(year, month + 1, 0).getDate();
    const days = Array(firstDayIndex).fill(null);
    for (let i = 1; i <= totalDays; i++) days.push(new Date(year, month, i));
    return days;
  };

  const getItemsForDate = (day: Date | null) => day ? items.filter(item => {
    const itemDate = new Date(item.targetDate || item.createdAt);
    return itemDate.getFullYear() === day.getFullYear() && itemDate.getMonth() === day.getMonth() && itemDate.getDate() === day.getDate();
  }) : [];

  const getIconForType = (type: TimelineItemType) => {
    switch (type) {
      case "PLAN": return <FileText className="h-5 w-5 text-emerald-500" />;
      case "SLIDES": return <Presentation className="h-5 w-5 text-orange-500" />;
      case "ACTIVITY": return <Image className="h-5 w-5 text-blue-500" />;
      case "EXAM": return <PenTool className="h-5 w-5 text-rose-500" />;
      case "CUSTOM_EVENT": return <CalendarIcon className="h-5 w-5 text-indigo-500" />;
      default: return <Circle className="h-5 w-5 text-slate-500" />;
    }
  };

  const getBadgeColor = (type: TimelineItemType) => {
    switch (type) {
      case "PLAN": return "bg-emerald-100 text-emerald-700 border-emerald-200";
      case "SLIDES": return "bg-orange-100 text-orange-700 border-orange-200";
      case "ACTIVITY": return "bg-blue-100 text-blue-700 border-blue-200";
      case "EXAM": return "bg-rose-100 text-rose-700 border-rose-200";
      case "CUSTOM_EVENT": return "bg-indigo-100 text-indigo-700 border-indigo-200";
      default: return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  const getTypeLabel = (type: TimelineItemType) => {
    switch (type) {
      case "PLAN": return "Plano de Aula";
      case "SLIDES": return "Apresentação";
      case "ACTIVITY": return "Atividade";
      case "EXAM": return "Avaliação";
      case "CUSTOM_EVENT": return "Evento";
      default: return "Outro";
    }
  };

  const getGenerateLink = (item: ClassroomTimelineItem) => {
    if (!classroom) return "#";
    const topic = encodeURIComponent(item.title);
    switch (item.type) {
      case "PLAN": return `/dashboard/new?classroomId=${classroom.id}&timelineItemId=${item.id}&topic=${topic}&type=LESSON_PLAN`;
      case "EXAM": return `/dashboard/new?classroomId=${classroom.id}&timelineItemId=${item.id}&topic=${topic}&type=EXAM`;
      case "ACTIVITY": return `/dashboard/library?classroomId=${classroom.id}&timelineItemId=${item.id}&topic=${topic}&tab=generate`;
      case "SLIDES": return `/dashboard/slides/new?classroomId=${classroom.id}&timelineItemId=${item.id}&topic=${topic}`;
      default: return "#";
    }
  };

  if (isLoading) return <div className="animate-pulse space-y-6"><div className="h-20 bg-slate-100 rounded-2xl"></div></div>;
  if (!classroom) return <div className="text-center py-20 text-slate-500">Turma não encontrada.</div>;

  const progressPercentage = stats && stats.totalResourcesLinked > 0 ? Math.round((stats.completedResources / stats.totalResourcesLinked) * 100) : 0;

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="icon" onClick={() => router.push("/dashboard/classrooms")} className="rounded-full"><ArrowLeft className="h-5 w-5" /></Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-800">{classroom.name}</h1>
            <p className="text-muted-foreground flex items-center gap-2 mt-1"><BookOpen className="h-4 w-4" /> {classroom.subject} &bull; {classroom.grade}</p>
          </div>
        </div>
        <Button variant="outline" onClick={handleExportPortfolio} className="rounded-xl shadow-sm border-slate-200"><Download className="mr-2 h-4 w-4" /> Exportar Portfólio</Button>
      </div>

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="rounded-2xl border-slate-200 shadow-sm bg-white">
            <CardContent className="p-6 flex items-center space-x-4">
              <div className="p-3 bg-primary/10 text-primary rounded-xl"><Target className="h-6 w-6" /></div>
              <div><p className="text-sm font-medium text-slate-500">Progresso Geral</p><h3 className="text-2xl font-bold text-slate-800">{progressPercentage}%</h3></div>
            </CardContent>
          </Card>
          <Card className="rounded-2xl border-slate-200 shadow-sm md:col-span-2 overflow-hidden bg-white">
            <CardContent className="p-6">
              <p className="text-sm font-medium text-slate-500 mb-2">Habilidades BNCC ({stats.bnccSkillsAddressed.length})</p>
              <div className="flex flex-wrap gap-2">{stats.bnccSkillsAddressed.map(s => <span key={s} className="px-2.5 py-1 bg-slate-100 rounded-md text-xs font-mono font-medium border border-slate-200">{s}</span>)}</div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="flex border-b border-slate-200">
        <button onClick={() => setActiveTab("timeline")} className={`pb-4 px-6 font-semibold text-sm border-b-2 transition-all ${activeTab === "timeline" ? "border-primary text-primary" : "border-transparent text-slate-500"}`}>Linha do Tempo</button>
        <button onClick={() => setActiveTab("calendar")} className={`pb-4 px-6 font-semibold text-sm border-b-2 transition-all ${activeTab === "calendar" ? "border-primary text-primary" : "border-transparent text-slate-500"}`}>Calendário</button>
        <button onClick={() => setActiveTab("students")} className={`pb-4 px-6 font-semibold text-sm border-b-2 transition-all ${activeTab === "students" ? "border-primary text-primary" : "border-transparent text-slate-500"}`}>Alunos & PDI</button>
      </div>

      <div className="mt-6">
        {activeTab === "timeline" && (
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
              <div>
                <h2 className="text-xl font-bold text-slate-800">Linha do Tempo</h2>
                <p className="text-xs text-muted-foreground mt-0.5">Planeje as aulas e gere materiais didáticos com inteligência artificial.</p>
              </div>
              <div className="flex gap-2">
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="rounded-xl border-slate-200 text-xs">
                      <Plus className="mr-1.5 h-3.5 w-3.5" /> Adicionar Aula
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="rounded-2xl max-w-md">
                    <DialogHeader>
                      <DialogTitle>Adicionar Nova Aula ou Evento</DialogTitle>
                      <DialogDescription>Crie manualmente uma nova etapa ou recurso no cronograma da turma.</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleCreateEvent} className="space-y-4 mt-2">
                      <div className="space-y-2">
                        <Label htmlFor="item-title">Título *</Label>
                        <Input id="item-title" value={newItemTitle} onChange={e => setNewItemTitle(e.target.value)} placeholder="Ex: Introdução às Frações" required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="item-description">Descrição (Opcional)</Label>
                        <Textarea id="item-description" value={newItemDescription} onChange={e => setNewItemDescription(e.target.value)} placeholder="Ex: Focar no conceito de parte e todo." />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="item-type">Tipo de Material / Evento</Label>
                        <Select value={newItemType} onValueChange={(val) => setNewItemType(val as TimelineItemType)}>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Selecione o tipo..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="PLAN">Plano de Aula</SelectItem>
                            <SelectItem value="SLIDES">Apresentação (Slides)</SelectItem>
                            <SelectItem value="ACTIVITY">Atividade Prática</SelectItem>
                            <SelectItem value="EXAM">Avaliação</SelectItem>
                            <SelectItem value="CUSTOM_EVENT">Evento Customizado</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <DialogFooter className="pt-4">
                        <Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                        <Button type="submit" disabled={isAdding}>
                          {isAdding ? "Adicionando..." : "Adicionar"}
                        </Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>

                <Dialog open={isAiDialogOpen} onOpenChange={setIsAiDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="rounded-xl bg-primary hover:bg-primary/95 text-white text-xs">
                      <Sparkles className="mr-1.5 h-3.5 w-3.5 text-white" /> Planejar com IA
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="rounded-2xl max-w-md">
                    <DialogHeader>
                      <DialogTitle>Gerar Cronograma Completo com IA</DialogTitle>
                      <DialogDescription>
                        Informe um tema e a quantidade de aulas, e nossa inteligência pedagógica estruturará todo o cronograma.
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleGenerateRoadmap} className="space-y-4 mt-2">
                      <div className="space-y-2">
                        <Label htmlFor="roadmap-theme">Tema Central *</Label>
                        <Input id="roadmap-theme" value={roadmapTheme} onChange={e => setRoadmapTheme(e.target.value)} placeholder="Ex: Egito Antigo, Ecossistemas..." required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="roadmap-lessons">Quantidade de Aulas *</Label>
                        <Input id="roadmap-lessons" type="number" min={1} max={20} value={roadmapLessons} onChange={e => setRoadmapLessons(parseInt(e.target.value))} required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="roadmap-instructions">Instruções Adicionais (Opcional)</Label>
                        <Textarea id="roadmap-instructions" value={roadmapInstructions} onChange={e => setRoadmapInstructions(e.target.value)} placeholder="Ex: Focar em aspectos socioeconômicos e menos em guerras." />
                      </div>
                      <DialogFooter className="pt-4">
                        <Button type="button" variant="ghost" onClick={() => setIsAiDialogOpen(false)}>Cancelar</Button>
                        <Button type="submit" disabled={isGeneratingRoadmap}>
                          {isGeneratingRoadmap ? "Planejando..." : "Gerar Roteiro"}
                        </Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            <div className="relative pl-4 md:pl-8 space-y-6 before:absolute before:inset-0 before:ml-8 before:w-0.5 before:bg-gradient-to-b before:from-primary/20 before:to-slate-100">
              {items.map((item, index) => (
                <div key={item.id} className="relative z-10 flex items-start gap-4">
                  <button 
                    onClick={() => handleToggleStatus(item)} 
                    className={`mt-2.5 h-8 w-8 rounded-full flex items-center justify-center border-2 shrink-0 transition-colors ${item.status === "COMPLETED" ? 'bg-primary border-primary text-white' : 'border-slate-300 bg-white hover:border-primary/50'}`}
                  >
                    {item.status === "COMPLETED" ? <CheckCircle2 className="h-5 w-5" /> : <Circle className="h-5 w-5" />}
                  </button>
                  <Card className="flex-1 rounded-2xl p-5 border border-slate-200 shadow-sm bg-white hover:shadow-md transition-shadow">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="space-y-1.5 flex-1">
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] uppercase font-bold px-2.5 py-0.5 rounded-full border ${getBadgeColor(item.type)}`}>
                            {getTypeLabel(item.type)}
                          </span>
                          {item.targetDate && (
                            <span className="text-xs text-slate-500 flex items-center gap-1">
                              <CalendarIcon className="h-3 w-3" />
                              {new Date(item.targetDate).toLocaleDateString("pt-BR")}
                            </span>
                          )}
                        </div>
                        <h3 className="font-bold text-lg text-slate-800 leading-snug">{item.title}</h3>
                        {item.description && (
                          <p className="text-sm text-slate-500 max-w-xl">{item.description}</p>
                        )}
                        
                        {/* Resource Connection Link/Button */}
                        <div className="pt-2 flex flex-wrap gap-2">
                          {(item.type === "PLAN" && item.documentId) ? (
                            item.kitId ? <ClassroomKitDropdown kitId={item.kitId} documentId={item.documentId} /> : <div className="flex gap-2">
                              <Link href={`/dashboard/document/${item.documentId}`}>
                                <Button size="sm" variant="outline" className="rounded-lg text-xs">
                                  <FileText className="mr-1.5 h-3.5 w-3.5" /> Ver Plano de Aula
                                </Button>
                              </Link>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleUnlinkResource(item)}
                                className="rounded-lg text-xs text-red-500 hover:bg-red-50 hover:text-red-600 border border-transparent hover:border-red-200"
                                title="Desvincular arquivo desta aula"
                              >
                                <X className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          ) : (item.type === "EXAM" && item.documentId) ? (
                            <div className="flex gap-2">
                              <Link href={`/dashboard/document/${item.documentId}`}>
                                <Button size="sm" variant="outline" className="rounded-lg text-xs">
                                  <PenTool className="mr-1.5 h-3.5 w-3.5" /> Ver Avaliação
                                </Button>
                              </Link>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleUnlinkResource(item)}
                                className="rounded-lg text-xs text-red-500 hover:bg-red-50 hover:text-red-600 border border-transparent hover:border-red-200"
                                title="Desvincular arquivo desta aula"
                              >
                                <X className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          ) : (item.type === "ACTIVITY" && item.activityId) ? (
                            <div className="flex gap-2">
                              <Link href={`/dashboard/library/${item.activityId}`}>
                                <Button size="sm" variant="outline" className="rounded-lg text-xs">
                                  <BookOpen className="mr-1.5 h-3.5 w-3.5" /> Ver Atividade
                                </Button>
                              </Link>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleUnlinkResource(item)}
                                className="rounded-lg text-xs text-red-500 hover:bg-red-50 hover:text-red-600 border border-transparent hover:border-red-200"
                                title="Desvincular arquivo desta aula"
                              >
                                <X className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          ) : (item.type === "SLIDES" && item.presentationId) ? (
                            <div className="flex gap-2">
                              <Link href={`/dashboard/slides/${item.presentationId}`}>
                                <Button size="sm" variant="outline" className="rounded-lg text-xs">
                                  <Presentation className="mr-1.5 h-3.5 w-3.5" /> Ver Apresentação
                                </Button>
                              </Link>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleUnlinkResource(item)}
                                className="rounded-lg text-xs text-red-500 hover:bg-red-50 hover:text-red-600 border border-transparent hover:border-red-200"
                                title="Desvincular arquivo desta aula"
                              >
                                <X className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          ) : (
                            <>
                              {item.type !== "CUSTOM_EVENT" && (
                                <Button 
                                  size="sm" 
                                  variant="primary" 
                                  onClick={() => handleCreateMaterialInPlace(item)}
                                  isLoading={generatingItems[item.id]}
                                  className="rounded-lg text-xs bg-primary hover:bg-primary/95 text-white"
                                >
                                  {!generatingItems[item.id] && <Sparkles className="mr-1.5 h-3.5 w-3.5 text-white" />}
                                  {generatingItems[item.id] ? "Gerando com IA..." : 
                                   item.type === "PLAN" ? "Criar Plano de Aula" :
                                   item.type === "SLIDES" ? "Criar Apresentação" :
                                   item.type === "ACTIVITY" ? "Criar Atividade" : "Criar Avaliação"}
                                </Button>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-1 self-end sm:self-center">
                        {editingItemId === item.id ? (
                          <div className="flex items-center gap-1 bg-slate-50 p-1.5 rounded-lg border">
                            <Input 
                              type="date" 
                              value={editingDateValue} 
                              onChange={e => setEditingDateValue(e.target.value)} 
                              className="h-8 w-36 text-xs bg-white border-slate-200" 
                            />
                            <Button variant="ghost" size="icon" onClick={() => handleSaveDate(item.id)} className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-100 rounded-md"><Check className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="icon" onClick={() => setEditingItemId(null)} className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-100 rounded-md"><X className="h-4 w-4" /></Button>
                          </div>
                        ) : (
                          <Button variant="ghost" size="icon" onClick={() => startEditingDate(item)} className="h-8 w-8 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg" title="Agendar aula"><CalendarIcon className="h-4 w-4" /></Button>
                        )}
                        <Button variant="ghost" size="icon" onClick={() => handleMoveUp(index)} disabled={index === 0} className="h-8 w-8 text-slate-400 disabled:opacity-30 rounded-lg"><ChevronUp className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => handleMoveDown(index)} disabled={index === items.length - 1} className="h-8 w-8 text-slate-400 disabled:opacity-30 rounded-lg"><ChevronDown className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteTimelineItem(item.id)} className="h-8 w-8 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg" title="Remover aula"><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </div>
                  </Card>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "calendar" && (
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-slate-800 text-lg uppercase tracking-wide">
                {calendarDate.toLocaleString("pt-BR", { month: "long", year: "numeric" })}
              </h3>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setCalendarDate(new Date())} className="text-xs">Hoje</Button>
                <Button variant="outline" size="icon" onClick={() => {
                  const newDate = new Date(calendarDate);
                  newDate.setMonth(newDate.getMonth() - 1);
                  setCalendarDate(newDate);
                }} className="h-8 w-8">
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" onClick={() => {
                  const newDate = new Date(calendarDate);
                  newDate.setMonth(newDate.getMonth() + 1);
                  setCalendarDate(newDate);
                }} className="h-8 w-8">
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <div className="grid grid-cols-7 gap-2 text-center text-xs font-bold text-slate-500 uppercase mb-3">
              <div>Dom</div>
              <div>Seg</div>
              <div>Ter</div>
              <div>Qua</div>
              <div>Qui</div>
              <div>Sex</div>
              <div>Sáb</div>
            </div>

            <div className="grid grid-cols-7 gap-2">
              {getDaysInMonth(calendarDate).map((day, i) => (
                <div 
                  key={i} 
                  onDragOver={e => e.preventDefault()} 
                  onDrop={e => day && handleDrop(e, day)} 
                  className={`min-h-[110px] p-2 border border-slate-100 rounded-xl flex flex-col justify-between transition-colors ${day ? "bg-slate-50/20" : "bg-transparent opacity-30"}`}
                >
                  {day ? (
                    <>
                      <span className="text-xs font-semibold text-slate-500 self-end">{day.getDate()}</span>
                      <div className="space-y-1 mt-1 flex-1 overflow-y-auto max-h-[75px] pr-1">
                        {getItemsForDate(day).map(item => (
                          <div
                            key={item.id}
                            draggable
                            onDragStart={e => handleDragStart(e, item.id)}
                            onClick={() => {
                              if (item.type === "PLAN" && item.documentId) {
                                router.push(`/dashboard/document/${item.documentId}`);
                              } else if (item.type === "EXAM" && item.documentId) {
                                router.push(`/dashboard/document/${item.documentId}`);
                              } else if (item.type === "ACTIVITY" && item.activityId) {
                                router.push(`/dashboard/library/${item.activityId}`);
                              } else if (item.type === "SLIDES" && item.presentationId) {
                                router.push(`/dashboard/slides/${item.presentationId}`);
                              } else {
                                router.push(getGenerateLink(item));
                              }
                            }}
                            className={`text-[9.5px] font-semibold px-2 py-1 rounded-lg border truncate cursor-pointer transition-all hover:shadow-sm flex items-center gap-1 ${getBadgeColor(item.type)}`}
                            title={`${getTypeLabel(item.type)}: ${item.title}`}
                          >
                            <span className="shrink-0">{getIconForType(item.type)}</span>
                            <span className="truncate">{item.title}</span>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "students" && (
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-xl font-bold text-slate-800">Alunos e Inclusão (PDI)</h2>
                <p className="text-xs text-muted-foreground mt-0.5">Gerencie os alunos com necessidades especiais para adaptação automática de materiais.</p>
              </div>
              <Button onClick={() => setIsStudentDialogOpen(true)} className="rounded-xl bg-primary hover:bg-primary/95 text-white text-xs">
                <Plus className="mr-1.5 h-3.5 w-3.5 text-white" /> Adicionar Aluno
              </Button>
            </div>

            {students.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-slate-200 rounded-2xl max-w-md mx-auto">
                <Users className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                <h4 className="font-bold text-slate-700 text-sm">Nenhum aluno cadastrado</h4>
                <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">Cadastre alunos e suas necessidades para que a IA adapte automaticamente seus planos de aula.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {students.map(s => (
                  <Card key={s.id} className="rounded-2xl p-5 border border-slate-200 bg-slate-50/10 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-bold text-slate-800">{s.name}</h3>
                        {s.needs && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {s.needs.split(",").map(need => (
                              <span key={need} className="text-[9.5px] font-bold bg-primary/10 text-primary px-2.5 py-0.5 rounded-full border border-primary/20">
                                {need.trim()}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <button onClick={() => startEditStudent(s)} className="text-slate-400 hover:text-slate-600 p-1.5 hover:bg-slate-100 rounded-md transition-colors"><Pencil className="h-4 w-4" /></button>
                        <button onClick={() => handleDeleteStudent(s.id)} className="text-slate-400 hover:text-red-500 p-1.5 hover:bg-red-50 rounded-md transition-colors"><Trash2 className="h-4 w-4" /></button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}

            <Dialog open={isStudentDialogOpen} onOpenChange={(open) => { 
              setIsStudentDialogOpen(open); 
              if (!open) { 
                setEditingStudentId(null); 
                setStudentName(""); 
                setStudentNeeds(""); 
              } 
            }}>
              <DialogContent className="rounded-2xl max-w-md">
                <DialogHeader>
                  <DialogTitle>{editingStudentId ? "Editar Aluno" : "Adicionar Aluno"}</DialogTitle>
                  <DialogDescription>
                    Cadastre o aluno e suas necessidades educacionais especiais para que a IA possa sugerir adaptações (PDI).
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSaveStudent} className="space-y-4 mt-2">
                  <div className="space-y-2">
                    <Label htmlFor="student-name">Nome do Aluno *</Label>
                    <Input 
                      id="student-name"
                      value={studentName} 
                      onChange={e => setStudentName(e.target.value)} 
                      placeholder="Ex: João Silva" 
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="student-needs">Necessidades / CID (Opcional)</Label>
                    <Input 
                      id="student-needs"
                      value={studentNeeds} 
                      onChange={e => setStudentNeeds(e.target.value)} 
                      placeholder="Ex: TDAH, Autismo, Dislexia" 
                    />
                    <p className="text-[10px] text-muted-foreground">Separe por vírgulas se houver mais de uma necessidade.</p>
                  </div>
                  <DialogFooter className="pt-4">
                    <Button type="button" variant="ghost" onClick={() => setIsStudentDialogOpen(false)}>Cancelar</Button>
                    <Button type="submit" disabled={isSavingStudent}>
                      {isSavingStudent ? "Salvando..." : "Salvar Aluno"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </div>

      {/* Modal de Confirmação de Exclusão de Aula */}
      <Dialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
        <DialogContent className="rounded-2xl max-w-md">
          <DialogHeader>
            <DialogTitle>Remover Aula</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja remover esta aula do roteiro da turma? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="pt-4 gap-2">
            <Button type="button" variant="ghost" onClick={() => setIsDeleteConfirmOpen(false)}>
              Cancelar
            </Button>
            <Button type="button" variant="destructive" onClick={confirmDeleteTimelineItem}>
              Remover
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Confirmação de Exclusão de Aluno */}
      <Dialog open={isStudentDeleteConfirmOpen} onOpenChange={setIsStudentDeleteConfirmOpen}>
        <DialogContent className="rounded-2xl max-w-md">
          <DialogHeader>
            <DialogTitle>Remover Aluno</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja remover este aluno da turma? Os dados de PDI associados serão perdidos.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="pt-4 gap-2">
            <Button type="button" variant="ghost" onClick={() => setIsStudentDeleteConfirmOpen(false)}>
              Cancelar
            </Button>
            <Button type="button" variant="destructive" onClick={confirmDeleteStudent}>
              Remover
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Confirmação de Desvinculação de Arquivo */}
      <Dialog open={isUnlinkConfirmOpen} onOpenChange={setIsUnlinkConfirmOpen}>
        <DialogContent className="rounded-2xl max-w-md">
          <DialogHeader>
            <DialogTitle>Remover Arquivo do Roadmap</DialogTitle>
            <DialogDescription>
              Deseja desvincular este arquivo da aula? O arquivo continuará salvo na sua biblioteca, mas não estará mais associado a esta etapa do roteiro.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="pt-4 gap-2">
            <Button type="button" variant="ghost" onClick={() => setIsUnlinkConfirmOpen(false)}>
              Cancelar
            </Button>
            <Button type="button" variant="destructive" onClick={confirmUnlinkResource} className="bg-red-600 hover:bg-red-700 text-white rounded-xl">
              Remover Arquivo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
