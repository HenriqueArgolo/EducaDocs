"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  AlertCircle,
  ExternalLink,
  Presentation,
  RefreshCw,
  Search,
  Trash2,
  Calendar,
  Sparkles,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { fetchPresentations, deletePresentation, getCachedData, PageResponse } from "@/lib/api";
import type { Presentation as PresentationType } from "@/lib/types";
import { formatDate } from "@/lib/utils";

export default function SlidesDashboardPage() {
  const [presentations, setPresentations] = React.useState<PresentationType[]>(() => {
    if (typeof window === "undefined") return [];
    const cached = getCachedData<PageResponse<PresentationType>>("/presentations?page=0&size=100");
    return cached ? (cached.content || []) : [];
  });
  const [searchTerm, setSearchTerm] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(() => {
    if (typeof window === "undefined") return true;
    const cached = getCachedData<PageResponse<PresentationType>>("/presentations?page=0&size=100");
    return !cached;
  });
  const [error, setError] = React.useState<string | null>(null);

  const loadPresentations = React.useCallback(async () => {
    const searchParams = new URLSearchParams();
    if (searchTerm) searchParams.set("search", searchTerm);
    searchParams.set("page", "0");
    searchParams.set("size", "100");
    const cacheKey = `/presentations?${searchParams.toString()}`;

    const cached = getCachedData<PageResponse<PresentationType>>(cacheKey);
    if (cached) {
      setPresentations(cached.content || []);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      // Fetch presentations (using a default large page size like 100 for user listing)
      const res = await fetchPresentations({ search: searchTerm, page: 0, size: 100 });
      setPresentations(res.content || []);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Não foi possível carregar as apresentações."
      );
    } finally {
      setIsLoading(false);
    }
  }, [searchTerm]);

  React.useEffect(() => {
    // Debounce search slightly
    const delay = setTimeout(() => {
      loadPresentations();
    }, 300);
    return () => clearTimeout(delay);
  }, [searchTerm, loadPresentations]);

  async function handleDelete(id: number, e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm("Excluir esta apresentação permanentemente?")) return;

    try {
      await deletePresentation(id);
      setPresentations(prev => prev.filter(p => p.id !== id));
    } catch (err) {
      alert("Erro ao excluir apresentação.");
    }
  }

  return (
    <div className="space-y-8">
      {/* 1. CABEÇALHO */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-text-900 tracking-tight flex items-center gap-2">
            <Presentation className="w-8 h-8 text-primary-600" />
            Apresentações de Slides
          </h1>
          <p className="text-text-500 mt-1">
            Gere slides de aula completos por IA com notas pedagógicas e imagens reais automaticamente.
          </p>
        </div>
        <Link
          href="/dashboard/slides/new"
          className="inline-flex items-center justify-center rounded-lg bg-primary-600 px-5 py-3 text-sm font-semibold text-white hover:bg-primary-700 transition-colors shadow-md shadow-primary-500/10 cursor-pointer"
        >
          <Sparkles className="w-4 h-4 mr-2" />
          Nova Apresentação
        </Link>
      </div>

      {/* 2. FILTROS E BUSCA */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:max-w-md group">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-text-400 group-focus-within:text-primary-500 transition-colors" />
          </div>
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por tema ou título..."
            className="pl-10 h-11"
          />
        </div>

        {error && (
          <Button
            variant="outline"
            onClick={loadPresentations}
            leftIcon={<RefreshCw className="w-4 h-4" />}
          >
            Recarregar
          </Button>
        )}
      </div>

      {/* 3. ALERTA DE ERRO */}
      {error && (
        <div className="rounded-lg border border-error-500 bg-error-50 p-4 text-sm text-error-600 inline-flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      {/* 4. LISTAGEM */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={index}
              className="h-56 rounded-2xl bg-white border border-surface-200 animate-shimmer"
            />
          ))}
        </div>
      ) : presentations.length === 0 ? (
        <Card className="p-12 text-center bg-surface-0 border-dashed border-surface-300 rounded-2xl max-w-xl mx-auto shadow-sm">
          <Presentation className="w-16 h-16 mx-auto mb-4 text-primary-200 animate-pulse" />
          <h2 className="text-xl font-bold text-text-900 mb-1">
            Nenhuma apresentação criada
          </h2>
          <p className="text-sm text-text-500 mb-6 max-w-sm mx-auto">
            {searchTerm
              ? "Ajuste os filtros de busca para encontrar sua apresentação de slides."
              : "Economize horas de trabalho criando um deck de slides completo com roteiros de aula prontos."}
          </p>
          <Link
            href="/dashboard/slides/new"
            className="inline-flex items-center justify-center rounded-lg bg-primary-600 px-5 py-3 text-sm font-semibold text-white hover:bg-primary-700 transition-colors shadow-md shadow-primary-500/10"
          >
            Criar minha primeira apresentação
          </Link>
        </Card>
      ) : (
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
          initial="hidden"
          animate="visible"
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: { staggerChildren: 0.05 },
            },
          }}
        >
          {presentations.map((pres) => {
            let slideCount = 0;
            try {
              const slidesData = JSON.parse(pres.slidesJson);
              slideCount = Array.isArray(slidesData.slides) ? slidesData.slides.length : 0;
            } catch (e) {
              slideCount = 0;
            }

            return (
              <motion.div
                key={pres.id}
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  visible: { opacity: 1, y: 0 },
                }}
              >
                <Card className="h-full p-6 hover:border-primary-300 hover:shadow-lg transition-all rounded-2xl flex flex-col justify-between group bg-surface-0 border-surface-200">
                  <div>
                    {/* Header Card */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center text-primary-600">
                        <Presentation className="w-5.5 h-5.5" />
                      </div>
                      <button
                        onClick={(e) => handleDelete(pres.id, e)}
                        className="p-1.5 text-text-400 hover:text-error-500 hover:bg-error-50 rounded-lg transition-colors cursor-pointer opacity-0 group-hover:opacity-100 focus:opacity-100"
                        title="Excluir apresentação"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <h2 className="text-lg font-bold text-text-900 mb-2 line-clamp-2 leading-snug group-hover:text-primary-600 transition-colors">
                      {pres.title}
                    </h2>

                    {/* Metadata Badges */}
                    <div className="flex flex-wrap items-center gap-1.5 mb-5">
                      <Badge variant="outline" className="bg-surface-50 text-text-700 font-bold border-surface-200 text-[10px]">
                        {pres.subject}
                      </Badge>
                      <Badge variant="outline" className="bg-primary-50 text-primary-700 font-bold border-primary-100 text-[10px]">
                        {pres.grade}
                      </Badge>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between pt-4 border-t border-surface-100 text-xs text-text-500 font-semibold">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{formatDate(pres.createdAt)}</span>
                      </div>
                      <span>{slideCount} slides</span>
                    </div>

                    <Link
                      href={`/dashboard/slides/${pres.id}`}
                      className="mt-4 w-full inline-flex items-center justify-center gap-1.5 rounded-lg bg-surface-100 hover:bg-primary-50 hover:text-primary-600 px-4 py-2 text-xs font-bold text-text-700 transition-all cursor-pointer border border-transparent hover:border-primary-100"
                    >
                      Editar Workspace
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>
      )}
    </div>
  );
}
