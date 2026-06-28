"use client";

import * as React from "react";
import Link from "next/link";
import { AlertCircle, ExternalLink, FileText, RefreshCw, Search } from "lucide-react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { fetchUserDocuments, getCurrentUser, getCachedData } from "@/lib/api";
import {
  DOCUMENT_TYPE_LABELS,
  type DocumentHistoryItem,
} from "@/lib/types";
import { formatDate } from "@/lib/utils";

export default function DocumentsPage() {
  const [documents, setDocuments] = React.useState<DocumentHistoryItem[]>(() => {
    if (typeof window === "undefined") return [];
    const user = getCurrentUser();
    if (!user) return [];
    const cached = getCachedData<DocumentHistoryItem[]>(`/documents/user/${user.id}`);
    return cached ? [...cached].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()) : [];
  });
  const [searchTerm, setSearchTerm] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(() => {
    if (typeof window === "undefined") return true;
    const user = getCurrentUser();
    if (!user) return false;
    const cached = getCachedData<DocumentHistoryItem[]>(`/documents/user/${user.id}`);
    return !cached;
  });
  const [error, setError] = React.useState<string | null>(null);

  const loadDocuments = React.useCallback(async () => {
    const user = getCurrentUser();
    if (!user) {
      setIsLoading(false);
      return;
    }

    const cacheKey = `/documents/user/${user.id}`;
    const cached = getCachedData<DocumentHistoryItem[]>(cacheKey);
    if (cached) {
      setDocuments(
        [...cached].sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
      );
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const docs = await fetchUserDocuments(user.id);
      setDocuments(
        [...docs].sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Nao foi possivel carregar seus documentos."
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    const timeout = window.setTimeout(() => {
      loadDocuments();
    }, 0);

    return () => window.clearTimeout(timeout);
  }, [loadDocuments]);

  const filteredDocuments = documents.filter((doc) => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) {
      return true;
    }

    return (
      doc.title.toLowerCase().includes(term) ||
      DOCUMENT_TYPE_LABELS[doc.type].toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-text-900 tracking-tight">
            Meus documentos
          </h1>
          <p className="text-text-500 mt-1">
            Historico retornado pela API para o usuario autenticado.
          </p>
        </div>
        <Link
          href="/dashboard/new"
          className="inline-flex items-center justify-center rounded-lg bg-primary-600 px-5 py-3 text-sm font-semibold text-white hover:bg-primary-700 transition-colors"
        >
          Novo documento
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:max-w-md group">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-text-400 group-focus-within:text-primary-500 transition-colors" />
          </div>
          <Input
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Buscar por titulo ou tipo..."
            className="pl-10"
          />
        </div>

        {error && (
          <Button
            variant="outline"
            onClick={loadDocuments}
            leftIcon={<RefreshCw className="w-4 h-4" />}
          >
            Recarregar
          </Button>
        )}
      </div>

      {error && (
        <div className="rounded-lg border border-error-500 bg-error-50 p-4 text-sm text-error-600 inline-flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className="h-48 rounded-xl bg-white border border-surface-200 animate-shimmer"
            />
          ))}
        </div>
      ) : filteredDocuments.length === 0 ? (
        <Card className="p-8 text-center bg-surface-50 border-dashed border-surface-300">
          <FileText className="w-10 h-10 mx-auto mb-3 text-surface-400" />
          <h2 className="text-lg font-semibold text-text-900 mb-1">
            Nenhum documento encontrado
          </h2>
          <p className="text-sm text-text-500 mb-5">
            {documents.length === 0
              ? "Gere seu primeiro documento usando uma habilidade BNCC cadastrada."
              : "Ajuste a busca para ver outros documentos."}
          </p>
          <Link
            href="/dashboard/new"
            className="inline-flex items-center justify-center rounded-lg bg-primary-600 px-5 py-3 text-sm font-semibold text-white hover:bg-primary-700 transition-colors"
          >
            Criar documento
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
          {filteredDocuments.map((doc) => (
            <motion.div
              key={doc.id}
              variants={{
                hidden: { opacity: 0, y: 18 },
                visible: { opacity: 1, y: 0 },
              }}
            >
              <Card className="h-full p-6 hover:border-primary-200 hover:shadow-md transition-all">
                <div className="w-12 h-12 rounded-lg bg-primary-50 flex items-center justify-center mb-5">
                  <FileText className="w-6 h-6 text-primary-600" />
                </div>

                <h2 className="text-lg font-bold text-text-900 mb-2 line-clamp-2">
                  {doc.title}
                </h2>

                <div className="flex flex-wrap items-center gap-2 text-sm text-text-500 mb-6">
                  <span>{DOCUMENT_TYPE_LABELS[doc.type]}</span>
                  <span>|</span>
                  <span>{formatDate(doc.createdAt)}</span>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-surface-100">
                  <Badge variant="success">Gerado</Badge>
                  <Link
                    href={`/dashboard/document/${doc.id}`}
                    className="inline-flex items-center gap-2 text-sm font-semibold text-primary-600 hover:text-primary-700"
                  >
                    Abrir
                    <ExternalLink className="w-4 h-4" />
                  </Link>
                </div>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
}
