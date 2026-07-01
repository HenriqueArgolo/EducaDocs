"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { TemplateStyle } from "@/lib/types";

// ─────────────────────────────────────────────────────────────
// PREVIEWS SVG — cada um é um documento A4 em miniatura
// ─────────────────────────────────────────────────────────────

function PreviewInstitucional() {
  return (
    <svg
      viewBox="0 0 220 310"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full h-full"
      style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
    >
      {/* Fundo branco */}
      <rect width="220" height="310" fill="#ffffff" />

      {/* Faixa azul escura no topo */}
      <rect x="0" y="0" width="220" height="7" fill="#1a3a6b" />

      {/* Brasão / Ícone institucional */}
      <circle cx="110" cy="28" r="11" fill="none" stroke="#1a3a6b" strokeWidth="1.5" />
      <text x="110" y="32" textAnchor="middle" fontSize="10" fill="#1a3a6b" fontWeight="bold">✦</text>

      {/* Nome da instituição */}
      <text x="110" y="50" textAnchor="middle" fontSize="7" fill="#1a3a6b" fontWeight="bold" letterSpacing="0.5">SECRETARIA MUNICIPAL DE EDUCAÇÃO</text>
      <text x="110" y="59" textAnchor="middle" fontSize="5.5" fill="#555" letterSpacing="0.3">Escola Municipal Prof. João Alves</text>

      {/* Linha dupla divisória */}
      <line x1="18" y1="65" x2="202" y2="65" stroke="#1a3a6b" strokeWidth="1.5" />
      <line x1="18" y1="67.5" x2="202" y2="67.5" stroke="#1a3a6b" strokeWidth="0.5" />

      {/* Título do documento */}
      <text x="110" y="80" textAnchor="middle" fontSize="8.5" fill="#1a3a6b" fontWeight="bold" letterSpacing="0.8">PLANO DE AULA</text>
      <text x="110" y="89" textAnchor="middle" fontSize="6" fill="#333">Ciências Naturais — 6.º Ano B</text>

      {/* Linha de metadados */}
      <rect x="18" y="93" width="184" height="13" fill="#f0f4fb" rx="2" />
      <text x="24" y="102" fontSize="5.5" fill="#1a3a6b" fontWeight="bold">Data:</text>
      <text x="40" y="102" fontSize="5.5" fill="#444">___/___/______</text>
      <text x="90" y="102" fontSize="5.5" fill="#1a3a6b" fontWeight="bold">Duração:</text>
      <text x="112" y="102" fontSize="5.5" fill="#444">50 min</text>
      <text x="145" y="102" fontSize="5.5" fill="#1a3a6b" fontWeight="bold">Turma:</text>
      <text x="163" y="102" fontSize="5.5" fill="#444">6.º B</text>

      {/* Seção I */}
      <text x="18" y="117" fontSize="6.5" fill="#1a3a6b" fontWeight="bold">I. OBJETIVOS DE APRENDIZAGEM</text>
      <line x1="18" y1="119" x2="202" y2="119" stroke="#c0cfe8" strokeWidth="0.5" />
      <text x="22" y="128" fontSize="5.5" fill="#333">• Compreender os estados físicos da água e suas</text>
      <text x="22" y="136" fontSize="5.5" fill="#333">  transformações no ciclo hidrológico.</text>
      <text x="22" y="144" fontSize="5.5" fill="#333">• Relacionar evaporação e condensação ao clima local.</text>

      {/* Seção II */}
      <text x="18" y="157" fontSize="6.5" fill="#1a3a6b" fontWeight="bold">II. HABILIDADES BNCC</text>
      <line x1="18" y1="159" x2="202" y2="159" stroke="#c0cfe8" strokeWidth="0.5" />
      <rect x="22" y="163" width="30" height="8" fill="#dce8f8" rx="2" />
      <text x="37" y="169.5" textAnchor="middle" fontSize="5" fill="#1a3a6b" fontWeight="bold">EF06CI04</text>
      <text x="57" y="169.5" fontSize="5.5" fill="#333">Associar variação de temperatura à mudança</text>
      <text x="57" y="177" fontSize="5.5" fill="#333">de estado físico da água.</text>

      {/* Seção III */}
      <text x="18" y="190" fontSize="6.5" fill="#1a3a6b" fontWeight="bold">III. METODOLOGIA DIDÁTICA</text>
      <line x1="18" y1="192" x2="202" y2="192" stroke="#c0cfe8" strokeWidth="0.5" />
      <text x="22" y="201" fontSize="5.5" fill="#1a3a6b" fontWeight="bold">Introdução (10 min):</text>
      <text x="22" y="209" fontSize="5.5" fill="#333">Roda de conversa sobre chuva e seca.</text>
      <text x="22" y="219" fontSize="5.5" fill="#1a3a6b" fontWeight="bold">Desenvolvimento (30 min):</text>
      <text x="22" y="227" fontSize="5.5" fill="#333">Experimento prático com água e aquecimento.</text>
      <text x="22" y="237" fontSize="5.5" fill="#1a3a6b" fontWeight="bold">Fechamento (10 min):</text>
      <text x="22" y="245" fontSize="5.5" fill="#333">Síntese coletiva e registro no caderno.</text>

      {/* Linha de assinatura */}
      <line x1="18" y1="272" x2="202" y2="272" stroke="#c0cfe8" strokeWidth="0.5" />
      <line x1="24" y1="285" x2="90" y2="285" stroke="#999" strokeWidth="0.5" />
      <text x="57" y="291" textAnchor="middle" fontSize="5" fill="#777">Assinatura do Docente</text>
      <line x1="130" y1="285" x2="196" y2="285" stroke="#999" strokeWidth="0.5" />
      <text x="163" y="291" textAnchor="middle" fontSize="5" fill="#777">Coordenação Pedagógica</text>

      {/* Faixa azul no rodapé */}
      <rect x="0" y="303" width="220" height="7" fill="#1a3a6b" />
      <text x="110" y="308.5" textAnchor="middle" fontSize="4.5" fill="#ffffff">Documento gerado pelo EducaDocs — Uso Pedagógico Oficial</text>
    </svg>
  );
}

