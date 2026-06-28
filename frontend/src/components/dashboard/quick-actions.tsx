"use client";

import * as React from "react";
import Link from "next/link";
import { BarChart3, BookOpen, ClipboardList, FileCheck2 } from "lucide-react";
import { motion, type Variants } from "framer-motion";
import { Card } from "@/components/ui/card";
import type { DocumentType } from "@/lib/types";
import { DOCUMENT_TYPE_SLUGS } from "@/lib/types";
import { cn } from "@/lib/utils";

const actions: {
  type: DocumentType;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}[] = [
  {
    type: "LESSON_PLAN",
    title: "Plano de Aula",
    description: "Estrutura completa com BNCC, metodologia e avaliação.",
    icon: BookOpen,
    color: "bg-primary-500/20 text-primary-400",
  },
  {
    type: "EXAM",
    title: "Avaliação",
    description: "Questões alinhadas e prontas para uso.",
    icon: ClipboardList,
    color: "bg-purple-500/20 text-purple-400",
  },
  {
    type: "RUBRIC",
    title: "Rubrica",
    description: "Critérios de desempenho bem definidos.",
    icon: FileCheck2,
    color: "bg-emerald-500/20 text-emerald-400",
  },
  {
    type: "REPORT",
    title: "Relatório",
    description: "Registro pedagógico formal automatizado.",
    icon: BarChart3,
    color: "bg-amber-500/20 text-amber-400",
  },
];

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } },
};

export function QuickActions() {
  return (
    <motion.section 
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="mb-10"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {actions.map((action) => {
          const isPrimary = action.type === "LESSON_PLAN";
          
          return (
            <motion.div key={action.type} variants={itemVariants}>
              <Link href={`/dashboard/new?type=${DOCUMENT_TYPE_SLUGS[action.type]}`} className="block h-full">
                <Card 
                  className={cn(
                    "h-full p-5 transition-all duration-300 relative overflow-hidden group",
                    isPrimary 
                      ? "bg-primary-500/10 border-primary-500/50 shadow-[0_0_30px_rgba(79,70,229,0.15)] hover:shadow-[0_0_40px_rgba(79,70,229,0.25)] hover:-translate-y-1"
                      : "bg-surface-50 border-surface-200 hover:border-surface-300 hover:bg-surface-100 hover:-translate-y-1"
                  )}
                >
                  {isPrimary && (
                    <div className="absolute inset-0 bg-gradient-to-br from-primary-500/5 to-transparent pointer-events-none" />
                  )}
                  
                  <div
                    className={cn(
                      "w-12 h-12 rounded-xl mb-4 flex items-center justify-center transition-transform duration-300 group-hover:scale-110",
                      action.color,
                      isPrimary && "bg-primary-500/20 text-primary-400 ring-1 ring-primary-500/30"
                    )}
                  >
                    <action.icon className="w-6 h-6" />
                  </div>
                  <h3 className={cn(
                    "font-bold mb-1",
                    isPrimary ? "text-primary-700" : "text-text-900"
                  )}>
                    {action.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-text-400">
                    {action.description}
                  </p>
                </Card>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </motion.section>
  );
}
