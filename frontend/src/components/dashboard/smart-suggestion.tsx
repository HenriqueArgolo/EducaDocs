"use client";

import * as React from "react";
import Link from "next/link";
import { Sparkles, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

export function SmartSuggestion() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, type: "spring", stiffness: 300, damping: 24 }}
      className="mb-12 relative overflow-hidden rounded-2xl border border-primary-500/30 bg-primary-500/5 p-6 md:p-8"
    >
      <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
        <Sparkles className="w-48 h-48 text-primary-400 rotate-12" />
      </div>
      
      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-accent-400" />
            <span className="text-sm font-bold text-accent-400 uppercase tracking-wider">
              Sugestão para começar
            </span>
          </div>
          <h3 className="text-xl md:text-2xl font-bold text-text-900 mb-1">
            Plano de aula de História – 6º ano
          </h3>
          <p className="text-text-400">
            Tema: Segunda Guerra Mundial
          </p>
        </div>
        
        <Link href="/dashboard/new?type=lesson-plan&grade=6º ano&subject=História&topic=Segunda Guerra Mundial">
          <Button 
            variant="cta" 
            size="lg" 
            className="w-full md:w-auto shadow-lg shadow-primary-500/20"
            rightIcon={<ArrowRight className="w-4 h-4" />}
          >
            Gerar agora
          </Button>
        </Link>
      </div>
    </motion.div>
  );
}
