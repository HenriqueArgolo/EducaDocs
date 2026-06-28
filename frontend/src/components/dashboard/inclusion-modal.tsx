"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Sparkles,
  AlertCircle,
  Eye,
  Check,
  Brain,
  MessageSquare,
  HelpCircle,
  Download,
  Printer,
  ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { adaptForInclusion, saveDocument, saveActivity } from "@/lib/api";
import type { InclusionType, DocumentType, ActivityType } from "@/lib/types";

interface InclusionModalProps {
  isOpen: boolean;
  onClose: () => void;
  originalContent: string;
  originalTitle: string;
  targetType: "DOCUMENT" | "ACTIVITY";
  documentType?: DocumentType | null;
  activityType?: ActivityType | null;
  generationRequestId?: number | null;
  grade?: string | null;
  subject?: string | null;
}

export function InclusionModal({
  isOpen,
  onClose,
  originalContent,
  originalTitle,
  targetType,
  documentType,
  activityType,
  generationRequestId,
  grade,
  subject
}: InclusionModalProps) {
  const [selectedType, setSelectedType] = React.useState<InclusionType>("TDAH");
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [adaptedData, setAdaptedData] = React.useState<{ title: string; content: string } | null>(null);
  const [isSaving, setIsSaving] = React.useState(false);
  const [isSaved, setIsSaved] = React.useState(false);

  // Load OpenDyslexic font dynamically on demand
  React.useEffect(() => {
    if (isOpen && !document.getElementById("open-dyslexic-font")) {
      const link = document.createElement("link");
      link.id = "open-dyslexic-font";
      link.rel = "stylesheet";
      link.href = "https://cdn.jsdelivr.net/npm/opendyslexic@1.0.3/open-dyslexic.css";
      document.head.appendChild(link);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  async function handleAdapt() {
    setIsLoading(true);
    setError(null);
    setAdaptedData(null);
    setIsSaved(false);

    try {
      const res = await adaptForInclusion({
        content: originalContent,
        type: selectedType,
        title: originalTitle,
        targetType
      });
      setAdaptedData({
        title: res.adaptedTitle,
        content: res.adaptedContent
      });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Erro ao processar adaptação inclusiva com a IA."
      );
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSave() {
    if (!adaptedData) return;
    setIsSaving(true);
    setError(null);

    try {
      if (targetType === "DOCUMENT") {
        await saveDocument({
          title: adaptedData.title,
          type: documentType || "LESSON_PLAN",
          content: adaptedData.content,
          generationRequestId: generationRequestId || undefined
        });
      } else {
        // Save Activity
        await saveActivity({
          title: adaptedData.title,
          description: `Material adaptado para alunos com ${selectedType} com base no tema original.`,
          type: activityType || "WORKSHEET",
          grade: grade || "Geral",
          subject: subject || "Geral",
          content: adaptedData.content,
          isPublic: false
        });
      }
      setIsSaved(true);
    } catch (err) {
      setError("Não foi possível salvar o documento adaptado.");
    } finally {
      setIsSaving(false);
    }
  }

  function handlePrint() {
    if (!adaptedData) return;
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    // Build print HTML page
    const fontStyle = selectedType === "DISLEXIA" 
      ? "font-family: 'OpenDyslexic', 'Comic Sans MS', sans-serif;" 
      : "font-family: Arial, sans-serif;";

    // Check if JSON content or raw text
    let bodyHtml = "";
    try {
      const parsed = JSON.parse(adaptedData.content);
      const title = parsed.titulo || adaptedData.title;
      bodyHtml = `<h1>${title}</h1>`;

      // 1. Exam (questoes & orientacoesGerais)
      if (parsed.questoes && Array.isArray(parsed.questoes)) {
        if (parsed.orientacoesGerais && Array.isArray(parsed.orientacoesGerais)) {
          bodyHtml += `
            <div style="margin-bottom: 25px; padding: 15px; border: 1px solid #ddd; border-radius: 8px; background-color: #f9f9f9; page-break-inside: avoid;">
              <h3 style="margin-top: 0; font-size: 15px; border-bottom: 1px solid #ccc; padding-bottom: 5px;">Orientações Gerais</h3>
              <ul style="padding-left: 20px; margin-bottom: 0;">
                ${parsed.orientacoesGerais.map((item: string) => `<li style="margin-bottom: 6px;">${item}</li>`).join("")}
              </ul>
            </div>
          `;
        }

        parsed.questoes.forEach((ex: any) => {
          const num = ex.numero || ex.numeroQuestao || "";
          const options = ex.alternativas || ex.opcoes;
          bodyHtml += `
            <div style="margin-bottom: 25px; page-break-inside: avoid;">
              <p><strong>Questão ${num}:</strong> ${ex.enunciado}</p>
              ${options && Array.isArray(options) ? `
                <ul style="list-style-type: none; padding-left: 20px; margin-top: 10px;">
                  ${options.map((o: string) => `<li style="margin-bottom: 8px;"><span style="display:inline-block; width:14px; height:14px; border:1px solid #000; border-radius:50%; margin-right:8px; vertical-align:middle;"></span>${o}</li>`).join("")}
                </ul>
              ` : `
                <div style="border-bottom: 1px dashed #ccc; height: 35px; margin-top: 15px;"></div>
                <div style="border-bottom: 1px dashed #ccc; height: 35px; margin-top: 15px;"></div>
              `}
            </div>
          `;
        });
      }
      // 2. Worksheet Activity (exercicios)
      else if (parsed.exercicios && Array.isArray(parsed.exercicios)) {
        parsed.exercicios.forEach((ex: any) => {
          const options = ex.opcoes || ex.alternativas;
          bodyHtml += `
            <div style="margin-bottom: 25px; page-break-inside: avoid;">
              <p><strong>Questão ${ex.numero}:</strong> ${ex.enunciado}</p>
              ${options && Array.isArray(options) ? `
                <ul style="list-style-type: none; padding-left: 20px; margin-top: 10px;">
                  ${options.map((o: string) => `<li style="margin-bottom: 8px;"><span style="display:inline-block; width:14px; height:14px; border:1px solid #000; border-radius:50%; margin-right:8px; vertical-align:middle;"></span>${o}</li>`).join("")}
                </ul>
              ` : `
                <div style="border-bottom: 1px dashed #ccc; height: 35px; margin-top: 15px;"></div>
                <div style="border-bottom: 1px dashed #ccc; height: 35px; margin-top: 15px;"></div>
              `}
            </div>
          `;
        });
      }
      // 3. Coloring Book (paginas)
      else if (parsed.paginas && Array.isArray(parsed.paginas)) {
        parsed.paginas.forEach((page: any) => {
          bodyHtml += `
            <div style="margin-bottom: 35px; border: 1px solid #ddd; padding: 20px; border-radius: 12px; page-break-inside: avoid;">
              <h3 style="margin-top: 0; font-size: 16px; border-bottom: 1px dashed #ccc; padding-bottom: 8px;">Página ${page.numero}: ${page.titulo_pagina || ""}</h3>
              <div style="width: 100%; height: 280px; border: 2px dashed #bbb; border-radius: 8px; margin: 15px 0; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; color: #666; font-size: 12px; background-color: #fafafa;">
                <span style="font-weight: bold; text-transform: uppercase; letter-spacing: 1px; color: #888;">Espaço para colorir</span>
                <span style="font-style: italic; margin-top: 5px; font-size: 10px; max-width: 80%;">"${page.descricao_desenho || ""}"</span>
              </div>
              ${page.texto_apoio ? `<div style="text-align: center; font-size: 14px; font-weight: bold; background: #f3f3f3; padding: 8px; border-radius: 4px;">${page.texto_apoio}</div>` : ""}
            </div>
          `;
        });
      }
      // 4. Flashcards (fichas)
      else if (parsed.fichas && Array.isArray(parsed.fichas)) {
        bodyHtml += `<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">`;
        parsed.fichas.forEach((ficha: any) => {
          bodyHtml += `
            <div style="border: 1px solid #ccc; padding: 15px; border-radius: 8px; background: #fff; page-break-inside: avoid;">
              <div style="font-size: 10px; font-weight: bold; color: #7C3AED; text-transform: uppercase;">Frente</div>
              <div style="font-size: 14px; font-weight: bold; border-bottom: 1px solid #eee; padding-bottom: 8px; margin-bottom: 8px;">${ficha.frente || ""}</div>
              <div style="font-size: 10px; font-weight: bold; color: #10B981; text-transform: uppercase;">Verso</div>
              <div style="font-size: 13px; font-style: italic; color: #444;">${ficha.verso || ""}</div>
            </div>
          `;
        });
        bodyHtml += `</div>`;
      }
      // 5. Game (regras / passo_a_passo / perguntas_jogo)
      else if (parsed.regras || parsed.passo_a_passo || parsed.perguntas_jogo) {
        if (parsed.regras && Array.isArray(parsed.regras)) {
          bodyHtml += `
            <h3 style="font-size: 16px; margin-top: 20px;">Regras do Jogo</h3>
            <ul style="padding-left: 20px;">
              ${parsed.regras.map((rule: string) => `<li style="margin-bottom: 6px;">${rule}</li>`).join("")}
            </ul>
          `;
        }
        if (parsed.passo_a_passo && Array.isArray(parsed.passo_a_passo)) {
          bodyHtml += `
            <h3 style="font-size: 16px; margin-top: 20px;">Como Jogar</h3>
            <ol style="padding-left: 20px;">
              ${parsed.passo_a_passo.map((step: string) => `<li style="margin-bottom: 6px;">${step}</li>`).join("")}
            </ol>
          `;
        }
        if (parsed.perguntas_jogo && Array.isArray(parsed.perguntas_jogo)) {
          bodyHtml += `
            <h3 style="font-size: 16px; margin-top: 20px;">Perguntas do Jogo</h3>
            <div style="display: flex; flex-wrap: wrap; gap: 10px; margin-top: 10px;">
              ${parsed.perguntas_jogo.map((q: string) => `<span style="background: #f0f0f0; border: 1px solid #ddd; padding: 6px 12px; border-radius: 6px; font-size: 13px;">${q}</span>`).join("")}
            </div>
          `;
        }
      }
      // 5b. Rubric (criterios & contextoAvaliacao)
      else if (parsed.criterios && Array.isArray(parsed.criterios)) {
        if (parsed.contextoAvaliacao) {
          bodyHtml += `
            <p style="font-size: 15px; line-height: 1.6; font-style: italic; margin-bottom: 25px;">
              <strong>Contexto da Avaliação:</strong> ${parsed.contextoAvaliacao}
            </p>
          `;
        }
        
        bodyHtml += `
          <h2 style="font-size: 18px; margin-top: 30px; border-bottom: 2px solid #333; padding-bottom: 6px;">Critérios de Avaliação</h2>
        `;
        
        parsed.criterios.forEach((criterio: any) => {
          const name = criterio.nomeCriterio || criterio.nome || "";
          const desc = criterio.descricao || "";
          const levels = criterio.niveisDesempenho || criterio.niveis || [];
          
          bodyHtml += `
            <div style="margin-bottom: 25px; page-break-inside: avoid; border: 1px solid #e2e8f0; border-radius: 8px; padding: 15px; background-color: #fff;">
              <h3 style="margin-top: 0; margin-bottom: 5px; font-size: 16px; color: #1e293b;">${name}</h3>
              <p style="font-size: 13px; color: #64748b; margin-bottom: 12px; margin-top: 0;">${desc}</p>
              
              <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 10px; margin-top: 10px;">
                ${levels.map((lvl: any) => {
                  const lvlName = lvl.nivel || lvl.nome || "";
                  const lvlDesc = lvl.descricao || "";
                  const pts = lvl.pontuacao !== undefined ? lvl.pontuacao : lvl.pontos;
                  const ptsStr = pts !== undefined ? ` (${pts} pts)` : "";
                  return `
                    <div style="border: 1px solid #f1f5f9; border-radius: 6px; padding: 10px; background-color: #f8fafc; font-size: 12px; display: flex; flex-direction: column;">
                      <span style="font-weight: bold; color: #0f172a; margin-bottom: 4px;">${lvlName}${ptsStr}</span>
                      <span style="color: #475569; font-size: 11px; line-height: 1.4;">${lvlDesc}</span>
                    </div>
                  `;
                }).join("")}
              </div>
            </div>
          `;
        });

        if (parsed.orientacoesUso && Array.isArray(parsed.orientacoesUso)) {
          bodyHtml += `
            <h3 style="font-size: 15px; margin-top: 30px; border-bottom: 1px solid #ddd; padding-bottom: 4px;">Orientações de Uso</h3>
            <ul style="padding-left: 20px; font-size: 13px;">
              ${parsed.orientacoesUso.map((item: string) => `<li style="margin-bottom: 6px;">${item}</li>`).join("")}
            </ul>
          `;
        }

        if (parsed.adaptacoesInclusivas && Array.isArray(parsed.adaptacoesInclusivas)) {
          bodyHtml += `
            <h3 style="font-size: 15px; margin-top: 25px; border-bottom: 1px solid #ddd; padding-bottom: 4px;">Adaptações Inclusivas</h3>
            <ul style="padding-left: 20px; font-size: 13px;">
              ${parsed.adaptacoesInclusivas.map((item: string) => `<li style="margin-bottom: 6px;">${item}</li>`).join("")}
            </ul>
          `;
        }
      }
      // 6. Generic Structured JSON (Lesson plan, Rubrics, Reports, etc.)
      else {
        Object.keys(parsed).forEach((key) => {
          if (key === "titulo" || key === "title") return;
          const value = parsed[key];
          if (!value) return;

          const cleanKey = key
            .replace(/([A-Z])/g, " $1")
            .replace(/^./, (str) => str.toUpperCase())
            .trim();

          bodyHtml += `<h3 style="font-size: 16px; margin-top: 25px; border-bottom: 1px solid #eee; padding-bottom: 4px;">${cleanKey}</h3>`;

          if (Array.isArray(value)) {
            bodyHtml += `
              <ul style="padding-left: 20px;">
                ${value.map((item: any) => `<li style="margin-bottom: 6px;">${typeof item === "object" ? JSON.stringify(item) : item}</li>`).join("")}
              </ul>
            `;
          } else if (typeof value === "object") {
            bodyHtml += `<pre style="white-space: pre-wrap; font-family: inherit; font-size: 13px; line-height: 1.6; background: #fafafa; padding: 10px; border-radius: 6px;">${JSON.stringify(value, null, 2)}</pre>`;
          } else {
            bodyHtml += `<p style="font-size: 15px; line-height: 1.6;">${String(value)}</p>`;
          }
        });
      }
    } catch (e) {
      bodyHtml = `<h1>${adaptedData.title}</h1><pre style="white-space: pre-wrap; font-family: inherit; line-height: 1.6;">${adaptedData.content}</pre>`;
    }

    printWindow.document.write(`
      <html>
        <head>
          <title>${adaptedData.title}</title>
          <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/opendyslexic@1.0.3/open-dyslexic.css" />
          <style>
            body { 
              padding: 40px; 
              ${fontStyle}
              color: #111; 
              max-width: 800px;
              margin: 0 auto;
            }
            h1 { 
              text-align: center; 
              border-bottom: 2px solid #333; 
              padding-bottom: 10px; 
              margin-bottom: 30px;
              font-size: 22px;
            }
            p, li {
              font-size: 15px;
              line-height: 1.8;
            }
          </style>
        </head>
        <body>
          ${bodyHtml}
          <script>
            window.onload = function() {
              window.print();
              window.onafterprint = function() { window.close(); };
            }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  }

  // Parse adapted JSON for preview rendering
  let parsedContent: any = null;
  let isJson = false;
  if (adaptedData) {
    try {
      parsedContent = JSON.parse(adaptedData.content);
      isJson = true;
    } catch (e) {
      isJson = false;
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />

      {/* Modal Card */}
      <motion.div
        className="bg-white rounded-2xl shadow-2xl border border-surface-200 w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col z-10 relative"
        initial={{ opacity: 0, y: 30, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 30, scale: 0.98 }}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-surface-200 flex justify-between items-center bg-surface-50 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-purple-50 rounded-lg text-purple-600">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-extrabold text-base text-text-900 leading-tight">
                Adaptador de Inclusão Pedagógica (PDI / AEE)
              </h2>
              <p className="text-[10px] text-text-500 font-medium">
                Adapte seus materiais didáticos utilizando diretrizes de psicopedagogia especial.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-text-400 hover:text-text-700 hover:bg-surface-100 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {error && (
            <div className="p-4 bg-error-50 border border-error-200 rounded-xl text-error-800 text-xs flex items-start gap-2.5 shadow-sm">
              <AlertCircle className="w-5 h-5 text-error-500 shrink-0" />
              <div>
                <strong className="font-bold block mb-0.5">Erro ao processar:</strong>
                {error}
              </div>
            </div>
          )}

          {!adaptedData ? (
            /* PASSO 1: CONFIGURAÇÃO */
            <div className="space-y-6">
              <span className="text-xs font-bold text-text-700 uppercase tracking-wider block">
                Escolha o Perfil de Adaptação
              </span>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* TDAH */}
                <button
                  onClick={() => setSelectedType("TDAH")}
                  className={`p-5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between h-40 ${
                    selectedType === "TDAH"
                      ? "border-purple-600 bg-purple-50/20 ring-1 ring-purple-600/20"
                      : "border-surface-200 hover:border-surface-300 hover:bg-surface-50 bg-white"
                  }`}
                >
                  <div className="p-2 bg-purple-50 rounded-lg text-purple-600 w-fit">
                    <Brain className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-text-800 mb-1">Déficit de Atenção (TDAH)</h3>
                    <p className="text-[10px] text-text-500 leading-snug">
                      Tópicos curtos, negritos nas palavras-chave e lembretes de foco.
                    </p>
                  </div>
                </button>

                {/* Autismo */}
                <button
                  onClick={() => setSelectedType("AUTISMO")}
                  className={`p-5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between h-40 ${
                    selectedType === "AUTISMO"
                      ? "border-blue-600 bg-blue-50/20 ring-1 ring-blue-600/20"
                      : "border-surface-200 hover:border-surface-300 hover:bg-surface-50 bg-white"
                  }`}
                >
                  <div className="p-2 bg-blue-50 rounded-lg text-blue-600 w-fit">
                    <MessageSquare className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-text-800 mb-1">Espectro Autista (TEA)</h3>
                    <p className="text-[10px] text-text-500 leading-snug">
                      Instruções altamente sequenciais e explícitas, linguagem 100% literal.
                    </p>
                  </div>
                </button>

                {/* Dislexia */}
                <button
                  onClick={() => setSelectedType("DISLEXIA")}
                  className={`p-5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between h-40 ${
                    selectedType === "DISLEXIA"
                      ? "border-emerald-600 bg-emerald-50/20 ring-1 ring-emerald-600/20"
                      : "border-surface-200 hover:border-surface-300 hover:bg-surface-50 bg-white"
                  }`}
                >
                  <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600 w-fit">
                    <HelpCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-text-800 mb-1">Dislexia</h3>
                    <p className="text-[10px] text-text-500 leading-snug">
                      Fonte de alta legibilidade, sentenças na voz ativa e espaçamento otimizado.
                    </p>
                  </div>
                </button>
              </div>

              <div className="p-4 bg-purple-50/50 border border-purple-100 rounded-xl text-xs leading-relaxed text-text-600 flex items-start gap-2.5 shadow-inner">
                <Brain className="w-5 h-5 text-purple-500 shrink-0 mt-0.5 animate-pulse" />
                <div>
                  <strong className="text-purple-800 block mb-0.5">Como a IA adapta:</strong>
                  Ao clicar em adaptar, a IA do EduDocs lerá o conteúdo do seu documento e o reescreverá aplicando as melhores práticas psicopedagógicas sem alterar o rigor científico ou as respostas das questões.
                </div>
              </div>
            </div>
          ) : (
            /* PASSO 2: PREVIEW DA ADAPTAÇÃO */
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-text-500 uppercase tracking-wider block">
                  Material Adaptado Prontinho:
                </span>
                <Badge variant="success" className="font-bold text-[10px]">
                  Adaptado para {selectedType}
                </Badge>
              </div>

              {/* Preview Box */}
              <div 
                className={`p-6 border border-surface-200 rounded-2xl bg-surface-50/30 max-h-[350px] overflow-y-auto leading-relaxed text-sm ${
                  selectedType === "DISLEXIA" ? "font-['OpenDyslexic',sans-serif]" : "font-sans text-text-700"
                }`}
              >
                <h3 className="text-lg font-extrabold text-text-900 mb-4 border-b border-surface-200 pb-2">
                  {adaptedData.title}
                </h3>
                
                {isJson && parsedContent ? (
                  <div className="space-y-6">
                    {/* Render Title/Desc if exists */}
                    {parsedContent.descricao && (
                      <p className="text-xs text-text-500 italic bg-purple-50/50 p-3 rounded-lg border border-purple-100 mb-4">
                        <strong>Nota Pedagógica:</strong> {parsedContent.descricao}
                      </p>
                    )}
                    {parsedContent.instrucoes_alunos && (
                      <p className="text-xs text-text-600 leading-relaxed mb-4">
                        <strong>Instruções:</strong> {parsedContent.instrucoes_alunos}
                      </p>
                    )}

                    {/* Render based on array keys */}
                    {/* 1a. EXAM / QUESTÕES */}
                    {parsedContent.questoes && Array.isArray(parsedContent.questoes) && (
                      <div className="space-y-6">
                        {parsedContent.orientacoesGerais && Array.isArray(parsedContent.orientacoesGerais) && (
                          <div className="p-4 border border-surface-200 rounded-xl bg-surface-50/50 space-y-2">
                            <h4 className="font-bold text-xs text-text-800 uppercase tracking-wider">Orientações Gerais</h4>
                            <ul className="list-disc pl-5 text-xs text-text-600 space-y-1">
                              {parsedContent.orientacoesGerais.map((item: string, idx: number) => (
                                <li key={idx}>{item}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        <div className="space-y-6">
                          {parsedContent.questoes.map((ex: any) => {
                            const num = ex.numero || ex.numeroQuestao || 0;
                            const options = ex.alternativas || ex.opcoes;
                            return (
                              <div key={num} className="space-y-2">
                                <p className="font-bold text-text-900">
                                  Questão {num}: <span className="font-normal whitespace-pre-wrap">{ex.enunciado}</span>
                                </p>
                                {options && Array.isArray(options) && (
                                  <div className="grid grid-cols-2 gap-2 pl-4">
                                    {options.map((opt: string, idx: number) => (
                                      <div key={idx} className="flex items-center gap-2 text-xs">
                                        <span className="w-4 h-4 rounded-full border border-text-400 shrink-0" />
                                        <span>{opt}</span>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* 1b. WORKSHEET / EXERCÍCIOS */}
                    {parsedContent.exercicios && Array.isArray(parsedContent.exercicios) && (
                      <div className="space-y-6">
                        {parsedContent.exercicios.map((ex: any) => {
                          const options = ex.opcoes || ex.alternativas;
                          return (
                            <div key={ex.numero} className="space-y-2">
                              <p className="font-bold text-text-900">
                                Questão {ex.numero}: <span className="font-normal whitespace-pre-wrap">{ex.enunciado}</span>
                              </p>
                              {options && Array.isArray(options) && (
                                <div className="grid grid-cols-2 gap-2 pl-4">
                                  {options.map((opt: string, idx: number) => (
                                    <div key={idx} className="flex items-center gap-2 text-xs">
                                      <span className="w-4 h-4 rounded-full border border-text-400 shrink-0" />
                                      <span>{opt}</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* 2. COLORING_BOOK / PÁGINAS */}
                    {parsedContent.paginas && Array.isArray(parsedContent.paginas) && (
                      <div className="space-y-6">
                        {parsedContent.paginas.map((page: any) => (
                          <div key={page.numero} className="border border-surface-200 p-4 rounded-xl bg-surface-50/20 space-y-3">
                            <p className="font-bold text-text-900 text-xs">
                              Página {page.numero}: <span className="text-primary-600">{page.titulo_pagina}</span>
                            </p>
                            <div className="w-full aspect-[1.8] border border-dashed border-text-300 bg-white rounded-lg flex flex-col items-center justify-center p-4 text-center">
                              <svg className="w-8 h-8 text-text-300 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              <span className="text-[9px] uppercase font-bold text-text-400 tracking-wider">Espaço para colorir</span>
                              <p className="text-[8px] text-text-400 mt-0.5 italic max-w-xs">"{page.descricao_desenho}"</p>
                            </div>
                            {page.texto_apoio && (
                              <div className="text-center text-xs font-mono font-bold tracking-widest text-text-500 bg-surface-100 py-1.5 rounded">
                                {page.texto_apoio}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* 3. FLASHCARDS / FICHAS */}
                    {parsedContent.fichas && Array.isArray(parsedContent.fichas) && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {parsedContent.fichas.map((ficha: any, idx: number) => (
                          <div key={idx} className="border border-surface-200 p-4 rounded-xl bg-white shadow-sm flex flex-col gap-2">
                            <div className="text-[9px] font-bold text-primary-500 uppercase">Frente</div>
                            <div className="text-xs font-semibold text-text-800 border-b border-surface-100 pb-2">{ficha.frente}</div>
                            <div className="text-[9px] font-bold text-emerald-500 uppercase mt-1">Verso</div>
                            <div className="text-xs text-text-600 italic">{ficha.verso}</div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* 4. GAME / REGRAS & PASSO A PASSO */}
                    {((parsedContent.regras && Array.isArray(parsedContent.regras)) || 
                      (parsedContent.passo_a_passo && Array.isArray(parsedContent.passo_a_passo)) || 
                      (parsedContent.perguntas_jogo && Array.isArray(parsedContent.perguntas_jogo))) && (
                      <div className="space-y-4">
                        {parsedContent.regras && Array.isArray(parsedContent.regras) && (
                          <div>
                            <h4 className="font-bold text-xs text-text-800 uppercase tracking-wider mb-2">Regras do Jogo</h4>
                            <ul className="list-disc pl-5 text-xs text-text-600 space-y-1">
                              {parsedContent.regras.map((rule: string, idx: number) => (
                                <li key={idx}>{rule}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {parsedContent.passo_a_passo && Array.isArray(parsedContent.passo_a_passo) && (
                          <div>
                            <h4 className="font-bold text-xs text-text-800 uppercase tracking-wider mb-2">Como Jogar (Passo a Passo)</h4>
                            <ol className="list-decimal pl-5 text-xs text-text-600 space-y-1">
                              {parsedContent.passo_a_passo.map((step: string, idx: number) => (
                                <li key={idx}>{step}</li>
                              ))}
                            </ol>
                          </div>
                        )}
                        {parsedContent.perguntas_jogo && Array.isArray(parsedContent.perguntas_jogo) && (
                          <div>
                            <h4 className="font-bold text-xs text-text-800 uppercase tracking-wider mb-2">Perguntas / Termos do Jogo</h4>
                            <div className="flex flex-wrap gap-2 mt-1">
                              {parsedContent.perguntas_jogo.map((q: string, idx: number) => (
                                <span key={idx} className="bg-surface-100 border border-surface-200 text-text-700 text-xs px-2.5 py-1 rounded-lg">
                                  {q}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* 4b. RUBRIC / CRITÉRIOS */}
                    {parsedContent.criterios && Array.isArray(parsedContent.criterios) && (
                      <div className="space-y-6">
                        {parsedContent.contextoAvaliacao && (
                          <div className="p-4 border border-purple-100 rounded-xl bg-purple-50/20 text-xs text-text-700 leading-relaxed italic">
                            <strong>Contexto da Avaliação:</strong> {parsedContent.contextoAvaliacao}
                          </div>
                        )}

                        <div className="space-y-6">
                          {parsedContent.criterios.map((criterio: any, idx: number) => {
                            const name = criterio.nomeCriterio || criterio.nome || "";
                            const desc = criterio.descricao || "";
                            const levels = criterio.niveisDesempenho || criterio.niveis || [];
                            return (
                              <div key={idx} className="p-4 border border-surface-200 rounded-xl bg-white shadow-sm space-y-3">
                                <div>
                                  <h4 className="font-bold text-sm text-text-800">{name}</h4>
                                  <p className="text-xs text-text-500 mt-0.5">{desc}</p>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-1">
                                  {levels.map((lvl: any, lIdx: number) => {
                                    const lvlName = lvl.nivel || lvl.nome || "";
                                    const lvlDesc = lvl.descricao || "";
                                    const pts = lvl.pontuacao !== undefined ? lvl.pontuacao : lvl.pontos;
                                    const ptsStr = pts !== undefined ? ` (${pts} pts)` : "";
                                    return (
                                      <div key={lIdx} className="p-3 border border-surface-100 rounded-lg bg-surface-50/50 flex flex-col gap-1 text-xs">
                                        <span className="font-bold text-text-800">{lvlName}{ptsStr}</span>
                                        <span className="text-text-600 text-[10px] leading-relaxed">{lvlDesc}</span>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {parsedContent.orientacoesUso && Array.isArray(parsedContent.orientacoesUso) && (
                          <div className="space-y-2">
                            <h4 className="font-bold text-xs text-text-800 uppercase tracking-wider">Orientações de Uso</h4>
                            <ul className="list-disc pl-5 text-xs text-text-600 space-y-1">
                              {parsedContent.orientacoesUso.map((item: string, idx: number) => (
                                <li key={idx}>{item}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {parsedContent.adaptacoesInclusivas && Array.isArray(parsedContent.adaptacoesInclusivas) && (
                          <div className="space-y-2 pt-2">
                            <h4 className="font-bold text-xs text-text-800 uppercase tracking-wider">Adaptações Inclusivas</h4>
                            <ul className="list-disc pl-5 text-xs text-text-600 space-y-1">
                              {parsedContent.adaptacoesInclusivas.map((item: string, idx: number) => (
                                <li key={idx}>{item}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}

                    {/* 5. GENERIC FIELDS (Lesson plan / Rubrics / etc) */}
                    {!parsedContent.exercicios && !parsedContent.questoes && !parsedContent.paginas && !parsedContent.fichas && !parsedContent.regras && !parsedContent.passo_a_passo && !parsedContent.perguntas_jogo && !parsedContent.criterios && (
                      <div className="space-y-4">
                        {Object.keys(parsedContent).map((key) => {
                          if (key === "titulo" || key === "title") return null;
                          const val = parsedContent[key];
                          if (!val) return null;
                          const cleanKey = key
                            .replace(/([A-Z])/g, " $1")
                            .replace(/^./, (str) => str.toUpperCase())
                            .trim();
                          return (
                            <div key={key} className="space-y-1">
                              <h4 className="font-bold text-xs text-text-800 uppercase tracking-wider border-b border-surface-150 pb-1">{cleanKey}</h4>
                              {Array.isArray(val) ? (
                                <ul className="list-disc pl-5 text-xs text-text-600 space-y-1">
                                  {val.map((item: any, idx: number) => (
                                    <li key={idx} className="whitespace-pre-wrap">{typeof item === "object" ? JSON.stringify(item) : item}</li>
                                  ))}
                                </ul>
                              ) : typeof val === "object" ? (
                                <pre className="p-3 bg-surface-50 border border-surface-100 rounded-lg text-xs font-mono overflow-x-auto">{JSON.stringify(val, null, 2)}</pre>
                              ) : (
                                <p className="text-xs text-text-600 leading-relaxed whitespace-pre-line">{String(val)}</p>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ) : (
                  <pre className="whitespace-pre-wrap font-sans text-xs">{adaptedData.content}</pre>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-surface-200 bg-surface-50 flex items-center justify-between shrink-0">
          {!adaptedData ? (
            <>
              <Button variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button
                variant="primary"
                onClick={handleAdapt}
                isLoading={isLoading}
                leftIcon={<Sparkles className="w-4 h-4" />}
              >
                {isLoading ? "Processando adaptação..." : "Adaptar para Inclusão"}
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={() => setAdaptedData(null)}
                leftIcon={<X className="w-4 h-4" />}
              >
                Voltar
              </Button>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={handlePrint}
                  leftIcon={<Printer className="w-4 h-4" />}
                >
                  Imprimir Adaptado
                </Button>
                <Button
                  variant="primary"
                  onClick={handleSave}
                  isLoading={isSaving}
                  disabled={isSaved}
                  leftIcon={isSaved ? <Check className="w-4 h-4" /> : <Download className="w-4 h-4" />}
                >
                  {isSaved ? "Salvo na Biblioteca!" : (isSaving ? "Salvando..." : "Salvar na Biblioteca")}
                </Button>
              </div>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}
