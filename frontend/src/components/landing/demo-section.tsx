"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { Sparkles, CheckCircle2, ChevronRight, Wand2 } from "lucide-react";
import { useRef } from "react";

export function DemoSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  });

  const rotateX = useTransform(scrollYProgress, [0, 0.5], [40, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.5], [0.8, 1]);
  const y = useTransform(scrollYProgress, [0, 0.5], [100, 0]);

  return (
    <section ref={containerRef} className="py-32 bg-surface-0 relative overflow-hidden perspective-1000">
      
      {/* Background Grid & Glows */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary-600/10 rounded-full blur-[150px] pointer-events-none" />

      <div className="container mx-auto px-4 md:px-6 relative z-10">
        
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center max-w-4xl mx-auto mb-24"
        >
          <h2 className="text-5xl md:text-7xl font-black tracking-tight text-text-900 mb-8">
            O fim do <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-700 via-primary-600 to-accent-500">Trabalho Braçal.</span>
          </h2>
          <p className="text-xl md:text-2xl text-text-600 font-medium max-w-2xl mx-auto">
            Uma interface imersiva e sem distrações. Feita para você focar no conteúdo da aula enquanto a IA cuida de toda a formatação e alinhamento com a BNCC.
          </p>
        </motion.div>

        {/* 3D Floating Dashboard Mockup */}
        <motion.div
          style={{ rotateX, scale, y }}
          className="relative max-w-6xl mx-auto rounded-2xl border border-surface-200/50 bg-surface-50/80 backdrop-blur-2xl shadow-[0_0_80px_rgba(124,58,237,0.15)] overflow-hidden [transform-style:preserve-3d]"
        >
          {/* Mac window header */}
          <div className="h-14 border-b border-surface-200/50 bg-surface-100/50 flex items-center px-6 gap-3">
            <div className="w-3.5 h-3.5 rounded-full bg-surface-300 hover:bg-error-500 transition-colors" />
            <div className="w-3.5 h-3.5 rounded-full bg-surface-300 hover:bg-warning-500 transition-colors" />
            <div className="w-3.5 h-3.5 rounded-full bg-surface-300 hover:bg-success-500 transition-colors" />
            <div className="mx-auto h-8 w-64 bg-surface-50 rounded-md border border-surface-200 flex items-center justify-center text-xs font-mono text-text-500 shadow-inner">
              <span className="text-primary-400 mr-1">https://</span>edudocs.ai/workspace
            </div>
          </div>
          
          {/* Dashboard mock body */}
          <div className="grid grid-cols-1 md:grid-cols-4 min-h-[600px]">
            {/* Sidebar mock */}
            <div className="hidden md:flex flex-col gap-6 border-r border-surface-200/50 bg-surface-100/20 p-6">
              <div className="flex items-center gap-3 text-text-900 font-bold text-lg mb-4">
                <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center text-white">E</div>
                Workspace
              </div>
              
              <div className="space-y-2">
                {["Visão Geral", "Meus Planos", "Atividades", "Avaliações"].map((item, i) => (
                  <div key={i} className={`h-10 w-full rounded-lg flex items-center px-4 text-sm font-medium ${i === 1 ? 'bg-primary-900/50 text-primary-300 border border-primary-500/20' : 'text-text-400 hover:text-text-900 hover:bg-surface-100'}`}>
                    {item}
                  </div>
                ))}
              </div>

              <div className="mt-auto pt-6 border-t border-surface-200/50">
                <div className="h-12 w-full bg-gradient-to-r from-primary-600 to-accent-600 rounded-xl flex items-center justify-center gap-2 text-white text-sm font-bold shadow-[0_0_20px_rgba(124,58,237,0.3)] hover:scale-105 transition-transform cursor-pointer">
                  <Wand2 className="w-4 h-4" /> Gerar Novo
                </div>
              </div>
            </div>

            {/* Main content mock */}
            <div className="col-span-1 md:col-span-3 p-8 lg:p-12 flex flex-col relative overflow-hidden">
              {/* Subtle grid in content area */}
              <div className="absolute inset-0 bg-[url('/noise.svg')] opacity-[0.03] mix-blend-overlay pointer-events-none" />
              
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-3xl font-bold text-text-900 mb-2">Plano de Biologia</h3>
                  <p className="text-text-500">2º Ano Ensino Médio • BNCC EM13CNT202</p>
                </div>
                <div className="h-10 px-4 rounded-lg bg-success-500/10 text-success-400 border border-success-500/20 flex items-center gap-2 text-sm font-bold">
                  <CheckCircle2 className="w-4 h-4" /> Finalizado
                </div>
              </div>
              
              {/* Editor Mock */}
              <div className="flex-1 rounded-2xl bg-surface-50 border border-surface-200 shadow-inner p-8 relative">
                {/* AI Generation overlay effect */}
                <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-primary-400 to-transparent animate-pulse-glow" />
                
                <div className="space-y-6">
                  <div className="space-y-3">
                    <div className="h-6 w-1/3 bg-surface-200 rounded-md" />
                    <div className="h-4 w-full bg-surface-100 rounded-md" />
                    <div className="h-4 w-full bg-surface-100 rounded-md" />
                    <div className="h-4 w-4/5 bg-surface-100 rounded-md" />
                  </div>
                  
                  <div className="space-y-3 pt-6 border-t border-surface-200/50">
                    <div className="h-6 w-1/4 bg-surface-200 rounded-md" />
                    <div className="h-4 w-full bg-surface-100 rounded-md" />
                    <div className="h-4 w-5/6 bg-surface-100 rounded-md" />
                    <div className="h-4 w-full bg-surface-100 rounded-md" />
                  </div>
                </div>

                {/* Floating context menu */}
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  whileInView={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ delay: 0.5, type: "spring" }}
                  className="absolute bottom-8 right-8 bg-surface-100/90 backdrop-blur-xl border border-surface-200 p-4 rounded-2xl shadow-2xl flex flex-col gap-3 w-64"
                >
                  <div className="flex items-center gap-2 text-sm text-text-400 mb-1">
                    <Sparkles className="w-4 h-4 text-accent-400" /> Ações Rápidas
                  </div>
                  <div className="h-10 rounded-lg bg-surface-200 flex items-center px-3 justify-between text-sm text-text-900 cursor-pointer hover:bg-surface-300">
                    Expandir teoria <ChevronRight className="w-4 h-4 text-text-500" />
                  </div>
                  <div className="h-10 rounded-lg bg-surface-200 flex items-center px-3 justify-between text-sm text-text-900 cursor-pointer hover:bg-surface-300">
                    Gerar questões <ChevronRight className="w-4 h-4 text-text-500" />
                  </div>
                </motion.div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
