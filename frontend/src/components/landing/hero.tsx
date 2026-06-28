'use client';

import { motion, useScroll, useTransform, useSpring, useMotionValue } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { 
  ArrowRight, Sparkles, CheckCircle2, FileText, 
  Layers, LayoutTemplate, Map, FileSpreadsheet,
  Check, ChevronRight, Workflow
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

// Floating card component
const FloatingCard = ({ children, className, delay = 0, yOffset = 20 }: { children: React.ReactNode, className?: string, delay?: number, yOffset?: number }) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ 
        opacity: 1, 
        scale: 1,
        y: [0, -yOffset, 0] 
      }}
      transition={{ 
        opacity: { duration: 0.5, delay },
        scale: { duration: 0.5, delay },
        y: {
          duration: 4,
          repeat: Infinity,
          repeatType: "reverse",
          ease: "easeInOut",
          delay: delay
        }
      }}
      whileHover={{ scale: 1.05 }}
      className={`absolute ${className} bg-[rgba(255,255,255,0.7)] backdrop-blur-[20px] border border-[rgba(255,255,255,0.4)] shadow-[0_8px_32px_rgba(0,0,0,0.08)] rounded-xl flex items-center gap-3 px-4 py-3 z-30`}
    >
      {children}
    </motion.div>
  );
}