function PreviewModerno() {
  return (
    <svg
      viewBox="0 0 220 310"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full h-full"
      style={{ fontFamily: "'Inter', 'Segoe UI', sans-serif" }}
    >
      {/* Fundo branco */}
      <rect width="220" height="310" fill="#ffffff" />

      {/* Barra lateral colorida esquerda */}
      <rect x="0" y="0" width="6" height="310" fill="url(#gradModerno)" />
      <defs>
        <linearGradient id="gradModerno" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#7c3aed" />
          <stop offset="100%" stopColor="#db2777" />
        </linearGradient>
        <linearGradient id="gradHeader" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#7c3aed" />
          <stop offset="100%" stopColor="#db2777" />
        </linearGradient>
      </defs>

      {/* Header com gradiente */}
      <rect x="0" y="0" width="220" height="38" fill="url(#gradHeader)" />
      <text x="16" y="15" fontSize="6" fill="rgba(255,255,255,0.7)" letterSpacing="1.5" fontWeight="600">PLANO DE AULA</text>
      <text x="16" y="28" fontSize="10" fill="#ffffff" fontWeight="800">Ciclo Hidrológico</text>
      <rect x="16" y="32" width="35" height="5" fill="rgba(255,255,255,0.2)" rx="2" />
      <text x="33.5" y="36.5" textAnchor="middle" fontSize="4.5" fill="#ffffff" fontWeight="600">Ciências • 6.º Ano</text>

      {/* Chips de info */}
      <rect x="16" y="46" width="28" height="9" fill="#f3e8ff" rx="3" />
      <text x="30" y="52.5" textAnchor="middle" fontSize="5" fill="#7c3aed" fontWeight="700">50 minutos</text>
      <rect x="48" y="46" width="28" height="9" fill="#fce7f3" rx="3" />
      <text x="62" y="52.5" textAnchor="middle" fontSize="5" fill="#be185d" fontWeight="700">6.º Ano B</text>
      <rect x="80" y="46" width="32" height="9" fill="#ecfdf5" rx="3" />
      <text x="96" y="52.5" textAnchor="middle" fontSize="5" fill="#065f46" fontWeight="700">EF06CI04</text>

      {/* Card: Objetivos */}
      <rect x="14" y="63" width="192" height="52" fill="#faf5ff" rx="6" />
      <rect x="14" y="63" width="4" height="52" fill="#7c3aed" rx="2" />
      <text x="24" y="74" fontSize="6" fill="#7c3aed" fontWeight="800" letterSpacing="0.5">OBJETIVOS</text>
      <text x="24" y="84" fontSize="5.5" fill="#374151">• Compreender os estados físicos da água</text>
      <text x="24" y="92" fontSize="5.5" fill="#374151">  e suas transformações no ciclo.</text>
      <text x="24" y="100" fontSize="5.5" fill="#374151">• Relacionar evaporação ao clima local.</text>
      <text x="24" y="108" fontSize="5.5" fill="#374151">• Interpretar dados de pluviometria.</text>

      {/* Card: Metodologia */}
      <rect x="14" y="121" width="192" height="80" fill="#fff1f2" rx="6" />
      <rect x="14" y="121" width="4" height="80" fill="#db2777" rx="2" />
      <text x="24" y="132" fontSize="6" fill="#be185d" fontWeight="800" letterSpacing="0.5">METODOLOGIA ATIVA</text>

      {/* Linha do tempo visual */}
      <circle cx="28" cy="145" r="5" fill="#7c3aed" />
      <text x="28" y="147.5" textAnchor="middle" fontSize="5" fill="#fff" fontWeight="bold">1</text>
      <text x="38" y="145" fontSize="5.5" fill="#374151" fontWeight="700">Abertura (10 min)</text>
      <text x="38" y="153" fontSize="5" fill="#6b7280">Pergunta disparadora sobre chuva e seca.</text>

      <line x1="28" y1="151" x2="28" y2="160" stroke="#e9d5ff" strokeWidth="1.5" strokeDasharray="2,1" />

      <circle cx="28" cy="165" r="5" fill="#db2777" />
      <text x="28" y="167.5" textAnchor="middle" fontSize="5" fill="#fff" fontWeight="bold">2</text>
      <text x="38" y="165" fontSize="5.5" fill="#374151" fontWeight="700">Desenvolvimento (30 min)</text>
      <text x="38" y="173" fontSize="5" fill="#6b7280">Experimento prático em grupos.</text>

      <line x1="28" y1="171" x2="28" y2="180" stroke="#fce7f3" strokeWidth="1.5" strokeDasharray="2,1" />

      <circle cx="28" cy="185" r="5" fill="#0ea5e9" />
      <text x="28" y="187.5" textAnchor="middle" fontSize="5" fill="#fff" fontWeight="bold">3</text>
      <text x="38" y="185" fontSize="5.5" fill="#374151" fontWeight="700">Fechamento (10 min)</text>
      <text x="38" y="193" fontSize="5" fill="#6b7280">Síntese e registro visual no caderno.</text>

      {/* Card: Avaliação */}
      <rect x="14" y="208" width="192" height="38" fill="#f0fdf4" rx="6" />
      <rect x="14" y="208" width="4" height="38" fill="#10b981" rx="2" />
      <text x="24" y="219" fontSize="6" fill="#065f46" fontWeight="800" letterSpacing="0.5">AVALIAÇÃO</text>
      <text x="24" y="229" fontSize="5.5" fill="#374151">• Participação na discussão inicial.</text>
      <text x="24" y="237" fontSize="5.5" fill="#374151">• Qualidade do registro no caderno.</text>

      {/* Card: Recursos */}
      <rect x="14" y="252" width="192" height="28" fill="#eff6ff" rx="6" />
      <rect x="14" y="252" width="4" height="28" fill="#3b82f6" rx="2" />
      <text x="24" y="263" fontSize="6" fill="#1e40af" fontWeight="800" letterSpacing="0.5">RECURSOS</text>
      <text x="24" y="273" fontSize="5.5" fill="#374151">Béquer, fogareiro, água, caderno, projetor.</text>

      {/* Rodapé */}
      <rect x="0" y="290" width="220" height="20" fill="#f9fafb" />
      <line x1="0" y1="290" x2="220" y2="290" stroke="#e5e7eb" strokeWidth="0.5" />
      <text x="14" y="302" fontSize="5" fill="#9ca3af">EducaDocs • Gerado com IA Pedagógica</text>
      <text x="206" y="302" textAnchor="end" fontSize="5" fill="#7c3aed" fontWeight="600">Pág 1</text>
    </svg>
  );
}

