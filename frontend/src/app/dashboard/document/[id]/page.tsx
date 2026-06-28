"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { 
  AlertCircle, 
  ArrowLeft, 
  Download, 
  Printer, 
  Sparkles, 
  Layers,
  Bug, 
  Banana, 
  Circle, 
  Cake, 
  Car, 
  House, 
  Dices, 
  Utensils, 
  Flower2, 
  Cat, 
  Moon, 
  Briefcase, 
  Bird, 
  Sun, 
  Grape,
  Image
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { InclusionModal } from "@/components/dashboard/inclusion-modal";
import { LinkToClassroomModal } from "@/components/classroom/LinkToClassroomModal";
import { Skeleton } from "@/components/ui/skeleton";
import {
  downloadDocumentDocx,
  fetchDocument,
  API_BASE_URL,
} from "@/lib/api";
import {
  DOCUMENT_TYPE_LABELS,
  type GeneratedDocument,
} from "@/lib/types";
import {
  buildPrintableDocument,
  parseDocumentContent,
  type PrintableBlock,
} from "@/lib/document-rendering";
import { formatDate } from "@/lib/utils";
import { toActivityImageUrl } from "@/lib/activity-images";

const FIGURE_ICONS: Record<string, React.ComponentType<{ className?: string; strokeWidth?: number }>> = {
  abelha: Bug,
  banana: Banana,
  bola: Circle,
  bolo: Cake,
  carro: Car,
  casa: House,
  dado: Dices,
  faca: Utensils,
  flor: Flower2,
  gato: Cat,
  lua: Moon,
  mala: Briefcase,
  pato: Bird,
  sol: Sun,
  uva: Grape,
};

function FigureTile({ figure, word, imagemUrl }: { figure: string; word: string; imagemUrl?: string }) {
  const resolvedUrl = toActivityImageUrl(imagemUrl ?? null, API_BASE_URL);

  if (resolvedUrl) {
    return (
      <div className="w-24 h-24 border-2 border-text-900 rounded-md bg-white flex flex-col items-center justify-center gap-1 shrink-0 print:border-black overflow-hidden">
        <img
          src={resolvedUrl}
          alt={figure || word || "figura"}
          className="w-full h-full object-contain p-1"
          onError={(e) => {
            const target = e.currentTarget;
            target.style.display = "none";
            const fallback = target.nextElementSibling as HTMLElement | null;
            if (fallback) fallback.style.display = "flex";
          }}
        />
        <div className="hidden w-full h-full flex-col items-center justify-center gap-1">
          <FigureIcon figure={figure} />
          <span className="text-[10px] font-bold uppercase leading-none text-text-700 print:text-black">
            {figure || word || "figura"}
          </span>
        </div>
      </div>
    );
  }

  const key = figure.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const Icon = FIGURE_ICONS[key] || Image;

  return (
    <div className="w-24 h-24 border-2 border-text-900 rounded-md bg-white flex flex-col items-center justify-center gap-1 shrink-0 print:border-black">
      {key === "sapo" ? (
        <svg className="w-10 h-10 text-text-900 print:text-black" viewBox="0 0 108 108" fill="none" stroke="currentColor" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <ellipse cx="54" cy="62" rx="30" ry="20" />
          <circle cx="40" cy="40" r="9" />
          <circle cx="68" cy="40" r="9" />
          <path d="M40 64c8 7 20 7 28 0" />
        </svg>
      ) : Icon ? (
        <Icon className="w-10 h-10 text-text-900 print:text-black" strokeWidth={1.8} />
      ) : (
        <div className="w-10 h-10 border border-text-500 rounded-sm" />
      )}
      <span className="text-[10px] font-bold uppercase leading-none text-text-700 print:text-black">
        {figure || word || "figura"}
      </span>
    </div>
  );
}

function FigureIcon({ figure }: { figure: string }) {
  const key = figure.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const Icon = FIGURE_ICONS[key] || Image;
  return Icon ? <Icon className="w-10 h-10 text-text-900 print:text-black" strokeWidth={1.8} /> : <div className="w-10 h-10 border border-text-500 rounded-sm" />;
}