export function Hero() {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const bookRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"]
  });
  const opacity = useTransform(scrollYProgress, [0, 1], [1, 0]);
  const y = useTransform(scrollYProgress, [0, 1], [0, 100]);

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [10, -10]), { damping: 30, stiffness: 100 });
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-15, 15]), { damping: 30, stiffness: 100 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!bookRef.current) return;
    const rect = bookRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    mouseX.set(x / rect.width - 0.5);
    mouseY.set(y / rect.height - 0.5);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  const [isGenerating, setIsGenerating] = useState(true);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isGenerating) {
      interval = setInterval(() => {
        setProgress(p => {
          if (p >= 100) {
            clearInterval(interval);
            setTimeout(() => setIsGenerating(false), 800);
            return 100;
          }
          return p + 2;
        });
      }, 50);
    } else {
      const timeout = setTimeout(() => {
        setProgress(0);
        setIsGenerating(true);
      }, 3000);
      return () => clearTimeout(timeout);
    }
    return () => clearInterval(interval);
  }, [isGenerating]);

  const trustBadges = [
    "100% alinhado à BNCC",
    "Da Educação Infantil ao Ensino Médio",
    "Exportação Word e PDF",
    "Menos de 30 segundos"
  ];

  return (
    <section ref={containerRef} className="relative overflow-hidden bg-[#FAFAFC] text-[#0F172A] min-h-screen flex items-center pt-20 pb-16">
      
      {/* Background Grid & Glow */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080801a_1px,transparent_1px),linear-gradient(to_bottom,#8080801a_1px,transparent_1px)] bg-[size:32px_32px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_110%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(124,58,237,0.05)_0%,transparent_100%)] pointer-events-none" />

      <motion.div style={{ opacity, y }} className="container mx-auto px-4 md:px-6 relative z-10 max-w-[1400px]">
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-12 lg:gap-8 items-center">
          
          {/* LEFT COLUMN */}
          <div className="max-w-3xl text-left relative z-20 flex flex-col items-start w-full">
            
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 backdrop-blur-md border border-[#7C3AED]/20 text-[#7C3AED] text-sm font-semibold mb-6 shadow-sm"
            >
              <Sparkles className="w-4 h-4" />
              <span>EduDocs AI 2.0</span>
            </motion.div>

            {/* Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-[36px] sm:text-[48px] lg:text-[56px] xl:text-[64px] font-[900] tracking-[-0.03em] leading-[1.05] mb-6 text-[#0F172A]"
            >
              Crie planos de aula, <br className="hidden md:block" />
              provas e rubricas <br className="hidden md:block" />
              alinhados à BNCC <br className="hidden md:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-600 via-fuchsia-500 to-pink-500">
                em segundos
              </span>
            </motion.h1>

            {/* Subheadline */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-lg lg:text-xl text-slate-600 mb-10 max-w-2xl leading-relaxed font-medium"
            >
              A IA que transforma habilidades BNCC em documentos prontos para usar. Mais tempo para ensinar, menos tempo para planejar.
            </motion.p>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto mb-10"
            >
              <Button 
                onClick={() => router.push('/dashboard/new')}
                size="xl" 
                className="w-full sm:w-auto relative group overflow-hidden bg-gradient-to-r from-[#7C3AED] to-[#EC4899] text-white rounded-full px-8 py-7 text-lg font-bold hover:scale-[1.03] transition-transform duration-300 shadow-[0_0_24px_rgba(124,58,237,0.3)] hover:shadow-[0_0_32px_rgba(236,72,153,0.4)] border-0"
              >
                <span className="relative z-10 flex items-center gap-2">
                  Criar Meu Primeiro Documento
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </span>
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
              </Button>
              
              <Button 
                variant="ghost" 
                size="xl"
                onClick={() => router.push('/auth/register')}
                className="w-full sm:w-auto text-slate-600 hover:text-slate-900 hover:bg-slate-100/50 rounded-full font-semibold px-8 py-7 text-lg"
              >
                Grátis para começar
              </Button>
            </motion.div>

            {/* Social Proof */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="flex flex-col sm:flex-row items-center sm:items-start gap-4 mb-8"
            >
              <div className="flex -space-x-3">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className={`w-10 h-10 rounded-full border-2 border-white bg-slate-200 z-[${4-i}] overflow-hidden flex items-center justify-center`}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={`https://i.pravatar.cc/100?img=${i+10}`} alt="Professor" className="w-full h-full object-cover" />
                  </div>
                ))}
                <div className="w-10 h-10 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-600 z-0">
                  +2k
                </div>
              </div>
              <div className="text-sm text-slate-600 flex flex-col justify-center">
                <p><strong className="text-slate-900">+2.500</strong> professores cadastrados</p>
                <p><strong className="text-slate-900">+18.000</strong> documentos gerados</p>
              </div>
            </motion.div>

            {/* Trust Badges */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="flex flex-wrap gap-2"
            >
              {trustBadges.map((badge, index) => (
                <div key={index} className="flex items-center gap-1.5 px-3 py-1.5 bg-white/70 border border-slate-200/60 rounded-full text-xs font-semibold text-slate-700 backdrop-blur-md">
                  <Check className="w-3.5 h-3.5 text-[#22C55E] stroke-[3]" />
                  {badge}
                </div>
              ))}
            </motion.div>
          </div>

          {/* RIGHT COLUMN: 3D INTERACTIVE BOOK */}
          <div className="relative w-full h-[400px] lg:h-[500px] flex items-center justify-center [perspective:1200px]" ref={bookRef} onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave}>
            
            {/* Radial Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-[rgba(139,92,246,0.18)] blur-[100px] rounded-full pointer-events-none" />

            {/* Floating Orbiting Cards */}
            <FloatingCard className="-top-4 -left-2 lg:-left-6" delay={0.2} yOffset={15}>
              <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center text-violet-600">
                <LayoutTemplate className="w-4 h-4 stroke-[1.75]" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800">Plano de Aula</p>
                <p className="text-[10px] text-slate-500">6º Ano • História</p>
              </div>
            </FloatingCard>

            <FloatingCard className="top-1/4 -right-0 lg:-right-8" delay={0.5} yOffset={25}>
              <div className="w-8 h-8 rounded-full bg-pink-100 flex items-center justify-center text-pink-600">
                <FileText className="w-4 h-4 stroke-[1.75]" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800">Avaliação</p>
                <p className="text-[10px] text-slate-500">10 Questões</p>
              </div>
            </FloatingCard>

            <FloatingCard className="bottom-16 -left-2 lg:-left-4" delay={0.8} yOffset={20}>
              <div className="w-8 h-8 rounded-full bg-fuchsia-100 flex items-center justify-center text-fuchsia-600">
                <Layers className="w-4 h-4 stroke-[1.75]" />
              </div>
              <p className="text-xs font-bold text-slate-800 pr-1">Rubrica</p>
            </FloatingCard>

            <FloatingCard className="-bottom-2 right-8 lg:right-12" delay={1.1} yOffset={18}>
              <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                <Map className="w-4 h-4 stroke-[1.75]" />
              </div>
              <p className="text-xs font-bold text-slate-800 pr-1">Mapa Mental</p>
            </FloatingCard>
            
            <FloatingCard className="-top-6 right-10" delay={0.4} yOffset={22}>
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                <FileSpreadsheet className="w-4 h-4 stroke-[1.75]" />
              </div>
              <p className="text-xs font-bold text-slate-800 pr-1">Relatório</p>
            </FloatingCard>

            <FloatingCard className="top-1/2 -left-6 lg:-left-12" delay={0.9} yOffset={30}>
              <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-600">
                <Workflow className="w-4 h-4 stroke-[1.75]" />
              </div>
              <p className="text-xs font-bold text-slate-800 pr-1">Sequência Didática</p>
            </FloatingCard>

            {/* The 3D Book */}
            <motion.div 
              style={{ rotateX, rotateY }}
              className="relative w-[320px] md:w-[420px] lg:w-[460px] h-[240px] md:h-[300px] lg:h-[320px] [transform-style:preserve-3d] flex z-20 shadow-2xl rounded-2xl"
            >
              {/* Left Page (Generating) */}
              <div className="w-1/2 h-full bg-white rounded-l-2xl border-t border-b border-l border-slate-200 relative overflow-hidden shadow-[-10px_20px_30px_rgba(0,0,0,0.05)] origin-right [transform-style:preserve-3d] p-4 lg:p-8 flex flex-col">
                <div className="absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-slate-100 to-transparent pointer-events-none" />
                
                <h3 className="text-base lg:text-xl font-bold text-slate-800 mb-4 lg:mb-6 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-[#7C3AED] animate-pulse" />
                  Sua aula está sendo criada
                </h3>

                <div className="w-full bg-slate-100 rounded-full h-2 lg:h-2.5 mb-4 lg:mb-6 overflow-hidden">
                  <motion.div 
                    className="bg-gradient-to-r from-[#7C3AED] to-[#A855F7] h-full rounded-full"
                    style={{ width: `${progress}%` }}
                  />
                </div>

                <div className="flex-1 space-y-3 lg:space-y-4">
                  <p className="text-[10px] lg:text-xs font-semibold text-slate-500 uppercase tracking-wider">Habilidades BNCC</p>
                  
                  <div className="space-y-2 lg:space-y-3">
                    {['EF06HI01', 'EF06HI02', 'EF06HI03'].map((code, i) => (
                      <div key={code} className="flex items-center justify-between text-xs lg:text-sm">
                        <span className="font-medium text-slate-700 bg-slate-100 px-2 py-1 rounded">{code}</span>
                        {progress > (i + 1) * 25 ? (
                          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                            <CheckCircle2 className="w-4 lg:w-5 h-4 lg:h-5 text-[#22C55E]" />
                          </motion.div>
                        ) : (
                          <div className="w-4 lg:w-5 h-4 lg:h-5 border-2 border-slate-200 rounded-full border-t-[#7C3AED] animate-spin" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Book Spine */}
              <div className="w-[4px] h-full bg-gradient-to-b from-slate-200 via-slate-300 to-slate-200 shadow-inner z-10 [transform:translateZ(1px)]" />

              {/* Right Page (Results) */}
              <div className="w-1/2 h-full bg-[#FAFAFC] rounded-r-2xl border-t border-b border-r border-slate-200 relative overflow-hidden shadow-[10px_20px_30px_rgba(0,0,0,0.05)] origin-left [transform-style:preserve-3d] p-4 lg:p-8 flex flex-col">
                <div className="absolute inset-y-0 left-0 w-12 bg-gradient-to-r from-slate-100 to-transparent pointer-events-none" />
                
                <h3 className="text-base lg:text-xl font-bold text-slate-800 mb-4 lg:mb-6 flex items-center justify-between">
                  Documentos gerados
                  {progress === 100 && (
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="bg-[#22C55E]/10 text-[#22C55E] px-2 py-0.5 lg:py-1 rounded text-[10px] lg:text-xs font-bold uppercase">
                      Pronto
                    </motion.div>
                  )}
                </h3>

                <div className="space-y-2 lg:space-y-3">
                  {[
                    { title: "Plano de Aula", icon: LayoutTemplate, delay: 100 },
                    { title: "Avaliação", icon: FileText, delay: 120 },
                    { title: "Rubrica", icon: Layers, delay: 140 },
                    { title: "Relatório", icon: FileSpreadsheet, delay: 160 }
                  ].map((doc) => {
                    const isVisible = progress > (doc.delay / 2);
                    return (
                      <div key={doc.title} className={`flex items-center gap-2 lg:gap-3 p-2 lg:p-3 rounded-xl border ${isVisible ? 'bg-white border-[#7C3AED]/20 shadow-sm' : 'bg-transparent border-dashed border-slate-200 opacity-50'} transition-all duration-300`}>
                        <div className={`w-6 h-6 lg:w-8 lg:h-8 rounded-lg flex items-center justify-center ${isVisible ? 'bg-[#7C3AED]/10 text-[#7C3AED]' : 'bg-slate-100 text-slate-400'}`}>
                          <doc.icon className="w-3 h-3 lg:w-4 lg:h-4 stroke-[1.75]" />
                        </div>
                        <span className={`font-medium text-xs lg:text-sm ${isVisible ? 'text-slate-800' : 'text-slate-400'}`}>{doc.title}</span>
                        {isVisible && <ChevronRight className="w-3 h-3 lg:w-4 lg:h-4 text-slate-300 ml-auto" />}
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>

          </div>
        </div>
      </motion.div>
    </section>
  );
}