function PreviewMinimalista() {
  return (
    <svg
      viewBox="0 0 220 310"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full h-full"
      style={{ fontFamily: "'Inter', 'Helvetica Neue', sans-serif" }}
    >
      {/* Fundo branco puro */}
      <rect width="220" height="310" fill="#ffffff" />

      {/* Linha de acento no topo — única cor */}
      <rect x="18" y="16" width="40" height="3" fill="#111827" rx="1.5" />

      {/* Cabeçalho ultra limpo */}
      <text x="18" y="34" fontSize="11" fill="#111827" fontWeight="800" letterSpacing="-0.3">Plano de Aula</text>
      <text x="18" y="44" fontSize="6" fill="#9ca3af" letterSpacing="0.2">Ciências Naturais — 6.º Ano B — 50 min</text>

      {/* Linha divisória fina */}
      <line x1="18" y1="52" x2="202" y2="52" stroke="#e5e7eb" strokeWidth="0.75" />

      {/* Metadados em linha */}
      <text x="18" y="63" fontSize="5.5" fill="#6b7280" fontWeight="600">HABILIDADE BNCC</text>
      <text x="100" y="63" fontSize="5.5" fill="#6b7280" fontWeight="600">DURAÇÃO</text>
      <text x="160" y="63" fontSize="5.5" fill="#6b7280" fontWeight="600">TURMA</text>
      <text x="18" y="72" fontSize="6" fill="#111827" fontWeight="700">EF06CI04</text>
      <text x="100" y="72" fontSize="6" fill="#111827" fontWeight="700">50 min</text>
      <text x="160" y="72" fontSize="6" fill="#111827" fontWeight="700">6.º B</text>

      {/* Linha divisória */}
      <line x1="18" y1="80" x2="202" y2="80" stroke="#e5e7eb" strokeWidth="0.75" />

      {/* Seção: Objetivos */}
      <text x="18" y="93" fontSize="5.5" fill="#9ca3af" fontWeight="700" letterSpacing="1">OBJETIVOS</text>
      <text x="18" y="104" fontSize="6" fill="#111827">Compreender os estados físicos da água e suas</text>
      <text x="18" y="113" fontSize="6" fill="#111827">transformações no ciclo hidrológico.</text>
      <text x="18" y="122" fontSize="6" fill="#374151">Relacionar evaporação e condensação ao clima</text>
      <text x="18" y="131" fontSize="6" fill="#374151">regional e interpretar dados de pluviometria.</text>

      {/* Linha divisória */}
      <line x1="18" y1="139" x2="202" y2="139" stroke="#e5e7eb" strokeWidth="0.75" />

      {/* Seção: Metodologia */}
      <text x="18" y="152" fontSize="5.5" fill="#9ca3af" fontWeight="700" letterSpacing="1">METODOLOGIA</text>

      <text x="18" y="163" fontSize="5.5" fill="#6b7280" fontWeight="700">Introdução — 10 min</text>
      <text x="18" y="172" fontSize="6" fill="#374151">Roda de conversa sobre chuva e seca no cotidiano.</text>

      <text x="18" y="183" fontSize="5.5" fill="#6b7280" fontWeight="700">Desenvolvimento — 30 min</text>
      <text x="18" y="192" fontSize="6" fill="#374151">Experimento prático em grupos com água e calor.</text>

      <text x="18" y="203" fontSize="5.5" fill="#6b7280" fontWeight="700">Fechamento — 10 min</text>
      <text x="18" y="212" fontSize="6" fill="#374151">Síntese coletiva e registro no caderno.</text>

      {/* Linha divisória */}
      <line x1="18" y1="220" x2="202" y2="220" stroke="#e5e7eb" strokeWidth="0.75" />

      {/* Seção: Avaliação */}
      <text x="18" y="233" fontSize="5.5" fill="#9ca3af" fontWeight="700" letterSpacing="1">AVALIAÇÃO</text>
      <text x="18" y="244" fontSize="6" fill="#374151">Observação da participação e qualidade do registro.</text>
      <text x="18" y="253" fontSize="6" fill="#374151">Entrega do mapa conceitual ao final da aula.</text>

      {/* Linha divisória */}
      <line x1="18" y1="261" x2="202" y2="261" stroke="#e5e7eb" strokeWidth="0.75" />

      {/* Seção: Recursos */}
      <text x="18" y="274" fontSize="5.5" fill="#9ca3af" fontWeight="700" letterSpacing="1">RECURSOS</text>
      <text x="18" y="285" fontSize="6" fill="#374151">Béquer, fogareiro, água destilada, projetor, caderno.</text>

      {/* Rodapé minimalista */}
      <line x1="18" y1="296" x2="202" y2="296" stroke="#e5e7eb" strokeWidth="0.75" />
      <text x="18" y="305" fontSize="4.5" fill="#d1d5db">EducaDocs</text>
      <text x="202" y="305" textAnchor="end" fontSize="4.5" fill="#d1d5db">1 / 1</text>
    </svg>
  );
}

