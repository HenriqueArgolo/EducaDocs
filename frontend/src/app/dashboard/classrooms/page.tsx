"use client";

import { useEffect, useState } from "react";
import { Plus, Users, BookOpen, Calendar, ChevronRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Classroom, CreateClassroomRequest } from "@/lib/types";
import { fetchClassrooms, createClassroom } from "@/lib/api";

export default function ClassroomsPage() {
  const { toast } = useToast();
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [subject, setSubject] = useState("");
  const [grade, setGrade] = useState("");

  const loadClassrooms = async () => {
    try {
      setIsLoading(true);
      const data = await fetchClassrooms();
      setClassrooms(data);
    } catch (error) {
      toast({
        title: "Erro ao carregar turmas",
        description: "Não foi possível carregar a lista de turmas.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadClassrooms();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsCreating(true);
      const request: CreateClassroomRequest = { name, subject, grade };
      const newClassroom = await createClassroom(request);
      setClassrooms([newClassroom, ...classrooms]);
      setIsDialogOpen(false);
      setName("");
      setSubject("");
      setGrade("");
      toast({
        title: "Turma criada com sucesso!",
        description: `A turma ${newClassroom.name} foi adicionada ao seu painel.`,
      });
    } catch (error) {
      toast({
        title: "Erro ao criar turma",
        description: "Ocorreu um erro ao tentar salvar a turma. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-800">Minhas Turmas</h1>
          <p className="text-muted-foreground mt-2">
            Organize seus materiais, planos e acompanhe o roadmap de cada turma.
          </p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90 rounded-xl shadow-sm transition-all text-white">
              <Plus className="mr-2 h-4 w-4" />
              Nova Turma
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px] rounded-2xl">
            <DialogHeader>
              <DialogTitle>Criar Nova Turma</DialogTitle>
              <DialogDescription>
                Cadastre uma nova turma para iniciar o roadmap de aprendizado.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreate}>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Nome da Turma</Label>
                  <Input
                    id="name"
                    placeholder="Ex: 5º Ano A"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="rounded-xl border-slate-200"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="grade">Ano/Segmento Escolar</Label>
                  <Input
                    id="grade"
                    placeholder="Ex: Ensino Fundamental I"
                    value={grade}
                    onChange={(e) => setGrade(e.target.value)}
                    required
                    className="rounded-xl border-slate-200"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="subject">Disciplina(s)</Label>
                  <Input
                    id="subject"
                    placeholder="Ex: Ciências e Matemática"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    required
                    className="rounded-xl border-slate-200"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsDialogOpen(false)}
                  className="rounded-xl"
                  disabled={isCreating}
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  className="bg-primary text-white rounded-xl shadow-sm hover:bg-primary/90"
                  disabled={isCreating || !name || !grade || !subject}
                >
                  {isCreating ? "Criando..." : "Criar Turma"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-48 bg-slate-100 rounded-2xl"></div>
          ))}
        </div>
      ) : classrooms.length === 0 ? (
        <div className="text-center py-20 px-4 rounded-3xl bg-slate-50 border border-dashed border-slate-200">
          <div className="bg-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm border border-slate-100">
            <Users className="h-8 w-8 text-primary" />
          </div>
          <h2 className="text-xl font-semibold text-slate-800 mb-2">Nenhuma turma cadastrada</h2>
          <p className="text-slate-500 max-w-md mx-auto mb-6">
            Você ainda não possui turmas. Crie sua primeira turma para começar a organizar seus materiais e acompanhar o roadmap de aprendizado.
          </p>
          <Button onClick={() => setIsDialogOpen(true)} className="bg-primary hover:bg-primary/90 text-white rounded-xl shadow-sm">
            <Plus className="mr-2 h-4 w-4" /> Criar Minha Primeira Turma
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {classrooms.map((classroom) => (
            <Card key={classroom.id} className="group overflow-hidden rounded-2xl border-slate-200 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col bg-white">
              <div className="h-2 w-full bg-gradient-to-r from-primary to-indigo-400"></div>
              <CardHeader className="pb-4">
                <div className="flex justify-between items-start mb-2">
                  <div className="p-2.5 bg-primary/10 rounded-xl text-primary">
                    <Users className="h-5 w-5" />
                  </div>
                  <span className="text-xs font-medium px-2.5 py-1 bg-slate-100 text-slate-600 rounded-full">
                    {new Date(classroom.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <CardTitle className="text-xl font-bold text-slate-800 group-hover:text-primary transition-colors">
                  {classroom.name}
                </CardTitle>
                <CardDescription className="text-sm">
                  {classroom.grade}
                </CardDescription>
              </CardHeader>
              <CardContent className="pb-6 flex-grow">
                <div className="flex items-center text-sm text-slate-600">
                  <BookOpen className="mr-2 h-4 w-4 text-slate-400" />
                  {classroom.subject}
                </div>
              </CardContent>
              <CardFooter className="pt-0 pb-5 px-6">
                <Link href={`/dashboard/classrooms/${classroom.id}`} className="w-full">
                  <Button variant="outline" className="w-full justify-between rounded-xl group-hover:border-primary/50 group-hover:bg-primary/5 transition-colors">
                    Ver Roadmap
                    <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-primary transition-colors" />
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
