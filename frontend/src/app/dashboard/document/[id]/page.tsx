"use client";

import * as React from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
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
  Image,
  Edit,
  Plus,
  Trash2,
  Save,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { InclusionModal } from "@/components/dashboard/inclusion-modal";
import { LinkToClassroomModal } from "@/components/classroom/LinkToClassroomModal";
import { Skeleton } from "@/components/ui/skeleton";
import {
  downloadDocumentDocx,
  fetchDocument,
  updateDocument,
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
import {
  getDocumentTemplate,
  getTemplateSectionIndex,
  stripSectionNumber,
} from "@/lib/document-template";
import { LessonKitCreationPanel } from "@/components/lesson-kit/LessonKitCreationPanel";
import { downloadLessonKitMaterial, fetchLessonKit, fetchLessonKitMaterialPdfUrl, updateLessonKitMaterial } from "@/lib/lesson-kit-api";
import type { LessonKitMaterialType } from "@/lib/lesson-kit";
import { isLessonKitMaterialType, kitMaterialEditorMeta, toKitMaterialEditorDocument, unwrapLessonKitMaterialContent, wrapLessonKitMaterialContent } from "@/lib/kit-material-editor";

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

function printedDocumentKind(document: GeneratedDocument, selectedGroup?: string | null) {
  if (selectedGroup) {
    if (selectedGroup === "Plano") return "PLANO DE AULA";
    if (selectedGroup === "Atividade") {
      return isInitialLiteracyDocument(document) ? "ATIVIDADE DE ALFABETIZAÇÃO" : "ATIVIDADE PEDAGÓGICA";
    }
    if (selectedGroup === "Gabarito") return "GABARITO E DIRETRIZES";
    if (selectedGroup === "Avaliacao") return "AVALIAÇÃO DE APRENDIZAGEM";
    if (selectedGroup === "Evidencias") return "REGISTRO DE EVIDÊNCIAS";
    if (selectedGroup === "Adaptacoes") return "ADAPTAÇÕES INCLUSIVAS";
  }

  if (isInitialLiteracyDocument(document)) {
    return "ATIVIDADE DE ALFABETIZAÇÃO";
  }

  return document.type === "EXAM" ? "AVALIAÇÃO ESCRITA" : "ATIVIDADE PEDAGÓGICA";
}

function Section({
  title,
  children,
  templateStyle,
  index,
}: {
  title: string;
  children: React.ReactNode;
  templateStyle: GeneratedDocument["templateStyle"];
  index: number;
}) {
  if (!children) {
    return null;
  }

  return (
    <section className="print-section mb-8 break-inside-avoid">
      <h2 className="print-section-title text-lg font-bold text-primary-800 border-b border-surface-200 pb-2 mb-4">
        <span className="document-template-section-index" aria-hidden="true">
          {getTemplateSectionIndex(templateStyle, index)}
        </span>
        <span>{stripSectionNumber(title)}</span>
      </h2>
      {children}
    </section>
  );
}

function DocumentContent({
  document,
  kitMaterialType,
  selectedGroupTitle,
  hasHeader,
  headerInfo,
  isEditing,
  editTitle,
  setEditTitle,
  editContent,
  updateField,
  styleOverride,
}: {
  document: GeneratedDocument;
  kitMaterialType?: LessonKitMaterialType;
  selectedGroupTitle?: string | null;
  hasHeader?: boolean;
  headerInfo?: {
    schoolName: string;
    teacherName: string;
    classroom: string;
    date: string;
  };
  isEditing?: boolean;
  editTitle?: string;
  setEditTitle?: (title: string) => void;
  editContent?: any;
  updateField?: (path: string[], value: any) => void;
  styleOverride?: TemplateStyle;
}) {
  const printable = buildPrintableDocument(document, kitMaterialType);
  const template = getDocumentTemplate(styleOverride || document.templateStyle);

  if (!printable) {
    return (
      <pre className="whitespace-pre-wrap text-sm leading-relaxed text-text-700 font-sans">
        {document.content}
      </pre>
    );
  }

  const groupsToRender = selectedGroupTitle
    ? printable.groups.filter((g) => g.title === selectedGroupTitle)
    : printable.groups;

  return (
    <article
      className={`print-document-body document-template ${template.rootClass} text-text-800 print:text-black`}
      data-template={template.id}
    >
      {groupsToRender.map((group, index) => {
        let groupTitle = printable.title;
        let kicker = "Documento pedagógico";

        if (group.title === "Plano") {
          groupTitle = "PLANO DE AULA";
          kicker = "Planejamento Docente";
        } else if (group.title === "Atividade") {
          groupTitle = "ATIVIDADE DO ALUNO";
          kicker = "Material do Estudante";
        } else if (group.title === "Gabarito") {
          groupTitle = "GABARITO E DIRETRIZES DO PROFESSOR";
          kicker = "Material de Apoio Docente";
        } else if (group.title === "Avaliacao" || group.title === "Avaliação") {
          groupTitle = "INSTRUMENTO AVALIATIVO";
          kicker = "Avaliação de Aprendizagem";
        } else if (group.title === "Evidencias" || group.title === "Evidências") {
          groupTitle = "EVIDÊNCIAS PEDAGÓGICAS";
          kicker = "Acompanhamento e Registro";
        } else if (group.title === "Adaptacoes" || group.title === "Adaptações") {
          groupTitle = "ADAPTAÇÕES INCLUSIVAS";
          kicker = "Atendimento Educacional Especializado (AEE)";
        } else {
          groupTitle = group.title.toUpperCase();
        }

        return (
          <div
            key={group.title}
            className="print-group mb-10 break-inside-avoid print:mb-0 print:break-inside-auto"
            style={{ pageBreakBefore: index > 0 ? "always" : "auto" }}
          >
            {/* Header of this specific document part */}
            <header className="document-template-heading">
              <span className="document-template-kicker">{kicker}</span>
              {isEditing && setEditTitle && (group.title === "Plano" || group.title === "Documento") ? (
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-text-400 uppercase tracking-wider">
                    Título do Tema
                  </label>
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full text-3xl font-bold text-text-900 border-b border-dashed border-surface-300 focus:border-primary-500 outline-none bg-transparent py-1"
                  />
                </div>
              ) : (
                <h1 className="print-document-title document-template-title text-3xl font-bold text-text-900">
                  {groupTitle}
                </h1>
              )}
              {(document.subject || document.grade) && (
                <p className="document-template-meta mt-1">
                  {[document.subject, document.grade].filter(Boolean).join(" · ")}
                </p>
              )}
            </header>

            {/* School Header of this specific document part */}
            {hasHeader && headerInfo && (
              <div className="border-2 border-text-900 p-4 rounded-lg mb-8 flex flex-col gap-3 text-text-900 font-sans print:border-black print:text-black">
                {headerInfo.schoolName && (
                  <div className="text-center font-bold text-sm uppercase text-text-800 border-b border-text-200 pb-2 mb-1 print:border-black print:text-black">
                    {headerInfo.schoolName}
                  </div>
                )}

                <div className="flex justify-between items-center border-b border-text-200 pb-2 print:border-black print:text-black">
                  <span className="font-extrabold text-sm tracking-tight text-text-800 uppercase print:text-black">
                    {printedDocumentKind(document, group.title)}
                  </span>
                  {document.subject && (
                    <Badge variant="outline" className="border-text-800 text-text-800 text-[10px] font-bold print:border-black print:text-black">
                      {document.subject}
                    </Badge>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs font-semibold text-text-700 print:text-black">
                  {(group.title === "Atividade" || group.title === "Avaliacao" || group.title === "Avaliação") ? (
                    <div className="flex gap-2">
                      <span>Aluno(a):</span>
                      <div className="flex-1 border-b border-dashed border-text-300 h-4 print:border-black" />
                    </div>
                  ) : (
                    <div className="flex gap-2 items-center">
                      <span>Parte do Kit:</span>
                      <span className="text-text-900 font-extrabold uppercase print:text-black">{group.title}</span>
                    </div>
                  )}
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

            {/* Sections of this group */}
            {template.id === "TABLE" && group.title === "Plano" ? (
              <div className="document-table-wrapper border-2 border-text-900 rounded-lg overflow-hidden my-6 print:border-black">
                <table className="w-full border-collapse text-left text-sm print:text-black">
                  <thead>
                    <tr className="bg-text-900 text-white border-b-2 border-text-900 print:bg-gray-100 print:text-black print:border-black">
                      <th className="py-3 px-4 font-extrabold uppercase tracking-wide border-r border-text-900 w-1/4 print:border-black print:bg-gray-100 text-xs">Campo</th>
                      <th className="py-3 px-4 font-extrabold uppercase tracking-wide text-xs">Desenvolvimento / Conteúdo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {group.sections.map((section, sectionIndex) => {
                      const path = isEditing && updateField ? getPathForSection(group.title, section.title, editContent) : null;
                      return (
                        <tr key={section.title} className="border-b border-text-900 last:border-0 print:border-black break-inside-avoid">
                          <td className="py-3 px-4 font-bold text-text-800 border-r border-text-900 bg-surface-50/50 print:border-black print:text-black print:bg-gray-50/20 text-xs uppercase w-1/4 field-name-cell">
                            {stripSectionNumber(section.title)}
                          </td>
                          <td className="py-3 px-4 text-text-700 print:text-black field-content-cell">
                            {isEditing && path && updateField ? (
                              <EditableBlockView
                                block={section.block}
                                path={path}
                                updateField={updateField}
                                editContent={editContent}
                              />
                            ) : (
                              <PrintableBlockView block={section.block} />
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              group.sections.map((section, sectionIndex) => {
                const path = isEditing && updateField ? getPathForSection(group.title, section.title, editContent) : null;
                return (
                  <Section
                    key={`${group.title}-${section.title}`}
                    title={section.title}
                    templateStyle={template.id}
                    index={sectionIndex + 1}
                  >
                    {isEditing && path && updateField ? (
                      <EditableBlockView
                        block={section.block}
                        path={path}
                        updateField={updateField}
                        editContent={editContent}
                      />
                    ) : (
                      <PrintableBlockView block={section.block} />
                    )}
                  </Section>
                );
              })
            )}

            {/* Signatures for lesson plan part */}
            {document.type === "LESSON_PLAN" && group.title === "Plano" && (
              <div className="document-template-signatures mt-8" aria-label="Assinaturas">
                <span>Assinatura do docente</span>
                <span>Coordenação pedagógica</span>
              </div>
            )}
          </div>
        );
      })}

      <footer className="document-template-footer">
        <span>EducaDocs</span>
        <span>{template.label}</span>
      </footer>
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
  const searchParams = useSearchParams();
  const requestedMaterial = searchParams.get("material");
  const requestedKitId = Number(searchParams.get("kit"));
  const kitMaterialType = isLessonKitMaterialType(requestedMaterial) && requestedMaterial !== "LESSON_PLAN"
    ? requestedMaterial
    : undefined;
  const isKitMaterial = Boolean(kitMaterialType && Number.isInteger(requestedKitId) && requestedKitId > 0);
  const invalidKitMaterialRequest = (searchParams.has("kit") || searchParams.has("material")) && !isKitMaterial;
  const [document, setDocument] = React.useState<GeneratedDocument | null>(null);
  const [kitMaterialVersion, setKitMaterialVersion] = React.useState<number | null>(null);
  const [selectedGroupTitle, setSelectedGroupTitle] = React.useState<string | null>(null);
  const [isEditing, setIsEditing] = React.useState(false);
  const [overrideStyle, setOverrideStyle] = React.useState<TemplateStyle | null>(null);
  const [editTitle, setEditTitle] = React.useState("");
  const [editContent, setEditContent] = React.useState<any>(null);
  const [isSaving, setIsSaving] = React.useState(false);
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

  const previewDocument = React.useMemo(() => {
    if (!document) return null;
    if (!isEditing || !editContent) return document;
    return {
      ...document,
      title: editTitle,
      content: JSON.stringify(editContent),
    };
  }, [document, isEditing, editTitle, editContent]);

  const printable = React.useMemo(() => previewDocument ? buildPrintableDocument(previewDocument, kitMaterialType) : null, [previewDocument, kitMaterialType]);
  const hasMultipleGroups = false;

  React.useEffect(() => {
    async function loadDocument() {
      setIsLoading(true);
      setError(null);

      try {
        if (invalidKitMaterialRequest) {
          throw new Error("O link deste material do kit é inválido.");
        }
        const source = await fetchDocument(params.id);
        let data = source;
        if (isKitMaterial && kitMaterialType) {
          const kit = await fetchLessonKit(requestedKitId);
          const material = kit.materials.find((item) => item.type === kitMaterialType);
          if (!material || material.status !== "READY") {
            throw new Error("Este material do kit ainda não está pronto para edição.");
          }
          data = toKitMaterialEditorDocument(source, kit, material);
          setKitMaterialVersion(material.version);
        } else {
          setKitMaterialVersion(null);
        }
        setDocument(data);
        setHasHeader(data.type === "EXAM");

        setEditTitle(data.title);
        const parsed = parseDocumentContent(data.content);
        setEditContent(parsed);

        const pr = buildPrintableDocument(data, kitMaterialType);
        if (pr && pr.groups.length > 0) {
          setSelectedGroupTitle(pr.groups[0].title);
        }
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
  }, [params.id, invalidKitMaterialRequest, isKitMaterial, kitMaterialType, requestedKitId]);

  const updateField = (path: string[], value: any) => {
    if (!editContent) return;
    const newContent = JSON.parse(JSON.stringify(editContent));

    let current = newContent;
    for (let i = 0; i < path.length - 1; i++) {
      const key = path[i];
      if (current[key] === undefined) {
        current[key] = {};
      }
      current = current[key];
    }
    current[path[path.length - 1]] = value;

    setEditContent(newContent);
  };

  async function handleSave() {
    if (!document || !editContent) return;
    setIsSaving(true);
    setError(null);
    try {
      if (isKitMaterial && kitMaterialType && kitMaterialVersion !== null) {
        const updated = await updateLessonKitMaterial(
          requestedKitId,
          kitMaterialType,
          unwrapLessonKitMaterialContent(kitMaterialType, editContent),
          kitMaterialVersion,
        );
        const wrappedContent = wrapLessonKitMaterialContent(kitMaterialType, updated.content);
        setDocument((current) => current ? { ...current, content: wrappedContent } : current);
        setEditContent(parseDocumentContent(wrappedContent));
        setKitMaterialVersion(updated.version);
        setIsEditing(false);
        return;
      }
      const updated = await updateDocument(document.id, {
        title: editTitle,
        content: JSON.stringify(editContent),
      });
      setDocument(updated);
      setIsEditing(false);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Nao foi possivel salvar as alteracoes."
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function handleExport() {
    if (!document) {
      return;
    }

    setIsExporting(true);
    setError(null);

    try {
      if (isKitMaterial && kitMaterialType) {
        await downloadLessonKitMaterial(requestedKitId, kitMaterialType, document.title);
      } else {
        const activeStyle = overrideStyle || document.templateStyle;
        await downloadDocumentDocx(document.id, document.title, activeStyle);
      }
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

  async function handlePrint() {
    if (!isKitMaterial || !kitMaterialType) {
      window.print();
      return;
    }
    const printTab = window.open("about:blank", "_blank");
    setIsExporting(true);
    setError(null);
    try {
      const url = await fetchLessonKitMaterialPdfUrl(requestedKitId, kitMaterialType);
      if (printTab) printTab.location.href = url;
      else window.open(url, "_blank");
      window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch (err) {
      printTab?.close();
      setError(err instanceof Error ? err.message : "Não foi possível gerar o PDF para impressão.");
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
    <div className={`${hasMultipleGroups ? "max-w-6xl" : "max-w-4xl"} mx-auto pb-24 print:max-w-none print:mx-0 print:pb-0`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sticky top-0 bg-surface-50 z-10 py-4 -my-4 px-2 -mx-2 print:hidden">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          leftIcon={<ArrowLeft className="w-4 h-4" />}
        >
          Voltar
        </Button>

        <div className="flex items-center gap-2">
          {isEditing ? (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setIsEditing(false);
                  setEditTitle(document.title);
                  setEditContent(parseDocumentContent(document.content));
                }}
                leftIcon={<X className="w-4 h-4" />}
                disabled={isSaving}
              >
                Cancelar
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleSave}
                isLoading={isSaving}
                leftIcon={<Save className="w-4 h-4" />}
              >
                Salvar Alterações
              </Button>
            </>
          ) : (
            <>
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
                onClick={() => setIsEditing(true)}
                leftIcon={<Edit className="w-4 h-4 text-primary-600" />}
              >
                Editar Conteúdo
              </Button>
              <div className="flex items-center gap-1 bg-surface-100 rounded-lg p-1 border border-surface-200 print:hidden text-xs mr-2">
                <span className="font-semibold text-text-500 px-2 select-none">Design:</span>
                {(["INSTITUTIONAL", "MODERN", "MINIMALIST", "TABLE"] as const).map((style) => {
                  const isStyleSelected = (overrideStyle || document.templateStyle) === style;
                  return (
                    <button
                      key={style}
                      type="button"
                      onClick={() => setOverrideStyle(style)}
                      className={`px-3 py-1.5 rounded-md font-medium transition-all ${
                        isStyleSelected
                          ? "bg-white text-text-950 shadow-sm border border-surface-200/60"
                          : "text-text-600 hover:text-text-950 hover:bg-white/40"
                      }`}
                    >
                      {style === "INSTITUTIONAL" ? "Institucional" :
                       style === "MODERN" ? "Moderno" :
                       style === "MINIMALIST" ? "Minimalista" : "Tabela"}
                    </button>
                  );
                })}
              </div>
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
                onClick={handlePrint}
                leftIcon={<Printer className="w-4 h-4" />}
              >
                Imprimir
              </Button>
            </>
          )}
        </div>
      </div>

      {error && (
        <div className="mb-6 rounded-lg border border-error-500 bg-error-50 p-4 text-sm text-error-600 flex items-center gap-2 print:hidden">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      {document.type === "LESSON_PLAN" && !isKitMaterial && !isEditing && (
        <LessonKitCreationPanel documentId={document.id} />
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

      {/* Visualizador na Tela (oculto na impressão) */}
      <div className="print:hidden w-full">
        {hasMultipleGroups && printable ? (
          <div className="flex flex-col md:flex-row gap-6 items-start">
            {/* Menu Lateral de Navegação */}
            <div className="w-full md:w-64 bg-white border border-surface-200 rounded-xl p-4 shadow-sm shrink-0 md:sticky md:top-24">
              <h3 className="text-xs font-bold text-text-400 uppercase tracking-wider mb-3 px-2">
                Seções do documento
              </h3>
              <nav className="flex flex-col gap-1">
                {printable.groups.map((group) => {
                  const isActive = selectedGroupTitle === group.title;
                  return (
                    <button
                      key={group.title}
                      type="button"
                      onClick={() => setSelectedGroupTitle(group.title)}
                      className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-semibold transition-all flex items-center justify-between cursor-pointer ${
                        isActive
                          ? "bg-primary-50 text-primary-700 shadow-sm"
                          : "text-text-600 hover:bg-surface-50 hover:text-text-900"
                      }`}
                    >
                      <span>{group.title}</span>
                      <span className="text-[10px] bg-surface-100 text-text-500 px-2 py-0.5 rounded-md font-bold">
                        {group.sections.length} {group.sections.length === 1 ? "seção" : "seções"}
                      </span>
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Visualizador da Parte Ativa */}
            <div className="flex-1 bg-white rounded-xl shadow-md border border-surface-200 overflow-hidden w-full">
              <div className="bg-surface-50 border-b border-surface-200 px-6 py-4 flex items-center justify-between">
                <div>
                  <h1 className="font-bold text-text-900 leading-tight">
                    {isEditing ? editTitle : document.title}
                  </h1>
                  <p className="text-xs text-text-500 mt-1">
                    {kitMaterialType ? kitMaterialEditorMeta[kitMaterialType].label : DOCUMENT_TYPE_LABELS[document.type]} · Parte: <strong>{selectedGroupTitle}</strong>
                  </p>
                </div>
              </div>

              <div className="print-document p-8 md:p-12 min-h-[800px] bg-white">
                <DocumentContent
                  document={previewDocument!}
                  kitMaterialType={kitMaterialType}
                  selectedGroupTitle={selectedGroupTitle}
                  hasHeader={hasHeader}
                  headerInfo={headerInfo}
                  isEditing={isEditing}
                  editTitle={editTitle}
                  setEditTitle={setEditTitle}
                  editContent={editContent}
                  updateField={updateField}
                  styleOverride={overrideStyle || undefined}
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-md border border-surface-200 overflow-hidden w-full">
            <div className="bg-surface-50 border-b border-surface-200 p-4">
              <h1 className="font-bold text-text-900">
                {isEditing ? editTitle : document.title}
              </h1>
              <p className="text-xs text-text-500">
                {kitMaterialType ? kitMaterialEditorMeta[kitMaterialType].label : DOCUMENT_TYPE_LABELS[document.type]} | Criado em{" "}
                {formatDate(document.createdAt)}
              </p>
            </div>

            <div className="print-document p-8 md:p-12 min-h-[800px] bg-white">
              <DocumentContent
                document={previewDocument!}
                kitMaterialType={kitMaterialType}
                selectedGroupTitle={kitMaterialType ? kitMaterialEditorMeta[kitMaterialType].group : document.type === "LESSON_PLAN" ? "Plano" : undefined}
                hasHeader={hasHeader}
                headerInfo={headerInfo}
                isEditing={isEditing}
                editTitle={editTitle}
                setEditTitle={setEditTitle}
                editContent={editContent}
                updateField={updateField}
                styleOverride={overrideStyle || undefined}
              />
            </div>
          </div>
        )}
      </div>

      {/* Visualizador de Impressão (exibido apenas na impressão) */}
      <div className="hidden print:block bg-white w-full print:max-w-none">
        <div className="print-document print:p-0 bg-white">
          <DocumentContent
            document={document}
            kitMaterialType={kitMaterialType}
            hasHeader={hasHeader}
            headerInfo={headerInfo}
            styleOverride={overrideStyle || undefined}
          />
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

function ArrayEditor({
  title,
  values,
  onChange,
  isTextarea = false,
}: {
  title: string;
  values: string[];
  onChange: (newValues: string[]) => void;
  isTextarea?: boolean;
}) {
  const arr = Array.isArray(values) ? values : [];
  return (
    <div className="space-y-2 border border-surface-100 rounded-lg p-3 bg-surface-50/15">
      <label className="block text-xs font-bold text-text-600 uppercase tracking-wider">
        {title}
      </label>
      <div className="space-y-2">
        {arr.map((val, idx) => (
          <div key={idx} className="flex gap-2 items-start">
            {isTextarea ? (
              <textarea
                value={val}
                onChange={(e) => {
                  const next = [...arr];
                  next[idx] = e.target.value;
                  onChange(next);
                }}
                className="flex-1 min-h-[60px] p-2 text-sm border border-surface-200 rounded-lg focus:outline-none focus:border-primary-500 bg-white"
              />
            ) : (
              <input
                type="text"
                value={val}
                onChange={(e) => {
                  const next = [...arr];
                  next[idx] = e.target.value;
                  onChange(next);
                }}
                className="flex-1 h-9 px-3 text-sm border border-surface-200 rounded-lg focus:outline-none focus:border-primary-500 bg-white"
              />
            )}
            <Button
              variant="outline"
              size="sm"
              type="button"
              onClick={() => onChange(arr.filter((_, i) => i !== idx))}
              className="h-9 w-9 p-0 shrink-0 text-red-500 border-red-200 hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        ))}
      </div>
      <Button
        variant="outline"
        size="sm"
        type="button"
        onClick={() => onChange([...arr, ""])}
        leftIcon={<Plus className="w-3.5 h-3.5" />}
        className="mt-2 text-xs h-8"
      >
        Adicionar Item
      </Button>
    </div>
  );
}

function getPathForSection(groupTitle: string, sectionTitle: string, editContent: any): string[] | null {
  if (!editContent) return null;
  const g = groupTitle.toLowerCase();
  const s = sectionTitle.toLowerCase();

  if (g === "plano") {
    if (s.includes("tema")) return ["tema"];
    if (s.includes("objetivo")) {
      return editContent.objectives !== undefined ? ["objectives"] : ["objetivosDeAprendizagem"];
    }
    if (s.includes("conteudo") || s.includes("conteúdo")) {
      return editContent.contents !== undefined ? ["contents"] : ["conteudo"];
    }
    if (s.includes("recurso")) {
      return editContent.resources !== undefined ? ["resources"] : ["recursosDidaticos"];
    }
    if (s.includes("metodologia")) return ["metodologia"];
    if (s.includes("avaliacao") || s.includes("avaliação")) {
      const isNew = editContent.evaluation?.observableCriteria !== undefined;
      return isNew ? ["evaluation", "observableCriteria"] : ["avaliacao", "criteriosObservaveis"];
    }
  }

  // Kit parts
  const kitKey = editContent.kit ? "kit" : (editContent.kitAulaCompleta ? "kitAulaCompleta" : null);
  if (kitKey) {
    if (g === "atividade") {
      const actKey = editContent[kitKey].studentActivity ? "studentActivity" : "atividadeAluno";
      if (s.includes("atividade") || s.includes("titulo") || s.includes("título")) return [kitKey, actKey, "title"];
      if (s.includes("contexto")) return [kitKey, actKey, "context"];
      if (s.includes("orientac") || s.includes("orientaç")) {
        const instKey = editContent[kitKey][actKey].instructions ? "instructions" : "orientacoes";
        return [kitKey, actKey, instKey];
      }
      if (s.includes("quest") || s.includes("questões")) {
        const qKey = editContent[kitKey][actKey].questions ? "questions" : "questoes";
        return [kitKey, actKey, qKey];
      }
      if (s.includes("produto")) {
        const prodKey = editContent[kitKey][actKey].expectedProduct ? "expectedProduct" : "produtoEsperado";
        return [kitKey, actKey, prodKey];
      }
    }

    if (g === "gabarito") {
      const keyKey = editContent[kitKey].teacherAnswerKey ? "teacherAnswerKey" : "gabaritoProfessor";
      if (s.includes("resposta")) {
        const ansKey = editContent[kitKey][keyKey].expectedAnswers ? "expectedAnswers" : "respostasEsperadas";
        return [kitKey, keyKey, ansKey];
      }
      if (s.includes("diretriz") || s.includes("orientac") || s.includes("orientaç")) {
        const guidKey = editContent[kitKey][keyKey].teacherGuidance ? "teacherGuidance" : "orientacoesProfessor";
        return [kitKey, keyKey, guidKey];
      }
    }

    if (g === "avaliacao" || g === "avaliação") {
      const instKey = editContent[kitKey].assessmentInstrument ? "assessmentInstrument" : "instrumentoAvaliativo";
      if (s.includes("criterio") || s.includes("critério")) {
        const critKey = editContent[kitKey][instKey].criteria ? "criteria" : "criterios";
        return [kitKey, instKey, critKey];
      }
      if (s.includes("coleta") || s.includes("evidencia")) {
        const evKey = editContent[kitKey][instKey].evidenceCollection ? "evidenceCollection" : "coletaEvidencias";
        return [kitKey, instKey, evKey];
      }
    }

    if (g === "evidencias" || g === "evidências") {
      const evKey = editContent[kitKey].pedagogicalEvidence ? "pedagogicalEvidence" : "evidenciasPedagogicas";
      if (s.includes("observaveis") || s.includes("observáveis")) {
        const obsKey = editContent[kitKey][evKey].observableEvidences ? "observableEvidences" : "evidenciasObservaveis";
        return [kitKey, evKey, obsKey];
      }
      if (s.includes("registro")) {
        const recKey = editContent[kitKey][evKey].recordsForCoordination ? "recordsForCoordination" : "registrosParaCoordenacao";
        return [kitKey, evKey, recKey];
      }
    }

    if (g === "adaptacoes" || g === "adaptações") {
      const adKey = editContent[kitKey].inclusiveAdaptations ? "inclusiveAdaptations" : "adaptacoesInclusivas";
      if (s.includes("leitura")) {
        const readKey = editContent[kitKey][adKey].readingSupport ? "readingSupport" : "apoioLeitura";
        return [kitKey, adKey, readKey];
      }
      if (s.includes("participac") || s.includes("participaç")) {
        const partKey = editContent[kitKey][adKey].participationSupport ? "participationSupport" : "apoioParticipacao";
        return [kitKey, adKey, partKey];
      }
      if (s.includes("alternativa")) {
        const simpKey = editContent[kitKey][adKey].simplifiedAlternatives ? "simplifiedAlternatives" : "alternativasSimplificadas";
        return [kitKey, adKey, simpKey];
      }
    }
  } else {
    // If not a kit, might be generic or EXAM
    if (g === "avaliacao" || g === "avaliação" || g === "documento") {
      if (s.includes("orientac") || s.includes("orientaç")) return ["orientacoesGerais"];
      if (s.includes("quest")) return ["questoes"];
      if (s.includes("criterio") || s.includes("critério")) return ["criteriosCorrecao"];
    }
  }

  return null;
}

function EditableBlockView({
  block,
  path,
  updateField,
  editContent,
}: {
  block: PrintableBlock;
  path: string[];
  updateField: (path: string[], value: any) => void;
  editContent: any;
}) {
  if (block.type === "text") {
    return (
      <textarea
        value={block.value}
        onChange={(e) => updateField(path, e.target.value)}
        className="w-full min-h-[80px] p-2 text-text-700 leading-relaxed border border-surface-200 rounded-lg focus:outline-none focus:border-primary-500 bg-white resize-none"
      />
    );
  }

  if (block.type === "list") {
    const arr = block.values;
    return (
      <div className="space-y-2">
        {arr.map((val, idx) => (
          <div key={idx} className="flex gap-2 items-start">
            <input
              type="text"
              value={val}
              onChange={(e) => {
                const next = [...arr];
                next[idx] = e.target.value;
                updateField(path, next);
              }}
              className="flex-1 h-9 px-3 text-sm border border-surface-200 rounded-lg focus:outline-none focus:border-primary-500 bg-white"
            />
            <Button
              variant="outline"
              size="sm"
              type="button"
              onClick={() => {
                const next = arr.filter((_, i) => i !== idx);
                updateField(path, next);
              }}
              className="h-9 w-9 p-0 shrink-0 text-red-500 border-red-200 hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        ))}
        <Button
          variant="outline"
          size="sm"
          type="button"
          onClick={() => updateField(path, [...arr, ""])}
          leftIcon={<Plus className="w-3.5 h-3.5" />}
          className="text-xs h-8"
        >
          Adicionar Item
        </Button>
      </div>
    );
  }

  if (block.type === "stages") {
    const stages = block.values;
    return (
      <div className="space-y-4">
        {stages.map((stage, idx) => (
          <div key={idx} className="border border-surface-150 rounded-lg p-3 bg-surface-50/5 space-y-2">
            <div className="flex justify-between items-center">
              <span className="font-semibold text-text-700 uppercase text-xs">{stage.title}</span>
              <div className="flex gap-2 items-center">
                <label className="text-[10px] font-bold text-text-400 uppercase">Tempo (min):</label>
                <input
                  type="number"
                  value={parseInt(stage.duration?.replace(/\D/g, "") || "0") || 0}
                  onChange={(e) => {
                    const stepKey = stage.title.toLowerCase().includes("introd")
                      ? "introduction"
                      : stage.title.toLowerCase().includes("desenv")
                      ? "development"
                      : "closing";
                    const isOldKey = editContent.methodology?.[stepKey] === undefined;
                    const finalKey = isOldKey
                      ? (stage.title.toLowerCase().includes("introd") ? "introducao" : stage.title.toLowerCase().includes("desenv") ? "desenvolvimento" : "fechamento")
                      : stepKey;

                    const durationKey = isOldKey ? "tempoMinutos" : "durationMinutes";
                    updateField([...path, finalKey, durationKey], parseInt(e.target.value) || 0);
                  }}
                  className="w-16 h-7 px-1.5 border border-surface-200 rounded text-xs"
                />
              </div>
            </div>
            <div>
              <textarea
                value={stage.description || ""}
                onChange={(e) => {
                  const stepKey = stage.title.toLowerCase().includes("introd")
                    ? "introduction"
                    : stage.title.toLowerCase().includes("desenv")
                    ? "development"
                    : "closing";
                  const isOldKey = editContent.methodology?.[stepKey] === undefined;
                  const finalKey = isOldKey
                    ? (stage.title.toLowerCase().includes("introd") ? "introducao" : stage.title.toLowerCase().includes("desenv") ? "desenvolvimento" : "fechamento")
                    : stepKey;
                  updateField([...path, finalKey, "description"], e.target.value);
                }}
                className="w-full min-h-[60px] p-2 text-xs border border-surface-200 rounded-lg focus:outline-none bg-white resize-none"
              />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (block.type === "questions") {
    let arrInDb = editContent;
    for (const key of path) {
      if (arrInDb) arrInDb = arrInDb[key];
    }
    const qList = Array.isArray(arrInDb) ? arrInDb : [];
    const isQuestionObject = qList.length > 0 ? (typeof qList[0] === "object") : (path.length === 1 && (path[0] === "questoes" || path[0] === "questions"));

    return (
      <div className="space-y-4">
        {qList.map((q: any, idx: number) => {
          const statement = isQuestionObject ? (q?.enunciado || q?.statement || "") : String(q);
          return (
            <div key={idx} className="border border-surface-150 rounded-lg p-3 bg-surface-50/5 space-y-3">
              <div className="flex justify-between items-center">
                <span className="font-bold text-xs text-text-700">Questão {idx + 1}</span>
                <Button
                  variant="outline"
                  size="sm"
                  type="button"
                  onClick={() => {
                    const next = qList.filter((_, i) => i !== idx);
                    updateField(path, next);
                  }}
                  className="h-7 w-7 p-0 shrink-0 text-red-500 border-red-200 hover:bg-red-50"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-text-400 uppercase tracking-wider mb-1">
                  Enunciado
                </label>
                <textarea
                  value={statement}
                  onChange={(e) => {
                    const next = [...qList];
                    if (isQuestionObject) {
                      if (next[idx].enunciado !== undefined) {
                        next[idx] = { ...next[idx], enunciado: e.target.value };
                      } else {
                        next[idx] = { ...next[idx], statement: e.target.value };
                      }
                    } else {
                      next[idx] = e.target.value;
                    }
                    updateField(path, next);
                  }}
                  className="w-full min-h-[60px] p-2 text-xs border border-surface-200 rounded-lg focus:outline-none bg-white resize-none"
                />
              </div>

              {/* Alternatives */}
              {isQuestionObject && q && Array.isArray(q.alternativas || q.alternatives) && (
                <div className="space-y-2 pl-3 border-l-2 border-surface-150">
                  <label className="block text-[10px] font-bold text-text-400 uppercase tracking-wider">
                    Alternativas
                  </label>
                  {(q.alternativas || q.alternatives).map((alt: string, aIdx: number) => (
                    <div key={aIdx} className="flex gap-2 items-center">
                      <span className="text-xs font-semibold text-text-500 uppercase">{String.fromCharCode(97 + aIdx)})</span>
                      <input
                        type="text"
                        value={alt}
                        onChange={(e) => {
                          const next = [...qList];
                          const altsKey = next[idx].alternativas !== undefined ? "alternativas" : "alternatives";
                          const nextAlts = [...next[idx][altsKey]];
                          nextAlts[aIdx] = e.target.value;
                          next[idx] = { ...next[idx], [altsKey]: nextAlts };
                          updateField(path, next);
                        }}
                        className="flex-1 h-8 px-2 text-xs border border-surface-200 rounded-lg focus:outline-none bg-white"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        type="button"
                        onClick={() => {
                          const next = [...qList];
                          const altsKey = next[idx].alternativas !== undefined ? "alternativas" : "alternatives";
                          const nextAlts = next[idx][altsKey].filter((_: any, i: number) => i !== aIdx);
                          next[idx] = { ...next[idx], [altsKey]: nextAlts };
                          updateField(path, next);
                        }}
                        className="text-red-500 border-red-200 hover:bg-red-50 p-1 h-7 w-7"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    size="sm"
                    type="button"
                    onClick={() => {
                      const next = [...qList];
                      const altsKey = next[idx].alternativas !== undefined ? "alternativas" : "alternatives";
                      const nextAlts = [...(next[idx][altsKey] || []), ""];
                      next[idx] = { ...next[idx], [altsKey]: nextAlts };
                      updateField(path, next);
                    }}
                    leftIcon={<Plus className="w-3 h-3" />}
                    className="text-[10px] h-7"
                  >
                    Adicionar Alternativa
                  </Button>
                </div>
              )}
            </div>
          );
        })}
        <Button
          variant="outline"
          size="sm"
          type="button"
          onClick={() => {
            if (isQuestionObject) {
              const hasEnunciado = qList.length > 0 && qList[0].enunciado !== undefined;
              const newQ = hasEnunciado
                ? { numero: qList.length + 1, enunciado: "", tipo: "DISCURSIVA", alternativas: [] }
                : { number: qList.length + 1, statement: "", type: "DISCURSIVA", alternatives: [] };
              updateField(path, [...qList, newQ]);
            } else {
              updateField(path, [...qList, ""]);
            }
          }}
          leftIcon={<Plus className="w-3 h-3" />}
          className="text-xs h-8 w-full"
        >
          Adicionar Nova Questão
        </Button>
      </div>
    );
  }

  return null;
}

function altList(q: any): boolean {
  return Array.isArray(q.alternativas || q.alternatives) && (q.alternativas || q.alternatives).length > 0;
}