function PreviewTabela() {
  return (
    <svg
      viewBox="0 0 220 310"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full h-full"
      style={{ fontFamily: "'Inter', 'Segoe UI', sans-serif" }}
    >
      {/* Fundo branco */}
      <rect width="220" height="310" fill="#ffffff" />

      {/* Cabeçalho superior simples */}
      <text x="110" y="24" textAnchor="middle" fontSize="9" fill="#111827" fontWeight="bold" letterSpacing="0.5">PLANO DE AULA</text>
      <text x="110" y="33" textAnchor="middle" fontSize="6.5" fill="#4b5563">Ensino Fundamental — 6.º Ano</text>
      <line x1="18" y1="38" x2="202" y2="38" stroke="#111827" strokeWidth="1" />

      {/* Tabela de Cabeçalho */}
      <rect x="18" y="44" width="184" height="24" fill="none" stroke="#d1d5db" strokeWidth="0.75" />
      <line x1="110" y1="44" x2="110" y2="68" stroke="#d1d5db" strokeWidth="0.75" />
      <line x1="18" y1="56" x2="202" y2="56" stroke="#d1d5db" strokeWidth="0.75" />
      
      <text x="22" y="52" fontSize="5" fill="#4b5563" fontWeight="bold">Professor: Alves</text>
      <text x="114" y="52" fontSize="5" fill="#4b5563" fontWeight="bold">Data: ___/___/___</text>
      <text x="22" y="64" fontSize="5" fill="#4b5563" fontWeight="bold">Disciplina: Ciências</text>
      <text x="114" y="64" fontSize="5" fill="#4b5563" fontWeight="bold">Duração: 50 min</text>

      {/* Quadro Principal do Plano (Tabela) */}
      <rect x="18" y="76" width="184" height="206" fill="none" stroke="#111827" strokeWidth="1" />
      
      {/* Linha vertical divisória */}
      <line x1="72" y1="76" x2="72" y2="282" stroke="#111827" strokeWidth="1" />

      {/* Linhas horizontais */}
      <line x1="18" y1="106" x2="202" y2="106" stroke="#111827" strokeWidth="0.75" />
      <line x1="18" y1="142" x2="202" y2="142" stroke="#111827" strokeWidth="0.75" />
      <line x1="18" y1="188" x2="202" y2="188" stroke="#111827" strokeWidth="0.75" />
      <line x1="18" y1="240" x2="202" y2="240" stroke="#111827" strokeWidth="0.75" />

      {/* Campo 1: Tema */}
      <rect x="18.5" y="76.5" width="53" height="29" fill="#f9fafb" />
      <text x="24" y="93" fontSize="5.5" fill="#111827" fontWeight="bold">TEMA</text>
      <text x="76" y="87" fontSize="5" fill="#374151" fontWeight="bold">Ciclo Hidrológico</text>
      <text x="76" y="95" fontSize="4.5" fill="#6b7280">Estados físicos e transformações da água.</text>

      {/* Campo 2: Habilidades */}
      <rect x="18.5" y="106.5" width="53" height="35" fill="#f9fafb" />
      <text x="24" y="127" fontSize="5.5" fill="#111827" fontWeight="bold">HABILIDADES</text>
      <rect x="76" y="112" width="28" height="7" fill="#f3f4f6" rx="1.5" />
      <text x="90" y="117.5" textAnchor="middle" fontSize="4.5" fill="#111827" fontWeight="bold">EF06CI04</text>
      <text x="76" y="125" fontSize="4.5" fill="#374151">Associar variações de temperatura às</text>
      <text x="76" y="132" fontSize="4.5" fill="#374151">mudanças do estado físico da água.</text>

      {/* Campo 3: Objetivos */}
      <rect x="18.5" y="142.5" width="53" height="45" fill="#f9fafb" />
      <text x="24" y="168" fontSize="5.5" fill="#111827" fontWeight="bold">OBJETIVOS</text>
      <text x="76" y="153" fontSize="4.5" fill="#374151">• Entender evaporação e condensação.</text>
      <text x="76" y="161" fontSize="4.5" fill="#374151">• Analisar o ciclo da água na natureza.</text>
      <text x="76" y="169" fontSize="4.5" fill="#374151">• Compreender a formação de chuvas.</text>

      {/* Campo 4: Metodologia */}
      <rect x="18.5" y="188.5" width="53" height="51" fill="#f9fafb" />
      <text x="24" y="217" fontSize="5.5" fill="#111827" fontWeight="bold">METODOLOGIA</text>
      <text x="76" y="198" fontSize="4.5" fill="#111827" fontWeight="bold">Seq. Didática:</text>
      <text x="76" y="206" fontSize="4.5" fill="#374151">1. Introdução (Roda de conversa) — 10m</text>
      <text x="76" y="206" fontSize="4.5" fill="#374151">2. Prática (Béquer e Aquecedor) — 30m</text>
      <text x="76" y="214" fontSize="4.5" fill="#374151">3. Fechamento (Relatório visual) — 10m</text>

      {/* Campo 5: Avaliação */}
      <rect x="18.5" y="240.5" width="53" height="41" fill="#f9fafb" />
      <text x="24" y="263" fontSize="5.5" fill="#111827" fontWeight="bold">AVALIAÇÃO</text>
      <text x="76" y="252" fontSize="4.5" fill="#374151">• Participação no experimento em grupo.</text>
      <text x="76" y="260" fontSize="4.5" fill="#374151">• Preenchimento do relatório individual.</text>

      {/* Rodapé da página */}
      <line x1="18" y1="294" x2="202" y2="294" stroke="#d1d5db" strokeWidth="0.5" />
      <text x="18" y="303" fontSize="4.5" fill="#9ca3af">EducaDocs • Modelo Tabela</text>
      <text x="202" y="303" textAnchor="end" fontSize="4.5" fill="#9ca3af">Pág. 1</text>
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────
// DADOS DOS ESTILOS
// ─────────────────────────────────────────────────────────────

const styles: {
  id: TemplateStyle;
  label: string;
  tag?: string;
  description: string;
  preview: React.ReactNode;
  accentColor: string;
  badgeColor: string;
  selectedBorder: string;
  selectedBg: string;
}[] = [
  {
    id: "INSTITUTIONAL",
    label: "Institucional",
    tag: "Recomendado",
    description: "Cabeçalho oficial com brasão, numeração de seções em algarismos romanos, linha dupla divisória e espaço para assinatura. Adequado para entrega à coordenação.",
    preview: <PreviewInstitucional />,
    accentColor: "#1a3a6b",
    badgeColor: "bg-blue-100 text-blue-800",
    selectedBorder: "border-blue-600",
    selectedBg: "bg-blue-50/60",
  },
  {
    id: "MODERN",
    label: "Moderno",
    description: "Header com gradiente, barra lateral colorida, cards por seção e linha do tempo visual para a metodologia. Ideal para apresentações e turmas mais dinâmicas.",
    preview: <PreviewModerno />,
    accentColor: "#7c3aed",
    badgeColor: "",
    selectedBorder: "border-purple-500",
    selectedBg: "bg-purple-50/60",
  },
  {
    id: "MINIMALIST",
    label: "Minimalista",
    description: "Tipografia limpa, hierarquia visual por peso de fonte, sem elementos decorativos. Foco total no conteúdo. Excelente para impressão em preto e branco.",
    preview: <PreviewMinimalista />,
    accentColor: "#111827",
    badgeColor: "",
    selectedBorder: "border-gray-800",
    selectedBg: "bg-gray-50/60",
  },
  {
    id: "TABLE",
    label: "Tabela / Grade",
    description: "Estrutura o plano de aula em um quadro organizado (tabela de duas colunas), contendo campos bem delimitados como objetivos, conteúdos e metodologia. Muito comum em exigências de secretarias de educação.",
    preview: <PreviewTabela />,
    accentColor: "#0f766e",
    badgeColor: "bg-teal-100 text-teal-800",
    selectedBorder: "border-teal-600",
    selectedBg: "bg-teal-50/60",
  },
];

// ─────────────────────────────────────────────────────────────
// COMPONENTE PRINCIPAL
// ─────────────────────────────────────────────────────────────

export function StepStyle({
  value,
  onChange,
}: {
  value: TemplateStyle;
  onChange: (value: TemplateStyle) => void;
}) {
  const [hoveredStyle, setHoveredStyle] = React.useState<TemplateStyle | null>(null);
  const activeStyle = styles.find((s) => s.id === (hoveredStyle ?? value))!;

  return (
    <div className="flex flex-col h-full">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-text-900 mb-2">Estilo Visual</h2>
        <p className="text-text-500">
          Escolha como o documento final (DOCX) será formatado. Passe o cursor sobre cada opção para ver a prévia real.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-6 items-start">

        {/* ── Coluna esquerda: opções ── */}
        <div className="md:col-span-2 flex flex-col gap-3">
          {styles.map((style, i) => {
            const isSelected = value === style.id;
            return (
              <motion.button
                key={style.id}
                type="button"
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.06 }}
                onMouseEnter={() => setHoveredStyle(style.id)}
                onMouseLeave={() => setHoveredStyle(null)}
                onClick={() => onChange(style.id)}
                className={`w-full text-left rounded-xl border-2 px-4 py-3.5 transition-all duration-200 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 ${
                  isSelected
                    ? `${style.selectedBorder} ${style.selectedBg} shadow-sm`
                    : "border-surface-200 bg-white hover:border-surface-300 hover:shadow-sm"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span
                    className={`font-bold text-base ${
                      isSelected ? "text-text-900" : "text-text-800"
                    }`}
                  >
                    {style.label}
                  </span>
                  <div className="flex items-center gap-2">
                    {style.tag && (
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${style.badgeColor}`}>
                        {style.tag}
                      </span>
                    )}
                    {isSelected && (
                      <span
                        className="w-4 h-4 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: style.accentColor }}
                      >
                        <svg viewBox="0 0 12 12" className="w-2.5 h-2.5">
                          <polyline points="2,6 5,9 10,3" stroke="white" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </span>
                    )}
                  </div>
                </div>
                <p className="text-sm text-text-500 leading-relaxed">{style.description}</p>
              </motion.button>
            );
          })}
        </div>

        {/* ── Coluna direita: preview ── */}
        <div className="md:col-span-3 flex flex-col">
          <div className="flex items-center gap-2 text-sm font-semibold text-text-500 mb-3">
            <svg viewBox="0 0 20 20" className="w-4 h-4 text-primary-500 fill-current">
              <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
              <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
            </svg>
            Prévia do documento — {activeStyle.label}
          </div>

          {/* Moldura de papel A4 */}
          <div className="relative bg-[#e8e8e8] rounded-2xl p-4 shadow-inner flex items-center justify-center min-h-[420px]">
            {/* Sombra de papel empilhado */}
            <div className="absolute inset-4 translate-y-1.5 translate-x-1.5 bg-white/60 rounded-lg shadow-sm" />
            <div className="absolute inset-4 translate-y-0.5 translate-x-0.5 bg-white/80 rounded-lg shadow-sm" />

            {/* Folha principal */}
            <AnimatePresence mode="wait">
              <motion.div
                key={activeStyle.id}
                initial={{ opacity: 0, y: 8, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.97 }}
                transition={{ duration: 0.22, ease: "easeOut" }}
                className="relative z-10 w-full bg-white rounded-lg shadow-xl overflow-hidden"
                style={{ aspectRatio: "1/1.414" }}
              >
                {activeStyle.preview}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Legenda */}
          <p className="text-xs text-text-400 text-center mt-2.5">
            Prévia ilustrativa. O conteúdo real será gerado pela IA com base no tema informado.
          </p>
        </div>
      </div>
    </div>
  );
}