// ----------------------------------------------------
// NEW SPECIALIZED LAYOUTS FOR LITERACY ACTIVITIES
// ----------------------------------------------------

function WordSearchGrid({ wordSearch }: { wordSearch: { grid: string[][]; words: string[] } }) {
  return (
    <div className="flex flex-col items-center gap-6 mt-4 w-full">
      {/* Grid of Letters */}
      <div className="border-4 border-text-900 rounded-xl p-2 bg-white print:border-black max-w-full overflow-auto">
        <table className="border-collapse">
          <tbody>
            {wordSearch.grid.map((row, rIdx) => (
              <tr key={rIdx}>
                {row.map((char, cIdx) => (
                  <td
                    key={cIdx}
                    className="w-9 h-9 sm:w-11 sm:h-11 border-2 border-text-200 text-center text-xl sm:text-2xl font-black uppercase text-text-900 print:border-black select-none font-mono"
                  >
                    {char}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Words to Find */}
      <div className="w-full">
        <p className="text-sm font-bold text-text-500 uppercase tracking-wider mb-3 print:text-black">
          Encontre estas palavras:
        </p>
        <div className="flex flex-wrap gap-3">
          {wordSearch.words.map((word) => (
            <span
              key={word}
              className="px-4 py-2 bg-surface-100 border border-surface-200 text-lg font-black tracking-widest uppercase rounded-lg text-text-800 print:border-black print:text-black"
            >
              {word}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function SimpleCrossword({ clues }: { clues: any[] }) {
  // Determine dimensions of grid
  let maxRow = 0;
  let maxCol = 0;
  clues.forEach((clue) => {
    const len = clue.word.length;
    if (clue.direction === "HORIZONTAL") {
      maxRow = Math.max(maxRow, clue.row);
      maxCol = Math.max(maxCol, clue.col + len - 1);
    } else {
      maxRow = Math.max(maxRow, clue.row + len - 1);
      maxCol = Math.max(maxCol, clue.col);
    }
  });

  const numRows = Math.max(5, maxRow + 2);
  const numCols = Math.max(5, maxCol + 2);

  // Initialize empty grid matrix
  interface Cell {
    active: boolean;
    clueNumber?: number;
    letter?: string;
  }
  const gridMatrix: Cell[][] = Array.from({ length: numRows }, () =>
    Array.from({ length: numCols }, () => ({ active: false }))
  );

  clues.forEach((clue) => {
    const word = String(clue.word).toUpperCase();
    const len = word.length;
    for (let i = 0; i < len; i++) {
      const r = clue.direction === "HORIZONTAL" ? clue.row : clue.row + i;
      const c = clue.direction === "HORIZONTAL" ? clue.col + i : clue.col;

      if (r < numRows && c < numCols) {
        gridMatrix[r][c].active = true;
        gridMatrix[r][c].letter = word[i];
        if (i === 0) {
          gridMatrix[r][c].clueNumber = clue.number;
        }
      }
    }
  });

  return (
    <div className="flex flex-col lg:flex-row gap-8 mt-4 w-full">
      {/* Grid */}
      <div className="flex-1 flex justify-center max-w-full overflow-auto p-1">
        <table className="border-collapse">
          <tbody>
            {gridMatrix.map((row, rIdx) => (
              <tr key={rIdx}>
                {row.map((cell, cIdx) => (
                  <td
                    key={cIdx}
                    className={`w-9 h-9 sm:w-11 sm:h-11 text-center relative select-none font-mono ${
                      cell.active
                        ? "border-2 border-text-900 bg-white print:border-black"
                        : "border-none bg-transparent"
                    }`}
                  >
                    {cell.active && cell.clueNumber && (
                      <span className="absolute top-0.5 left-0.5 text-[8px] sm:text-[9px] font-bold text-text-500 leading-none">
                        {cell.clueNumber}
                      </span>
                    )}
                    {/* Empty cell for students to write in */}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Clues */}
      <div className="w-full lg:w-72 shrink-0 space-y-4">
        <h4 className="text-sm font-bold text-text-600 uppercase tracking-wider print:text-black">
          Dicas da Cruzadinha:
        </h4>
        <div className="grid grid-cols-1 gap-3">
          {clues.map((clue) => (
            <div
              key={`${clue.number}-${clue.word}`}
              className="flex items-center gap-3 border border-surface-150 rounded-xl p-3 bg-surface-50/10 print:border-black"
            >
              <span className="w-7 h-7 rounded-full bg-text-900 text-white flex items-center justify-center text-xs font-bold print:bg-transparent print:text-black print:border-2 print:border-black shrink-0">
                {clue.number}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-text-400 font-bold uppercase tracking-wider">
                  {clue.direction === "HORIZONTAL" ? "Horizontal" : "Vertical"}
                </p>
                <p className="text-sm text-text-800 font-semibold print:text-black truncate">
                  Figura: {clue.figure}
                </p>
              </div>
              <div className="w-12 h-12 rounded-lg border border-surface-200 overflow-hidden bg-white shrink-0 print:border-black">
                <FigureTile figure={clue.figure} word="" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SceneActivity({
  scene,
  questions,
  figures,
}: {
  scene?: string;
  questions: any[];
  figures?: string[];
}) {
  // Let's resolve the URL for the scene theme image
  // The backend produces a generated image for the theme if we request it, or we resolve from early literacy helper
  const scenePath = scene ? `/images/generated/scene_${scene.toLowerCase().replace(/\s+/g, "_")}` : null;
  const resolvedUrl = toActivityImageUrl(scenePath, API_BASE_URL);

  return (
    <div className="flex flex-col items-center gap-6 mt-4 w-full">
      {/* Scenic/Theme Image to color */}
      <div className="w-full max-w-2xl border-4 border-text-900 rounded-2xl overflow-hidden bg-white aspect-[2.1] relative flex items-center justify-center print:border-black">
        {resolvedUrl ? (
          <img
            src={resolvedUrl}
            alt={scene || "Cena para colorir"}
            className="w-full h-full object-contain"
            onError={(e) => {
              // Fallback placeholder
              e.currentTarget.style.display = "none";
              const fb = document.getElementById("scene-fallback");
              if (fb) fb.classList.remove("hidden");
            }}
          />
        ) : null}

        <div
          id="scene-fallback"
          className={`${
            resolvedUrl ? "hidden" : ""
          } absolute inset-0 flex flex-col items-center justify-center bg-surface-50 text-center p-6`}
        >
          <svg className="w-16 h-16 text-text-300 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span className="text-sm font-black text-text-700 uppercase tracking-widest">
            {scene || "Espaço Temático para Colorir"}
          </span>
          {figures && (
            <p className="text-[10px] text-text-400 mt-1 max-w-sm italic">
              Figuras presentes na cena: {figures.join(", ")}
            </p>
          )}
        </div>
      </div>

      {/* Questions */}
      <div className="w-full space-y-4">
        {questions.map((question, index) => (
          <div key={index} className="flex flex-col gap-2">
            <p className="text-lg font-bold text-text-800 print:text-black">
              {index + 1}. {question.text}
            </p>
            <div className="border-b border-dashed border-text-300 h-8 w-full print:border-black" />
          </div>
        ))}
      </div>
    </div>
  );
}

function ColumnMatchActivity({ activity }: { activity: any }) {
  const columnMatch = activity.columnMatch;
  if (!columnMatch) return null;

  return (
    <div className="flex justify-around items-stretch gap-10 mt-6 w-full max-w-2xl mx-auto py-4">
      {/* Left Column (Figures) */}
      <div className="flex flex-col gap-6">
        {columnMatch.leftColumn.map((item: any, idx: number) => (
          <div key={idx} className="flex items-center gap-4">
            <div className="w-24 h-24 border-2 border-text-900 rounded-xl overflow-hidden bg-white shrink-0 print:border-black">
              <FigureTile figure={item.figure} word="" imagemUrl={item.imagemUrl} />
            </div>
            <span className="w-6 h-6 rounded-full border-2 border-text-900 bg-white print:border-black shrink-0 flex items-center justify-center">
              <span className="w-2 h-2 rounded-full bg-text-900" />
            </span>
          </div>
        ))}
      </div>

      {/* Right Column (Words) */}
      <div className="flex flex-col gap-6 justify-around">
        {columnMatch.rightColumn.map((word: string, idx: number) => (
          <div key={idx} className="flex items-center gap-4">
            <span className="w-6 h-6 rounded-full border-2 border-text-900 bg-white print:border-black shrink-0 flex items-center justify-center">
              <span className="w-2 h-2 rounded-full bg-text-900" />
            </span>
            <span className="min-w-28 text-2xl font-black tracking-widest text-text-900 uppercase print:text-black">
              {word}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function isInitialLiteracyDocument(document: GeneratedDocument) {
  if (document.type !== "EXAM") {
    return false;
  }

  const structured = parseDocumentContent(document.content);
  if (!structured) {
    return false;
  }

  return String(structured.tipoAvaliacao || "").toUpperCase() === "ALFABETIZACAO_INICIAL"
    || Array.isArray(structured.atividadesVisuais);
}

function printedDocumentKind(document: GeneratedDocument) {
  if (isInitialLiteracyDocument(document)) {
    return "ATIVIDADE DE ALFABETIZAÇÃO";
  }

  return document.type === "EXAM" ? "AVALIAÇÃO ESCRITA" : "ATIVIDADE PEDAGÓGICA";
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  if (!children) {
    return null;
  }

  return (
    <section className="print-section mb-8 break-inside-avoid">
      <h2 className="print-section-title text-lg font-bold text-primary-800 border-b border-surface-200 pb-2 mb-4">
        {title}
      </h2>
      {children}
    </section>
  );
}

function DocumentContent({ document }: { document: GeneratedDocument }) {
  const printable = buildPrintableDocument(document);

  if (!printable) {
    return (
      <pre className="whitespace-pre-wrap text-sm leading-relaxed text-text-700 font-sans">
        {document.content}
      </pre>
    );
  }

  return (
    <article className="print-document-body text-text-800 print:text-black">
      <h1 className="print-document-title text-3xl font-bold text-center text-text-900 mb-6 pb-4 border-b border-surface-200">
        {printable.title}
      </h1>

      {printable.groups.map((group) => (
        <div key={group.title} className="print-group mb-10 break-inside-avoid">
          {group.title !== "Plano" && group.title !== "Documento" && (
            <h2 className="print-group-title text-2xl font-bold text-text-900 mb-5 border-b border-surface-200 pb-2 print:text-black">
              {group.title}
            </h2>
          )}
          {group.sections.map((section) => (
            <Section key={`${group.title}-${section.title}`} title={section.title}>
              <PrintableBlockView block={section.block} />
            </Section>
          ))}
        </div>
      ))}
    </article>
  );
}

function PrintableBlockView({ block }: { block: PrintableBlock }) {
  if (block.type === "text") {
    return (
      <p className="text-text-700 leading-relaxed whitespace-pre-line print:text-black">
        {block.value}
      </p>
    );
  }

  if (block.type === "list") {
    return (
      <ul className="print-list space-y-2 list-disc pl-5 text-text-700 print:text-black">
        {block.values.map((value, index) => (
          <li key={index} className="print-list-item leading-relaxed whitespace-pre-line">
            {value}
          </li>
        ))}
      </ul>
    );
  }

  if (block.type === "stages") {
    return (
      <div className="space-y-4 text-text-700 print:text-black">
        {block.values.map((stage) => (
          <div key={stage.title} className="break-inside-avoid">
            <h3 className="font-semibold text-text-900 print:text-black">
              {stage.title}
              {stage.duration ? ` (${stage.duration})` : ""}
            </h3>
            {stage.description && (
              <p className="mt-1 leading-relaxed whitespace-pre-line">
                {stage.description}
              </p>
            )}
          </div>
        ))}
      </div>
    );
  }

  if (block.type === "questions") {
    return (
      <div className="print-questions space-y-8 text-text-800 print:text-black">
        {block.values.map((q) => (
          <div key={q.number} className="print-question break-inside-avoid border border-surface-100 rounded-lg p-5 bg-surface-50/20 print:border-none print:p-0">
            <div className="flex items-start gap-2 mb-3">
              <span className="font-bold text-text-900 bg-surface-200 w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-sm print:bg-transparent print:w-auto print:h-auto print:rounded-none print:font-bold">
                {q.number}.
              </span>
              <p className="font-semibold text-text-900 leading-relaxed whitespace-pre-line pt-0.5 print:text-black">
                {q.statement}
              </p>
            </div>

            {q.alternatives && q.alternatives.length > 0 ? (
              <div className="ml-9 space-y-2 mt-3">
                {q.alternatives.map((alt, index) => (
                  <div key={index} className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full border border-surface-300 flex items-center justify-center shrink-0 mt-0.5 text-xs text-text-400 font-medium print:border-black print:text-black">
                      {alt.match(/^[a-e]\)/i) ? "" : String.fromCharCode(97 + index)}
                    </span>
                    <span className="text-text-700 print:text-black leading-relaxed">
                      {alt.replace(/^[a-e]\)\s*/i, "")}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="ml-9 mt-4 space-y-3 print:space-y-4">
                <div className="border-b border-surface-300 border-dashed h-6 w-full" />
                <div className="border-b border-surface-300 border-dashed h-6 w-full" />
                <div className="border-b border-surface-300 border-dashed h-6 w-full" />
                <div className="border-b border-surface-300 border-dashed h-6 w-full" />
              </div>
            )}

            {(q.bnccSkill || q.difficulty) && (
              <div className="ml-9 mt-4 flex flex-wrap gap-2 text-[10px] text-text-400 print:text-black/60 print:hidden">
                {q.bnccSkill && (
                  <span className="px-2 py-0.5 bg-surface-100 rounded border border-surface-200">
                    BNCC: {q.bnccSkill}
                  </span>
                )}
                {q.difficulty && (
                  <span className="px-2 py-0.5 bg-surface-100 rounded border border-surface-200">
                    Dificuldade: {q.difficulty}
                  </span>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    );
  }

  if (block.type === "earlyLiteracyActivities") {
    return (
      <div className="space-y-10 text-text-900 print:text-black">
        {block.values.map((activity) => {
          // Dispatch to specialized components based on activity.type
          const type = String(activity.type).toUpperCase();

          return (
            <div key={activity.number} className="break-inside-avoid border border-surface-150 rounded-xl p-6 bg-white shadow-sm print:border-black print:border-2 print:p-8 print:shadow-none mb-6">
              {/* Activity Header */}
              <div className="flex items-center gap-3 mb-6 pb-3 border-b border-surface-100 print:border-black">
                <span className="w-9 h-9 rounded-full bg-text-900 text-white flex items-center justify-center text-base font-extrabold print:bg-transparent print:text-black print:border-2 print:border-black shrink-0">
                  {activity.number}
                </span>
                <h3 className="text-xl font-black uppercase tracking-tight text-text-900 print:text-black">
                  {activity.command}
                </h3>
              </div>

              {/* Layout Types */}
              {type === "CACA_PALAVRAS" && activity.wordSearch ? (
                <WordSearchGrid wordSearch={activity.wordSearch} />
              ) : type === "CRUZADINHA" && activity.crosswordClues ? (
                <SimpleCrossword clues={activity.crosswordClues} />
              ) : type === "PINTAR_CENA" && activity.sceneQuestions ? (
                <SceneActivity
                  scene={activity.scene}
                  questions={activity.sceneQuestions}
                  figures={activity.sceneFigures}
                />
              ) : type === "LIGAR_COLUNAS" || type === "LIGAR_FIGURA_PALAVRA" ? (
                <ColumnMatchActivity activity={activity} />
              ) : (
                /* Default grid-based layout for SEPARAR_SILABAS, LETRA_INICIAL, COMPLETAR_PALAVRA, etc. */
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {activity.items.map((item, index) => (
                    <div key={`${activity.number}-${item.word}-${index}`} className="flex flex-col items-center sm:items-start sm:flex-row gap-4 border border-surface-100 rounded-xl p-4 bg-surface-50/20 print:border-black print:bg-white print:p-4">
                      <div className="w-32 h-32 shrink-0 border border-surface-200 rounded-lg overflow-hidden bg-white print:border-black">
                        <FigureTile figure={item.figure} word={item.word} imagemUrl={item.imagemUrl} />
                      </div>
                      
                      <div className="flex-1 flex flex-col justify-center gap-3 w-full">
                        {item.word && (
                          <span className="text-2xl font-black tracking-widest text-text-900 uppercase text-center sm:text-left print:text-black">
                            {item.word}
                          </span>
                        )}
                        
                        {item.boxes > 0 && (
                          <div className="flex gap-2.5 justify-center sm:justify-start">
                            {Array.from({ length: item.boxes }).map((_, boxIndex) => (
                              <span key={boxIndex} className="w-14 h-12 border-2 border-text-900 rounded-lg bg-white print:border-black" />
                            ))}
                          </div>
                        )}
                        
                        {item.options.length > 0 && (
                          <div className="flex flex-wrap gap-4 justify-center sm:justify-start mt-1">
                            {item.options.map((option) => (
                              <span key={option} className="inline-flex items-center gap-2 text-xl font-extrabold print:text-black">
                                <span className="w-7 h-7 rounded-full border-2 border-text-900 bg-white print:border-black" />
                                {option}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  }

  if (block.type === "criteria") {
    return (
      <div className="space-y-6 text-text-800 print:text-black">
        {block.values.map((crit, cIdx) => (
          <div key={cIdx} className="border border-surface-200 rounded-xl overflow-hidden bg-white shadow-sm print:shadow-none print:border-black print:rounded-none">
            <div className="bg-surface-50 border-b border-surface-200 p-4 print:bg-transparent print:border-black">
              <h3 className="font-bold text-text-900 print:text-black">{crit.name}</h3>
              <p className="text-sm text-text-500 mt-1 print:text-black/80">{crit.description}</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-surface-200 print:divide-black">
              {crit.levels.map((lvl, lIdx) => (
                <div key={lIdx} className="p-4 flex flex-col justify-between">
                  <div>
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-primary-50 text-primary-700 border border-primary-100 mb-2 print:border-black print:text-black">
                      {lvl.level}
                    </span>
                    <p className="text-xs text-text-600 leading-relaxed print:text-black">{lvl.description}</p>
                  </div>
                  <span className="text-xs font-semibold text-text-400 mt-4 block text-right print:text-black">
                    {lvl.score} {lvl.score === 1 ? "ponto" : "pontos"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return null;
}

export default function DocumentViewPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [document, setDocument] = React.useState<GeneratedDocument | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isExporting, setIsExporting] = React.useState(false);
  const [isInclusionOpen, setIsInclusionOpen] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [hasHeader, setHasHeader] = React.useState(false);
  const [headerInfo, setHeaderInfo] = React.useState({
    schoolName: "",
    teacherName: "",
    classroom: "",
    date: new Date().toLocaleDateString("pt-BR"),
  });

  React.useEffect(() => {
    async function loadDocument() {
      setIsLoading(true);
      setError(null);

      try {
        const data = await fetchDocument(params.id);
        setDocument(data);
        setHasHeader(data.type === "EXAM");
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Nao foi possivel carregar o documento."
        );
      } finally {
        setIsLoading(false);
      }
    }

    if (params.id) {
      loadDocument();
    }
  }, [params.id]);

  async function handleExport() {
    if (!document) {
      return;
    }

    setIsExporting(true);
    setError(null);

    try {
      await downloadDocumentDocx(document.id, document.title);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Nao foi possivel exportar o DOCX."
      );
    } finally {
      setIsExporting(false);
    }
  }

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex justify-between items-center mb-8">
          <Skeleton className="h-10 w-24" />
          <div className="flex gap-2">
            <Skeleton className="h-10 w-28" />
            <Skeleton className="h-10 w-28" />
          </div>
        </div>
        <Skeleton className="h-[600px] w-full" />
      </div>
    );
  }

  if (!document) {
    return (
      <div className="max-w-4xl mx-auto rounded-lg border border-error-500 bg-error-50 p-4 text-error-600">
        Documento nao encontrado.
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto pb-24 print:max-w-none print:mx-0 print:pb-0">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sticky top-0 bg-surface-50 z-10 py-4 -my-4 px-2 -mx-2 print:hidden">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          leftIcon={<ArrowLeft className="w-4 h-4" />}
        >
          Voltar
        </Button>

        <div className="flex items-center gap-2">
          <LinkToClassroomModal
            documentId={document.id}
            type={document.type === "LESSON_PLAN" ? "PLAN" : document.type === "EXAM" ? "EXAM" : "CUSTOM_EVENT"}
            title={document.title}
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsInclusionOpen(true)}
            leftIcon={<Sparkles className="w-4 h-4 text-purple-600" />}
          >
            Adaptar para Inclusão (PDI)
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            isLoading={isExporting}
            leftIcon={<Download className="w-4 h-4" />}
          >
            Exportar DOCX
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => window.print()}
            leftIcon={<Printer className="w-4 h-4" />}
          >
            Imprimir
          </Button>
        </div>
      </div>

      {error && (
        <div className="mb-6 rounded-lg border border-error-500 bg-error-50 p-4 text-sm text-error-600 flex items-center gap-2 print:hidden">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      {/* PAINEL DE CABEÇALHO PERSONALIZADO (ESCONDIDO NA IMPRESSÃO) */}
      <div className="mb-6 bg-surface-0 border border-surface-200 rounded-xl overflow-hidden shadow-sm print:hidden">
        <div className="px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary-50 rounded-lg text-primary-600">
              <Layers className="w-5.5 h-5.5" />
            </div>
            <div>
              <h3 className="font-semibold text-sm text-text-800">
                Cabeçalho Escolar Escrito
              </h3>
              <p className="text-xs text-text-500">
                Adicione escola, professor, turma e data na folha impressa
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-text-500">
              {hasHeader ? "Ativado" : "Desativado"}
            </span>
            <button
              onClick={() => setHasHeader(!hasHeader)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                hasHeader ? "bg-primary-600" : "bg-surface-200"
              }`}
              role="switch"
              aria-checked={hasHeader}
            >
              <span
                aria-hidden="true"
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  hasHeader ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>
        </div>

        {hasHeader && (
          <div className="p-5 border-t border-surface-200 bg-surface-50/20 grid grid-cols-1 sm:grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-1 duration-200">
            <div>
              <label className="block text-[10px] font-bold text-text-500 uppercase tracking-wider mb-1.5">
                Nome da Escola
              </label>
              <input
                type="text"
                value={headerInfo.schoolName}
                onChange={(e) => setHeaderInfo({ ...headerInfo, schoolName: e.target.value })}
                placeholder="Ex: Escola Municipal..."
                className="w-full h-10 px-3 border border-surface-200 rounded-lg text-sm bg-white focus:outline-none focus:border-primary-500"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-text-500 uppercase tracking-wider mb-1.5">
                Nome do(a) Professor(a)
              </label>
              <input
                type="text"
                value={headerInfo.teacherName}
                onChange={(e) => setHeaderInfo({ ...headerInfo, teacherName: e.target.value })}
                placeholder="Ex: Prof. Silva..."
                className="w-full h-10 px-3 border border-surface-200 rounded-lg text-sm bg-white focus:outline-none focus:border-primary-500"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-text-500 uppercase tracking-wider mb-1.5">
                Turma
              </label>
              <input
                type="text"
                value={headerInfo.classroom}
                onChange={(e) => setHeaderInfo({ ...headerInfo, classroom: e.target.value })}
                placeholder="Ex: 5º Ano A..."
                className="w-full h-10 px-3 border border-surface-200 rounded-lg text-sm bg-white focus:outline-none focus:border-primary-500"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-text-500 uppercase tracking-wider mb-1.5">
                Data
              </label>
              <input
                type="text"
                value={headerInfo.date}
                onChange={(e) => setHeaderInfo({ ...headerInfo, date: e.target.value })}
                placeholder="Ex: 23/06/2026..."
                className="w-full h-10 px-3 border border-surface-200 rounded-lg text-sm bg-white focus:outline-none focus:border-primary-500"
              />
            </div>
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-md border border-surface-200 overflow-hidden print:shadow-none print:border-none print:rounded-none">
        <div className="bg-surface-50 border-b border-surface-200 p-4 print:hidden">
          <h1 className="font-bold text-text-900">{document.title}</h1>
          <p className="text-xs text-text-500">
            {DOCUMENT_TYPE_LABELS[document.type]} | Criado em{" "}
            {formatDate(document.createdAt)}
          </p>
        </div>

        <div className="print-document p-8 md:p-12 min-h-[800px] print:min-h-0 bg-white">
          {/* Cabeçalho da Folha (Estilo escolar clássico) */}
          {hasHeader && (
            <div className="border-2 border-text-900 p-4 rounded-lg mb-8 flex flex-col gap-3 text-text-900 font-sans print:border-black print:text-black">
              {headerInfo.schoolName && (
                <div className="text-center font-bold text-sm uppercase text-text-800 border-b border-text-200 pb-2 mb-1 print:border-black print:text-black">
                  {headerInfo.schoolName}
                </div>
              )}

              <div className="flex justify-between items-center border-b border-text-200 pb-2 print:border-black print:text-black">
                <span className="font-extrabold text-sm tracking-tight text-text-800 uppercase print:text-black">
                  {printedDocumentKind(document)}
                </span>
                {document.subject && (
                  <Badge variant="outline" className="border-text-800 text-text-800 text-[10px] font-bold print:border-black print:text-black">
                    {document.subject}
                  </Badge>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs font-semibold text-text-700 print:text-black">
                <div className="flex gap-2">
                  <span>Aluno(a):</span>
                  <div className="flex-1 border-b border-dashed border-text-300 h-4 print:border-black" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex gap-2">
                    <span>Data:</span>
                    <div className="flex-1 border-b border-dashed border-text-300 h-4 px-1 text-text-900 font-bold leading-tight print:border-black print:text-black">
                      {headerInfo.date}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <span>Turma:</span>
                    <div className="flex-1 border-b border-dashed border-text-300 h-4 px-1 text-text-900 font-bold leading-tight print:border-black print:text-black">
                      {headerInfo.classroom}
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs font-semibold text-text-700 print:text-black">
                <div className="flex gap-2">
                  <span>Série:</span>
                  <span className="text-text-900 font-bold print:text-black">{document.grade || "Não informada"}</span>
                </div>
                <div className="flex gap-2">
                  <span>Professor(a):</span>
                  <span className="text-text-900 font-bold print:text-black">
                    {headerInfo.teacherName || "____________________"}
                  </span>
                </div>
              </div>

              <div className="text-xs font-semibold text-text-700 flex gap-2 border-t border-surface-100 pt-2 mt-1 print:border-black print:text-black">
                <span>Tema:</span>
                <span className="text-text-900 font-bold italic print:text-black">
                  &quot;{document.title}&quot;
                </span>
              </div>
            </div>
          )}

          <DocumentContent document={document} />
        </div>
      </div>

      <InclusionModal
        isOpen={isInclusionOpen}
        onClose={() => setIsInclusionOpen(false)}
        originalContent={document.content}
        originalTitle={document.title}
        targetType="DOCUMENT"
        documentType={document.type}
        grade={document.grade}
        subject={document.subject}
      />
    </div>
  );
}
