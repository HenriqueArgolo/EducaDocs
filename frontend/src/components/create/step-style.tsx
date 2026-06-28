"use client";

import * as React from "react";
import { Building2, Sparkles, LayoutTemplate, Eye } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import type { TemplateStyle } from "@/lib/types";

const styles: {
  id: TemplateStyle;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}[] = [
  {
    id: "INSTITUTIONAL",
    label: "Institucional",
    description: "Estilo padrão, formal e clássico. Recomendado para o dia a dia escolar.",
    icon: Building2,
    color: "text-blue-500 bg-blue-500/10 border-blue-500/20",
  },
  {
    id: "MODERN",
    label: "Moderno",
    description: "Design contemporâneo com cores vivas e elementos dinâmicos.",
    icon: Sparkles,
    color: "text-purple-500 bg-purple-500/10 border-purple-500/20",
  },
  {
    id: "MINIMALIST",
    label: "Minimalista",
    description: "Simples, limpo e direto ao ponto. Foco essencialmente no conteúdo.",
    icon: LayoutTemplate,
    color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
  },
];

export function StepStyle({
  value,
  onChange,
}: {
  value: TemplateStyle;
  onChange: (value: TemplateStyle) => void;
}) {
  const [hoveredStyle, setHoveredStyle] = React.useState<TemplateStyle | null>(null);
  const activeStyle = hoveredStyle || value;

  return (
    <div className="flex flex-col h-full">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-text-900 mb-2">
          Estilo Visual
        </h2>
        <p className="text-text-500">
          Selecione como deseja que o documento final (DOCX) seja formatado visualmente.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-8 items-start">
        {/* Coluna da Esquerda: Opções Clicáveis */}
        <div className="md:col-span-3 flex flex-col gap-4">
          {styles.map((style, i) => {
            const isSelected = value === style.id;
            return (
              <motion.div
                key={style.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                onMouseEnter={() => setHoveredStyle(style.id)}
                onMouseLeave={() => setHoveredStyle(null)}
              >
                <Card
                  className={`cursor-pointer transition-all border-2 relative overflow-hidden ${
                    isSelected
                      ? "border-primary-500 bg-primary-500/5 shadow-md"
                      : "border-surface-200 hover:border-primary-500/30"
                  }`}
                  onClick={() => onChange(style.id)}
                >
                  {isSelected && <div className="border-beam" />}
                  <div className="flex items-start gap-4 p-5 relative z-10">
                    <div className={`p-3 rounded-lg border ${style.color}`}>
                      <style.icon className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                      <h3
                        className={`font-bold mb-1 text-lg flex items-center gap-2 ${
                          isSelected ? "text-primary-500" : "text-text-900"
                        }`}
                      >
                        {style.label}
                        {style.id === "INSTITUTIONAL" && (
                          <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-800">
                            Recomendado
                          </span>
                        )}
                      </h3>
                      <p className="text-sm text-text-500 leading-relaxed">
                        {style.description}
                      </p>
                    </div>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {/* Coluna da Direita: Visualização Prévia do Layout */}
        <div className="md:col-span-2 flex flex-col items-center">
          <div className="w-full flex items-center justify-between text-sm text-text-400 font-semibold mb-3 px-2">
            <span className="flex items-center gap-1.5">
              <Eye className="w-4 h-4 text-primary-500" />
              Visualização prévia (Folha A4)
            </span>
          </div>

          <div className="w-full bg-surface-50 border border-surface-200 rounded-2xl p-6 flex items-center justify-center min-h-[360px] relative overflow-hidden shadow-inner">
            {/* Efeitos de Luz de fundo dinâmicos com base no estilo selecionado */}
            <div className="absolute inset-0 pointer-events-none opacity-40 blur-2xl transition-all duration-500">
              {activeStyle === "INSTITUTIONAL" && <div className="absolute w-32 h-32 -top-6 -left-6 bg-blue-400/20 rounded-full" />}
              {activeStyle === "MODERN" && <div className="absolute w-32 h-32 -top-6 -left-6 bg-purple-400/20 rounded-full" />}
              {activeStyle === "MINIMALIST" && <div className="absolute w-32 h-32 -top-6 -left-6 bg-emerald-400/20 rounded-full" />}
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={activeStyle}
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -10 }}
                transition={{ duration: 0.25 }}
                className="w-56 aspect-[1/1.4] bg-white border border-surface-200 rounded-lg shadow-lg overflow-hidden flex flex-col relative text-[7px] select-none"
              >
                {/* 1. LAYOUT INSTITUCIONAL */}
                {activeStyle === "INSTITUTIONAL" && (
                  <div className="flex flex-col h-full text-center text-text-700 p-2 font-serif">
                    {/* Barra Azul Formal no topo */}
                    <div className="absolute top-0 left-0 right-0 h-1.5 bg-blue-700" />
                    
                    {/* Cabeçalho Oficial */}
                    <div className="mt-2 text-[6px] leading-[8px] font-bold text-text-800 uppercase">
                      Ministério da Educação
                      <br />
                      <span className="text-[5px] font-normal text-text-500">Secretaria de Educação Básica</span>
                    </div>
                    <div className="text-[7px] font-bold text-blue-700 mt-1">
                      COLÉGIO ESTADUAL D. PEDRO II
                    </div>
                    
                    {/* Linha divisória dupla tradicional */}
                    <div className="border-t-2 border-double border-blue-700 mt-1.5 mx-1" />
                    
                    {/* Corpo do Documento */}
                    <div className="mt-2 text-left px-1 space-y-2 flex-1">
                      <div>
                        <span className="font-bold text-blue-700">PLANO DE AULA - CIÊNCIAS</span>
                        <div className="grid grid-cols-2 gap-1 text-[5px] mt-0.5 text-text-500 border-b border-surface-200 pb-1">
                          <span>Série: 6º Ano B</span>
                          <span>Duração: 50 min</span>
                        </div>
                      </div>
                      
                      <div className="space-y-0.5">
                        <span className="font-bold text-[6px] text-text-900 block">I. OBJETIVOS DE APRENDIZAGEM</span>
                        <p className="text-[5px] text-text-600 leading-normal">
                          Compreender as mudanças de estado físico da água na atmosfera e associar os processos de evaporação e condensação ao ciclo hidrológico.
                        </p>
                      </div>

                      <div className="space-y-0.5">
                        <span className="font-bold text-[6px] text-text-900 block">II. COMPETÊNCIAS DA BNCC</span>
                        <p className="text-[5px] text-text-600 leading-normal">
                          <strong className="text-blue-700 font-bold">(EF06CI04)</strong> Associar a alteração do estado físico da água à variação de temperatura no ambiente.
                        </p>
                      </div>

                      <div className="space-y-0.5">
                        <span className="font-bold text-[6px] text-text-900 block">III. METODOLOGIA DIDÁTICA</span>
                        <p className="text-[5px] text-text-600 leading-normal">
                          Aula expositiva dialogada com demonstração prática utilizando água e fonte de calor, seguida de atividade em grupo.
                        </p>
                      </div>
                    </div>
                    
                    {/* Assinatura do Professor no Rodapé */}
                    <div className="mt-auto pt-2 border-t border-surface-200 flex justify-between text-[5px] text-text-500 px-2">
                      <div className="flex flex-col items-center">
                        <div className="w-16 h-px bg-text-400" />
                        <span className="mt-0.5 font-bold">Assinatura do Docente</span>
                      </div>
                      <div className="flex flex-col items-center">
                        <div className="w-16 h-px bg-text-400" />
                        <span className="mt-0.5">Coordenação Pedagógica</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. LAYOUT MODERNO */}
                {activeStyle === "MODERN" && (
                  <div className="flex flex-col h-full text-text-800 font-sans">
                    {/* Cabeçalho com Degradê Vibrante */}
                    <div className="bg-gradient-to-r from-purple-600 to-pink-500 p-2.5 text-white flex items-center justify-between">
                      <span className="font-bold text-[8px] tracking-wide">EDUDOCS ACADEMY</span>
                      <Sparkles className="w-3 h-3 text-white/80" />
                    </div>
                    
                    {/* Título Moderno */}
                    <div className="p-3 pb-1 border-b border-surface-100 bg-surface-50/50">
                      <span className="text-[5px] font-bold text-pink-500 uppercase tracking-widest block">PLANO DE AULA ATIVO</span>
                      <h4 className="text-[9px] font-extrabold text-purple-950 mt-0.5">Ecossistema e Biodiversidade</h4>
                      <div className="flex gap-2 text-[5px] text-text-500 mt-1">
                        <span className="bg-purple-100 text-purple-700 px-1 rounded">Ens. Fundamental</span>
                        <span className="bg-pink-100 text-pink-700 px-1 rounded">Ciências</span>
                      </div>
                    </div>
                    
                    {/* Cards de Seções Modernos */}
                    <div className="p-3 space-y-2 flex-1 overflow-hidden">
                      <div className="bg-purple-500/5 border border-purple-500/10 rounded-md p-1.5">
                        <span className="font-bold text-[6px] text-purple-700 flex items-center gap-1">
                          <span className="w-1 h-1 rounded-full bg-purple-500" />
                          DESAFIO DE ABERTURA
                        </span>
                        <p className="text-[5.5px] text-text-600 mt-0.5 leading-snug">
                          Apresentar um problema prático sobre a falta de chuva e instigar os alunos a proporem soluções sustentáveis baseadas no ciclo da água.
                        </p>
                      </div>
                      
                      <div className="bg-pink-500/5 border border-pink-500/10 rounded-md p-1.5">
                        <span className="font-bold text-[6px] text-pink-700 flex items-center gap-1">
                          <span className="w-1 h-1 rounded-full bg-pink-500" />
                          METODOLOGIA ATIVA (MA)
                        </span>
                        <div className="text-[5.5px] text-text-600 mt-0.5 space-y-0.5">
                          <p>• **Gamificação:** Quiz de perguntas rápidas.</p>
                          <p>• **Trabalho em Equipe:** Mapa conceitual em grupos.</p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Rodapé Dinâmico */}
                    <div className="bg-gradient-to-r from-purple-600 to-pink-500 h-1.5 w-full mt-auto" />
                  </div>
                )}

                {/* 3. LAYOUT MINIMALISTA */}
                {activeStyle === "MINIMALIST" && (
                  <div className="flex flex-col h-full p-3.5 text-text-800 font-sans">
                    {/* Cabeçalho Clean */}
                    <div className="flex items-center justify-between border-b border-surface-200 pb-2">
                      <span className="font-bold text-[7px] text-text-900 tracking-tight">PLANEJAMENTO</span>
                      <span className="text-[5px] text-emerald-600 font-bold bg-emerald-50 px-1 rounded">MÓDULO I</span>
                    </div>
                    
                    {/* Título Elegante */}
                    <div className="mt-2.5">
                      <h4 className="text-[9px] font-bold text-text-900 tracking-tight">Estudo Dirigido: O Ciclo Hidrológico</h4>
                      <span className="text-[5px] text-text-400 block mt-0.5">Docente Responsável • Ciências</span>
                    </div>
                    
                    {/* Conteúdo Limpo */}
                    <div className="mt-3.5 space-y-2.5 flex-1">
                      <div className="space-y-1">
                        <span className="text-[6px] font-bold text-emerald-600 block tracking-wider uppercase">Objetivo Geral</span>
                        <p className="text-[5.5px] text-text-600 leading-normal">
                          Investigar as propriedades da água em diferentes estados físicos e correlacionar a evaporação solar com a formação de nuvens e chuva.
                        </p>
                      </div>

                      {/* Bloco de Citação / Destaque Lateral */}
                      <div className="border-l-1.5 border-emerald-500 pl-1.5 py-0.5">
                        <span className="text-[5px] font-bold text-text-900 block">Dica Pedagógica</span>
                        <p className="text-[5px] text-text-500 italic">
                          Enfatizar a importância da vegetação local no fenômeno de evapotranspiração.
                        </p>
                      </div>
                    </div>
                    
                    {/* Rodapé Clean */}
                    <div className="mt-auto pt-2 border-t border-surface-150 flex justify-between items-center text-[4.5px] text-text-400">
                      <span>EduDocs.ai • Relatório de Aula</span>
                      <span>Pág 01/01</span>
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}

