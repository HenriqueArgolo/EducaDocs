"use client";

import * as React from "react";
import { CalendarDays, FileText, Files, NotebookText } from "lucide-react";
import { motion } from "framer-motion";
import type { UserStats } from "@/lib/types";
import { Card } from "@/components/ui/card";
import { NumberTicker } from "@/components/ui/number-ticker";

export function StatsCards({ stats }: { stats: UserStats }) {
  const cards = [
    {
      title: "Total gerado",
      value: stats.totalDocuments,
      icon: Files,
      color: "text-primary-600",
      bgColor: "bg-primary-100",
    },
    {
      title: "Neste mes",
      value: stats.monthlyDocuments,
      icon: CalendarDays,
      color: "text-success-600",
      bgColor: "bg-success-50",
    },
    {
      title: "Planos de aula",
      value: stats.lessonPlans,
      icon: NotebookText,
      color: "text-accent-600",
      bgColor: "bg-accent-50",
    },
    {
      title: "Recentes",
      value: stats.latestDocuments,
      icon: FileText,
      color: "text-warning-500",
      bgColor: "bg-warning-50",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {cards.map((card, i) => (
        <motion.div
          key={card.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: i * 0.05 }}
        >
          <Card className="flex items-center gap-4 p-5 h-full">
            <div className={`p-3 rounded-lg ${card.bgColor}`}>
              <card.icon className={`w-6 h-6 ${card.color}`} />
            </div>
            <div>
              <p className="text-sm font-medium text-text-500">{card.title}</p>
              <h4 className="text-2xl font-bold text-text-900">
                <NumberTicker value={card.value} delay={i * 0.05} />
              </h4>
            </div>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}
