"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { BookOpen, Zap, Target, Shield, Sparkles, Layout } from "lucide-react";
import { useRef } from "react";

const benefits = [
  {
    title: "100% Alinhado à BNCC",
    description: "Nossa IA foi treinada com toda a matriz da Base Curricular. Selecione o ano, disciplina e as habilidades, e veja o plano se montar sozinho.",
    icon: Target,
    colSpan: "col-span-1 md:col-span-2",
    delay: 0.1,
    color: {
      bg: "bg-primary-50/80",
      border: "border-l-primary-500",
      iconBg: "bg-primary-100",
      iconColor: "text-primary-600",
      shadow: "shadow-primary-500/10",
    }
  },
  {
    title: "Geração em Segundos",
    description: "Planos de aula completos em milissegundos.",
    icon: Zap,
    colSpan: "col-span-1",
    delay: 0.2,
    color: {
      bg: "bg-blue-50/80",
      border: "border-l-blue-500",
      iconBg: "bg-blue-100",
      iconColor: "text-blue-600",
      shadow: "shadow-blue-500/10",
    }
  },
  {
    title: "Editor Imersivo",
    description: "Layout limpo focado na escrita.",
    icon: Layout,
    colSpan: "col-span-1",
    delay: 0.3,
    color: {
      bg: "bg-emerald-50/80",
      border: "border-l-emerald-500",
      iconBg: "bg-emerald-100",
      iconColor: "text-emerald-600",
      shadow: "shadow-emerald-500/10",
    }
  },
  {
    title: "Múltiplos Formatos",
    description: "Provas, roteiros e rubricas integrados.",
    icon: BookOpen,
    colSpan: "col-span-1",
    delay: 0.4,
    color: {
      bg: "bg-amber-50/80",
      border: "border-l-amber-500",
      iconBg: "bg-amber-100",
      iconColor: "text-amber-600",
      shadow: "shadow-amber-500/10",
    }
  },
  {
    title: "Ambiente Protegido",
    description: "Seus dados educacionais nunca são usados para treinar modelos externos. Privacidade total.",
    icon: Shield,
    colSpan: "col-span-1 md:col-span-2",
    delay: 0.5,
    color: {
      bg: "bg-rose-50/80",
      border: "border-l-rose-500",
      iconBg: "bg-rose-100",
      iconColor: "text-rose-600",
      shadow: "shadow-rose-500/10",
    }
  },
];

export function Benefits() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  });

  const y = useTransform(scrollYProgress, [0, 1], [100, -100]);
  const opacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0, 1, 1, 0]);

  return (
    <section ref={containerRef} className="py-32 bg-surface-0 relative overflow-hidden">
      {/* Deep Space Gradients -> Vibrant Light Gradients */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-7xl pointer-events-none">
        <div className="absolute top-[20%] right-[-10%] w-[500px] h-[500px] bg-primary-400/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-[10%] left-[-10%] w-[600px] h-[600px] bg-accent-400/20 rounded-full blur-[150px]" />
      </div>

      <div className="container mx-auto px-4 md:px-6 relative z-10">
        
        <motion.div 
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="text-center max-w-3xl mx-auto mb-20"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-surface-200 text-primary-600 text-sm font-bold tracking-wide uppercase mb-8 shadow-sm">
            <Sparkles className="w-4 h-4" />
            <span>Infraestrutura Inteligente</span>
          </div>
          <h2 className="text-5xl md:text-6xl font-black tracking-tight text-text-900 mb-6 leading-tight">
            Pare de digitar.<br/>
            Comece a <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-accent-500">ensinar.</span>
          </h2>
          <p className="text-xl text-text-500 font-medium">
            A primeira inteligência artificial construída do zero para entender o fluxo de trabalho do professor brasileiro.
          </p>
        </motion.div>

        <motion.div 
          style={{ y, opacity }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto"
        >
          {benefits.map((benefit, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.8, y: 50, rotateX: 20 }}
              whileInView={{ opacity: 1, scale: 1, y: 0, rotateX: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ 
                duration: 0.7, 
                delay: benefit.delay, 
                type: "spring", 
                bounce: 0.4 
              }}
              className={`group relative ${benefit.color.bg} border-l-4 ${benefit.color.border} rounded-3xl p-8 transition-all duration-500 overflow-hidden shadow-lg shadow-surface-200/40 hover:shadow-xl hover:${benefit.color.shadow} hover:-translate-y-1 ${benefit.colSpan}`}
            >
              <div className="relative z-10 flex flex-col h-full">
                <div className={`w-14 h-14 rounded-full ${benefit.color.iconBg} flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-500 shadow-sm`}>
                  <benefit.icon className={`w-7 h-7 ${benefit.color.iconColor}`} />
                </div>
                
                <h3 className="text-2xl font-bold text-text-900 mb-4 tracking-tight">{benefit.title}</h3>
                <p className="text-text-500 text-lg leading-relaxed mt-auto">{benefit.description}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
