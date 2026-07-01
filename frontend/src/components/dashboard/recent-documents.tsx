"use client";

import Link from "next/link";
import { ArrowRight, Copy, Edit3, FileText } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { DOCUMENT_TYPE_LABELS, type DocumentHistoryItem } from "@/lib/types";
import { formatDate } from "@/lib/utils";

export function RecentDocuments({
  documents,
}: {
  documents: DocumentHistoryItem[];
}) {
  if (documents.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="relative overflow-hidden rounded-2xl border border-surface-200 bg-surface-50 p-8 md:p-12 text-center"
      >
        <div className="w-16 h-16 bg-primary-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <FileText className="w-8 h-8 text-primary-400" />
        </div>

        <h2 className="text-2xl font-bold text-text-900 mb-3">
          Seu primeiro documento leva menos de 1 minuto
        </h2>

        <p className="text-text-400 max-w-lg mx-auto mb-8">
          Escolha o ano escolar, disciplina e tema. A BNCC será sugerida automaticamente.
        </p>

        <div className="flex flex-col md:flex-row items-center justify-center gap-6 mb-10 text-sm font-medium text-text-400">
          <div className="flex flex-col items-center gap-2">
            <span className="w-8 h-8 rounded-full bg-surface-200 flex items-center justify-center text-text-900 font-bold">
              1
            </span>
            Escolha a disciplina
          </div>
          <div className="hidden md:block w-8 border-t-2 border-dashed border-surface-200" />
          <div className="flex flex-col items-center gap-2">
            <span className="w-8 h-8 rounded-full bg-surface-200 flex items-center justify-center text-text-900 font-bold">
              2
            </span>
            Defina o tema
          </div>
          <div className="hidden md:block w-8 border-t-2 border-dashed border-surface-200" />
          <div className="flex flex-col items-center gap-2">
            <span className="w-8 h-8 rounded-full bg-surface-200 flex items-center justify-center text-text-900 font-bold">
              3
            </span>
            Baixe o documento pronto
          </div>
        </div>

        <Link href="/dashboard/new">
          <Button
            size="lg"
            className="px-8 shadow-lg shadow-primary-500/20"
            rightIcon={<ArrowRight className="w-4 h-4" />}
          >
            Criar meu primeiro documento
          </Button>
        </Link>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-text-900">Retomar trabalho</h3>
        <Link
          href="/dashboard/documents"
          className="text-sm font-medium text-primary-400 hover:text-primary-300 transition-colors"
        >
          Ver todos
        </Link>
      </div>

      <div className="space-y-3">
        {documents.map((doc, i) => (
          <motion.div
            key={doc.id}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            className="group flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border border-surface-200 bg-surface-50 hover:bg-surface-100 hover:border-surface-300 transition-all"
          >
            <div className="flex items-start sm:items-center gap-4 mb-4 sm:mb-0">
              <div className="w-12 h-12 rounded-lg bg-surface-200 text-text-500 flex items-center justify-center shrink-0">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-text-900 line-clamp-1 mb-1">
                  {doc.title}
                </h4>
                <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-text-400">
                  <span className="text-primary-400">
                    {doc.kitId ? "Kit de Aula" : DOCUMENT_TYPE_LABELS[doc.type]}
                  </span>
                  {doc.subject && doc.grade && (
                    <>
                      <span className="text-surface-300">•</span>
                      <span>
                        {doc.subject} ({doc.grade})
                      </span>
                    </>
                  )}
                  <span className="text-surface-300">•</span>
                  <span>{formatDate(doc.createdAt)}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Link href={doc.kitId ? `/dashboard/kit/${doc.kitId}` : `/dashboard/document/${doc.id}`} className="flex-1 sm:flex-none">
                <Button
                  variant="secondary"
                  size="sm"
                  className="w-full"
                  leftIcon={<Edit3 className="w-4 h-4" />}
                >
                  Continuar edição
                </Button>
              </Link>
              <Button variant="outline" size="sm" className="px-3" title="Duplicar">
                <Copy className="w-4 h-4 text-text-400" />
              </Button>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
