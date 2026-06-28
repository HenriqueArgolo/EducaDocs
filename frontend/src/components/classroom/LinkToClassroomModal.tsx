"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Classroom, TimelineItemType } from "@/lib/types";
import { fetchClassrooms, addTimelineItem } from "@/lib/api";
import { PlusCircle } from "lucide-react";

interface LinkToClassroomModalProps {
  documentId?: number;
  activityId?: number;
  presentationId?: number;
  type: TimelineItemType;
  title: string;
  buttonLabel?: string;
  variant?: "primary" | "outline" | "ghost" | "secondary";
  className?: string;
}

export function LinkToClassroomModal({ 
  documentId, 
  activityId, 
  presentationId,
  type,
  title,
  buttonLabel = "Vincular a uma Turma",
  variant = "outline",
  className
}: LinkToClassroomModalProps) {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [selectedClassroomId, setSelectedClassroomId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [isLinking, setIsLinking] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadClassrooms();
    }
  }, [isOpen]);

  const loadClassrooms = async () => {
    try {
      setIsLoading(true);
      const data = await fetchClassrooms();
      setClassrooms(data);
      if (data.length > 0 && !selectedClassroomId) {
        setSelectedClassroomId(data[0].id.toString());
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível carregar suas turmas.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClassroomId) return;
    
    try {
      setIsLinking(true);
      await addTimelineItem(selectedClassroomId, {
        title: title,
        type: type,
        documentId,
        activityId,
        presentationId
      });
      
      toast({
        title: "Sucesso!",
        description: "O recurso foi vinculado ao roadmap da turma com sucesso.",
      });
      setIsOpen(false);
    } catch (error) {
      toast({
        title: "Erro ao vincular",
        description: "Não foi possível adicionar este recurso à turma selecionada.",
        variant: "destructive"
      });
    } finally {
      setIsLinking(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant={variant} className={`rounded-xl ${className}`}>
          <PlusCircle className="mr-2 h-4 w-4" /> {buttonLabel}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] rounded-2xl">
        <DialogHeader>
          <DialogTitle>Vincular ao Roadmap</DialogTitle>
          <DialogDescription>
            Selecione uma turma para adicionar este recurso à linha do tempo de planejamento.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleLink}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Turma Destino</Label>
              {isLoading ? (
                <div className="h-10 w-full animate-pulse bg-slate-100 rounded-xl" />
              ) : classrooms.length === 0 ? (
                <div className="text-sm text-amber-600 bg-amber-50 p-3 rounded-lg border border-amber-200">
                  Você ainda não possui turmas cadastradas. Crie uma na Central de Turmas primeiro.
                </div>
              ) : (
                <Select value={selectedClassroomId} onValueChange={setSelectedClassroomId}>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="Selecione uma turma" />
                  </SelectTrigger>
                  <SelectContent>
                    {classrooms.map((c) => (
                      <SelectItem key={c.id} value={c.id.toString()}>
                        {c.name} ({c.subject})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 mt-2">
              <p className="text-sm font-medium text-slate-700">Recurso selecionado:</p>
              <p className="text-sm text-slate-500 mt-1">{title}</p>
            </div>
          </div>
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setIsOpen(false)}
              className="rounded-xl"
              disabled={isLinking}
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              className="bg-primary text-white rounded-xl hover:bg-primary/90 shadow-sm"
              disabled={isLinking || classrooms.length === 0 || !selectedClassroomId}
            >
              {isLinking ? "Vinculando..." : "Confirmar Vínculo"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
