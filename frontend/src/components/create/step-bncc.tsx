"use client";

import * as React from "react";
import { AlertCircle, Plus, Search, Sparkles, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import type { BNCCSkill } from "@/lib/types";

export function StepBncc({
  skills,
  selectedIds,
  onChange,
  topic = "",
  recommendedIds = [],
  isRecommending = false,
  hasRecommendationAttempted = false,
}: {
  skills: BNCCSkill[];
  selectedIds: number[];
  onChange: (ids: number[]) => void;
  topic?: string;
  recommendedIds?: number[];
  isRecommending?: boolean;
  hasRecommendationAttempted?: boolean;
}) {
  const [searchTerm, setSearchTerm] = React.useState("");

  const selectedSkills = skills.filter((skill) => selectedIds.includes(skill.id));
  const filteredSkills = skills.filter((skill) => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) {
      return true;
    }

    return (
      skill.code.toLowerCase().includes(term) ||
      skill.description.toLowerCase().includes(term)
    );
  });

  const sortedSkills = React.useMemo(() => {
    return [...filteredSkills].sort((a, b) => {
      const aRec = recommendedIds.includes(a.id);
      const bRec = recommendedIds.includes(b.id);
      if (aRec && !bRec) return -1;
      if (!aRec && bRec) return 1;
      return 0;
    });
  }, [filteredSkills, recommendedIds]);

  function toggleSkill(id: number) {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter((selectedId) => selectedId !== id));
      return;
    }

    if (selectedIds.length < 5) {
      onChange([...selectedIds, id]);
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="mb-6">
        <div className="flex items-center justify-between gap-4 mb-2">
          <h2 className="text-2xl font-bold text-text-900">
            Habilidades BNCC
          </h2>
          <Badge variant={selectedIds.length === 5 ? "warning" : "secondary"}>
            {selectedIds.length}/5
          </Badge>
        </div>
        <p className="text-text-500">
          Selecione pelo menos uma habilidade recomendada pela IA ou utilize a busca para encontrar outras específicas.
        </p>
      </div>

      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-400 w-5 h-5" />
          <Input
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Buscar código ou descrição..."
            className="pl-10 h-12"
          />
        </div>
      </div>

      {isRecommending && (
        <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-violet-500/10 via-purple-500/10 to-pink-500/10 border border-purple-500/20 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Sparkles className="w-5 h-5 text-purple-600 animate-pulse" />
              <span className="absolute inset-0 rounded-full bg-purple-400/30 blur animate-ping" />
            </div>
            <div>
              <p className="text-sm font-semibold text-purple-950">IA sugerindo habilidades...</p>
              <p className="text-xs text-purple-700/80">Analisando o tema para identificar os melhores alinhamentos BNCC.</p>
            </div>
          </div>
          <div className="flex space-x-1.5 px-2">
            <span className="w-2.5 h-2.5 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <span className="w-2.5 h-2.5 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <span className="w-2.5 h-2.5 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        </div>
      )}

      {!isRecommending && hasRecommendationAttempted && recommendedIds.length === 0 && (
        <div className="mb-6 p-4 rounded-xl bg-amber-50 border border-amber-200 text-sm text-amber-900">
          A IA nao encontrou uma sugestao automatica para <strong>{topic}</strong>. Selecione uma habilidade manualmente na lista abaixo.
        </div>
      )}

      <div className="mb-8">
        <h3 className="text-sm font-medium text-text-700 mb-3">
          Selecionadas ({selectedIds.length})
        </h3>
        {selectedSkills.length === 0 ? (
          <p className="text-sm text-text-400 italic bg-surface-50 p-4 rounded-lg border border-surface-200 border-dashed">
            Nenhuma habilidade selecionada.
          </p>
        ) : (
          <motion.div layout className="flex flex-wrap gap-2">
            <AnimatePresence>
              {selectedSkills.map((skill) => (
                <motion.button
                  type="button"
                  layout
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ type: "spring", stiffness: 300, damping: 25 }}
                  key={skill.id}
                  onClick={() => toggleSkill(skill.id)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary-50 text-primary-700 rounded-lg border border-primary-100 text-sm font-medium"
                >
                  <span>{skill.code}</span>
                  <X className="w-3.5 h-3.5" />
                </motion.button>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto border border-surface-200 rounded-lg divide-y divide-surface-200 bg-surface-50">
        {sortedSkills.length > 0 ? (
          sortedSkills.map((skill) => {
            const isSelected = selectedIds.includes(skill.id);
            const isRecommended = recommendedIds.includes(skill.id);
            return (
              <button
                type="button"
                key={skill.id}
                className={`w-full text-left p-4 flex items-start gap-4 transition-all duration-200 border-l-2 ${
                  isSelected 
                    ? "bg-primary-50 border-l-primary-500" 
                    : isRecommended 
                      ? "bg-purple-50/30 border-l-purple-400 hover:bg-purple-50/50" 
                      : "border-l-transparent hover:bg-white"
                }`}
                onClick={() => toggleSkill(skill.id)}
              >
                <span
                  className={`mt-1 shrink-0 w-6 h-6 rounded-md border flex items-center justify-center transition-colors ${
                    isSelected
                      ? "bg-primary-600 border-primary-600 text-white"
                      : isRecommended
                        ? "border-purple-300 text-purple-400 bg-purple-50/50"
                        : "border-surface-300 text-surface-300 bg-white"
                  }`}
                >
                  {isSelected ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                </span>
                <span className="flex-1">
                  <span className="flex items-center gap-2 mb-1">
                    <strong
                      className={`text-sm ${
                        isSelected 
                          ? "text-primary-900" 
                          : isRecommended 
                            ? "text-purple-900" 
                            : "text-text-900"
                      }`}
                    >
                      {skill.code}
                    </strong>
                    {isRecommended && (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-purple-100 text-purple-700 border border-purple-200/60">
                        <Sparkles className="w-2.5 h-2.5 text-purple-600 animate-pulse" />
                        Sugerida por IA
                      </span>
                    )}
                  </span>
                  <span className="block text-sm text-text-600">
                    {skill.description}
                  </span>
                </span>
              </button>
            );
          })
        ) : (
          <div className="p-8 text-center text-text-500">
            <AlertCircle className="w-8 h-8 mx-auto mb-2 text-surface-400" />
            <p>Nenhuma habilidade encontrada para o filtro atual.</p>
          </div>
        )}
      </div>
    </div>
  );
}
