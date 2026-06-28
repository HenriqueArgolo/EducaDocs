"use client";

import * as React from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import * as LucideIcons from "lucide-react";
import {
  ArrowLeft,
  Printer,
  Trash2,
  Sparkles,
  Scissors,
  Eye,
  EyeOff,
  Download,
  AlertCircle,
  Layers,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { fetchActivity, deleteActivity, API_BASE_URL, getToken, fetchActivityPdfBlobUrl } from "@/lib/api";
import type { ActivityMaterial } from "@/lib/types";
import { ACTIVITY_TYPE_LABELS } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { InclusionModal } from "@/components/dashboard/inclusion-modal";
import { LinkToClassroomModal } from "@/components/classroom/LinkToClassroomModal";
import { CalligraphyLine } from "@/components/dashboard/CalligraphyLine";
import {
  getCompletionOptions,
  getFigureIconName,
  getInitialLetter,
  isEarlyLiteracyWorksheetContent,
  getLetters,
  getResponseBoxCount,
  getSyllables,
  normalizeEarlyLiteracyType,
  normalizeFigureKey,
  type EarlyLiteracyItem,
} from "@/lib/early-literacy";
import {
  getActivityImagePath,
  isGeneratedActivityImage,
  toActivityImageUrl,
} from "@/lib/activity-images";

function LiteracyFigureTile({
  figure,
  word,
  imagePath,
}: {
  figure?: string;
  word?: string;
  imagePath?: string | null;
}) {
  const figureKey = normalizeFigureKey(figure);
  const iconName = getFigureIconName(figureKey);
  const Icon = (LucideIcons as unknown as Record<string, React.ComponentType<{ className?: string; strokeWidth?: number }>>)[iconName];
  const imageUrl = toActivityImageUrl(imagePath, API_BASE_URL);

  return (
    <div className="w-24 h-24 border-2 border-text-900 rounded-md bg-white flex flex-col items-center justify-center gap-1 shrink-0 print:border-black">
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={word || figure || "Figura da atividade"}
          className="w-16 h-16 object-contain"
        />
      ) : figureKey === "sapo" ? (
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

function ResponseBoxes({ count }: { count: number }) {
  return (
    <div className="flex flex-wrap gap-2">
      {Array.from({ length: Math.max(1, Math.min(count, 8)) }).map((_, boxIndex) => (
        <span key={boxIndex} className="w-16 h-11 border-2 border-text-900 rounded-sm bg-white print:border-black" />
      ))}
    </div>
  );
}

function ChoiceBubble({ value }: { value: string }) {
  return (
    <span className="inline-flex items-center gap-2 text-xl font-bold text-text-900 print:text-black">
      <span className="w-7 h-7 rounded-full border-2 border-text-900 bg-white print:border-black" />
      {value}
    </span>
  );
}

function EarlyLiteracyExercise({ exercise, index }: { exercise: any; index: number }) {
  const type = normalizeEarlyLiteracyType(exercise?.tipo);
  const items = Array.isArray(exercise?.itens) ? exercise.itens : [];

  return (
    <div className="page-break-inside-avoid">
      <div className="flex items-center gap-3 mb-4">
        <span className="w-8 h-8 rounded-full bg-text-900 text-white flex items-center justify-center text-sm font-bold print:bg-transparent print:text-black print:border print:border-black">
          {exercise?.numero || index + 1}
        </span>
        <h3 className="text-xl font-bold uppercase text-text-900 leading-tight tracking-normal print:text-black">
          {exercise?.comando || exercise?.enunciado || "Faca a atividade."}
        </h3>
      </div>

      <EarlyLiteracyExerciseBody type={type} items={items} />
    </div>
  );
}

function EarlyLiteracyExerciseBody({ type, items }: { type: string; items: EarlyLiteracyItem[] }) {
  if (items.length === 0) {
    return (
      <div className="sm:ml-11 space-y-3">
        <div className="border-b border-text-300 border-dashed h-8" />
        <div className="border-b border-text-300 border-dashed h-8" />
      </div>
    );
  }

  if (type === "LETRA_INICIAL") {
    return (
      <div className="sm:ml-11 grid grid-cols-1 sm:grid-cols-2 gap-4">
        {items.map((item, itemIndex) => {
          const options = Array.isArray(item.opcoes) && item.opcoes.length > 0 ? item.opcoes : [getInitialLetter(item), "B", "M"];
          return (
            <div key={`${item.palavra}-${itemIndex}`} className="border-2 border-text-900 rounded-md p-4 bg-white print:border-black">
              <div className="flex items-center gap-4 mb-4">
                <LiteracyFigureTile figure={item.figura} word={item.palavra} imagePath={getActivityImagePath(item)} />
                <span className="text-2xl font-extrabold text-text-900 tracking-normal print:text-black">{item.palavra}</span>
              </div>
              <div className="flex flex-wrap gap-4">
                {options.map((option) => <ChoiceBubble key={String(option)} value={String(option)} />)}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  if (type === "LIGAR_FIGURA_PALAVRA") {
    const words = [...items].reverse();
    return (
      <div className="sm:ml-11 grid grid-cols-[1fr_auto_1fr] gap-4 items-stretch border-2 border-text-900 rounded-md p-4 bg-white print:border-black">
        <div className="space-y-4">
          {items.map((item, itemIndex) => (
            <div key={`${item.figura}-${itemIndex}`} className="flex items-center gap-3">
              <LiteracyFigureTile figure={item.figura} word={item.palavra} imagePath={getActivityImagePath(item)} />
              <span className="w-7 h-7 rounded-full border-2 border-text-900 bg-white print:border-black" />
            </div>
          ))}
        </div>
        <div className="border-l-2 border-dashed border-text-300 print:border-black" />
        <div className="space-y-4 flex flex-col justify-around">
          {words.map((item, itemIndex) => (
            <div key={`${item.palavra}-${itemIndex}`} className="flex items-center justify-end gap-3 min-h-20">
              <span className="text-2xl font-extrabold uppercase text-text-900 print:text-black">{item.palavra}</span>
              <span className="w-7 h-7 rounded-full border-2 border-text-900 bg-white print:border-black" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (type === "COMPLETAR_PALAVRA") {
    return (
      <div className="sm:ml-11 space-y-4">
        {items.map((item, itemIndex) => {
          const syllables = getSyllables(item);
          const blankIndex = Math.max(0, Math.min(Number(item.lacunaIndice ?? 0), Math.max(syllables.length - 1, 0)));
          return (
            <div key={`${item.palavra}-${itemIndex}`} className="border-2 border-text-900 rounded-md p-4 bg-white print:border-black">
              <div className="flex flex-wrap items-center gap-4 mb-4">
                <LiteracyFigureTile figure={item.figura} word={item.palavra} imagePath={getActivityImagePath(item)} />
                <div className="flex items-center gap-2 text-3xl font-extrabold text-text-900 print:text-black">
                  {syllables.map((syllable, syllableIndex) => (
                    syllableIndex === blankIndex
                      ? <span key={syllableIndex} className="w-20 h-12 border-2 border-text-900 rounded-sm bg-white print:border-black" />
                      : <span key={syllableIndex}>{syllable}</span>
                  ))}
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                {getCompletionOptions(item).map((option) => (
                  <span key={option} className="px-4 py-2 border-2 border-text-900 rounded-md text-xl font-bold print:border-black">{option}</span>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  if (type === "CIRCULAR_LETRA" || type === "CACA_LETRA") {
    return (
      <div className="sm:ml-11 space-y-4">
        {items.map((item, itemIndex) => (
          <div key={`${item.palavra}-${itemIndex}`} className="flex flex-wrap items-center gap-5 border-2 border-text-900 rounded-md p-4 bg-white print:border-black">
            <LiteracyFigureTile figure={item.figura} word={item.palavra} imagePath={getActivityImagePath(item)} />
            <div className="flex flex-wrap gap-3">
              {getLetters(item).map((letter, letterIndex) => (
                <span key={`${letter}-${letterIndex}`} className="w-12 h-12 rounded-full border-2 border-text-900 flex items-center justify-center text-2xl font-extrabold print:border-black">
                  {letter}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (type === "CONTAR_LETRAS") {
    return (
      <div className="sm:ml-11 space-y-4">
        {items.map((item, itemIndex) => (
          <div key={`${item.palavra}-${itemIndex}`} className="flex flex-wrap items-center gap-5 border-2 border-text-900 rounded-md p-4 bg-white print:border-black">
            <LiteracyFigureTile figure={item.figura} word={item.palavra} imagePath={getActivityImagePath(item)} />
            <span className="text-3xl font-extrabold text-text-900 print:text-black">{item.palavra}</span>
            <ResponseBoxes count={1} />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:ml-11">
      {items.map((item, itemIndex) => (
        <div key={`${item.palavra}-${itemIndex}`} className="flex flex-wrap items-center gap-4 border-2 border-text-900 rounded-md p-4 bg-white print:border-black">
          <LiteracyFigureTile figure={item.figura} word={item.palavra} imagePath={getActivityImagePath(item)} />
          <span className="min-w-28 text-2xl font-extrabold text-text-900 tracking-normal print:text-black">
            {item.palavra}
          </span>
          <ResponseBoxes count={getResponseBoxCount(item)} />
        </div>
      ))}
    </div>
  );
}

function getCoreSubject(query: string): string {
  const stopwords = [
    "cute", "outline", "coloring", "page", "cartoon", "vector", "simple", "flat", 
    "drawing", "illustration", "book", "pages", "art", "line", "black", "white", 
    "easy", "friendly", "happy", "little", "sheets", "sheet"
  ];
  const clean = query.toLowerCase();
  const words = clean.split(/\s+/);
  const filtered = words
    .map(w => w.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, ""))
    .filter(word => !stopwords.includes(word) && word.trim().length > 1);
  return filtered.join(" ").trim();
}

function isValidSvg(svg: string | undefined | null): boolean {
  if (!svg || svg.length < 150) return false;
  const lower = svg.toLowerCase();
  return lower.includes("<path") || lower.includes("<text") || lower.includes("<circle") || lower.includes("<rect") || lower.includes("<svg");
}

export default function ActivityViewerPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [material, setMaterial] = React.useState<ActivityMaterial | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [showAnswerKey, setShowAnswerKey] = React.useState(true);
  const [pdfUrl, setPdfUrl] = React.useState<string>("");
  const [hasHeader, setHasHeader] = React.useState(false);
  const [isInclusionOpen, setIsInclusionOpen] = React.useState(false);
  const [headerInfo, setHeaderInfo] = React.useState({
    schoolName: "",
    teacherName: "",
    classroom: "",
    date: ""
  });
  const [pageImages, setPageImages] = React.useState<Record<number, string>>({});
  const [useColoringFilter, setUseColoringFilter] = React.useState(true);

  React.useEffect(() => {
    if (material && material.type === "COLORING_BOOK") {
      try {
        const parsed = JSON.parse(material.content);
        if (parsed.paginas) {
          parsed.paginas.forEach((page: any) => {
            const generatedUrl = toActivityImageUrl(getActivityImagePath(page), API_BASE_URL);
            if (generatedUrl) {
              setPageImages((previous) => ({ ...previous, [page.numero]: generatedUrl }));
            } else {
              fetchImageForPage(page, page.numero);
            }
          });
        }
      } catch (e) {
        console.error("Erro ao analisar conteudo do material para colorir", e);
      }
    }
  }, [material]);

  async function fetchImageForPage(page: any, pageNum: number) {
    if (!page) return;
    const generatedUrl = toActivityImageUrl(getActivityImagePath(page), API_BASE_URL);
    if (generatedUrl) {
      setPageImages((previous) => ({ ...previous, [pageNum]: generatedUrl }));
      return;
    }
    // Always fetch the themed clipart/drawing so we can display it side-by-side with the letter
    
    let materialTitle = "";
    if (material) {
      try {
        const parsed = JSON.parse(material.content);
        materialTitle = parsed.titulo || material.title;
      } catch (e) {
        materialTitle = material.title;
      }
    }

    // 0. Try our custom DuckDuckGo image search first (perfect for cartoon characters and specific themed drawings)
    let searchInterfaceQuery = "";
    if (typeof page === "object" && page.palavras_chave_imagem) {
      searchInterfaceQuery = page.palavras_chave_imagem;
    } else if (typeof page === "object" && page.titulo_pagina) {
      searchInterfaceQuery = `${page.titulo_pagina} coloring page outline`;
    } else if (typeof page === "string") {
      searchInterfaceQuery = `${page} coloring page outline`;
    }

    if (materialTitle) {
      const titleLower = materialTitle.toLowerCase();
      if (titleLower.includes("rei leão") || titleLower.includes("rei leao") || titleLower.includes("lion king") || titleLower.includes("simba")) {
        if (!searchInterfaceQuery.toLowerCase().includes("lion king") && !searchInterfaceQuery.toLowerCase().includes("simba")) {
          searchInterfaceQuery = `${searchInterfaceQuery} lion king`;
        }
      }
    }

    if (searchInterfaceQuery) {
      try {
        const encoded = encodeURIComponent(searchInterfaceQuery.trim());
        const response = await fetch(`/api/images/search?q=${encoded}`);
        if (response.ok) {
          const data = await response.json();
          const results = data.results || [];
          if (results.length > 0) {
            const photo = results[0]?.url; // Take the first result
            if (photo) {
              setPageImages(prev => ({
                ...prev,
                [pageNum]: photo
              }));
              return; // Success! Exit function
            }
          }
        }
      } catch (e) {
        console.warn("Erro ao buscar no DuckDuckGo para query: " + searchInterfaceQuery, e);
      }
    }

    // 1. Try Wikimedia Commons first to get clean vector clipart / drawings
    let coreSubject = "";
    if (typeof page === "object" && page.palavras_chave_imagem) {
      coreSubject = getCoreSubject(page.palavras_chave_imagem);
    } else if (typeof page === "string") {
      coreSubject = getCoreSubject(page);
    }

    if (!coreSubject && typeof page === "object") {
      if (page.texto_apoio) {
        const portToEng: Record<string, string> = {
          "LEÃO": "lion", "LEAO": "lion",
          "RAPOSA": "fox",
          "CACHORRO": "dog", "CÃO": "dog", "CAO": "dog",
          "GATO": "cat",
          "SOL": "sun",
          "NUVEM": "cloud",
          "FLOR": "flower",
          "ABELHA": "bee",
          "PEIXE": "fish",
          "ÁRVORE": "tree", "ARVORE": "tree",
          "CASA": "house",
          "CARRO": "car",
          "MACA": "apple", "MAÇÃ": "apple",
          "BANANA": "banana",
          "PÁSSARO": "bird", "PASSARO": "bird"
        };
        const cleanApoio = page.texto_apoio.toUpperCase().trim();
        coreSubject = portToEng[cleanApoio] || cleanApoio.toLowerCase();
      } else if (page.titulo_pagina) {
        coreSubject = getCoreSubject(page.titulo_pagina);
      }
    }

    if (coreSubject) {
      const commonsQueries = [
        `${coreSubject} coloring page`,
        `${coreSubject} outline`,
        `${coreSubject} drawing`,
        `${coreSubject} line art`,
        `${coreSubject} svg`,
        coreSubject
      ];

      for (const query of commonsQueries) {
        try {
          const encoded = encodeURIComponent(query);
          const url = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${encoded}&gsrnamespace=6&prop=imageinfo&iiprop=url&format=json&origin=*&gsrlimit=10`;
          const response = await fetch(url);
          if (response.ok) {
            const data = await response.json();
            const pages = data?.query?.pages || {};
            
            // Look for SVG files first
            let foundImage = "";
            for (const key of Object.keys(pages)) {
              const imgUrl = pages[key]?.imageinfo?.[0]?.url;
              if (imgUrl && imgUrl.toLowerCase().endsWith('.svg')) {
                foundImage = imgUrl;
                break;
              }
            }
            
            // If no SVG, look for PNG (clipart)
            if (!foundImage) {
              for (const key of Object.keys(pages)) {
                const imgUrl = pages[key]?.imageinfo?.[0]?.url;
                if (imgUrl && imgUrl.toLowerCase().endsWith('.png')) {
                  foundImage = imgUrl;
                  break;
                }
              }
            }

            if (foundImage) {
              setPageImages(prev => ({
                ...prev,
                [pageNum]: foundImage
              }));
              return; // Success! Exit function
            }
          }
        } catch (e) {
          console.warn("Erro ao buscar no Wikimedia Commons para query: " + query, e);
        }
      }
    }

    // 2. Fallback to Unsplash if Wikimedia Commons yields nothing
    const queries: string[] = [];

    if (typeof page === "string") {
      queries.push(`${page} coloring page outline`);
    } else {
      if (page.palavras_chave_imagem) {
        queries.push(page.palavras_chave_imagem);
      }
      if (page.titulo_pagina) {
        queries.push(`${page.titulo_pagina} coloring page outline`);
      }
      if (page.descricao_desenho) {
        queries.push(`${page.descricao_desenho} coloring page outline`);
      }
    }

    if (materialTitle) {
      queries.push(`${materialTitle} coloring page outline`);
    }
    queries.push("coloring book page");

    for (const rawQuery of queries) {
      try {
        const cleanQuery = encodeURIComponent(rawQuery.trim());
        const response = await fetch(`/unsplash-images/napi/search/photos?query=${cleanQuery}&per_page=15`);
        if (response.ok) {
          const data = await response.json();
          const results = data?.results || [];
          if (results.length > 0) {
            const photoIndex = pageNum % results.length;
            const photo = results[photoIndex]?.urls?.regular;
            if (photo) {
              setPageImages(prev => ({
                ...prev,
                [pageNum]: photo
              }));
              return;
            }
          }
        }
      } catch (e) {
        console.warn("Erro ao buscar imagem no Unsplash para query: " + rawQuery, e);
      }
    }
  }

  React.useEffect(() => {
    let active = true;
    let localUrl = "";

    async function loadPdf() {
      if (material) {
        let isPdf = false;
        try {
          const parsed = JSON.parse(material.content);
          isPdf = !!parsed.isPdf;
        } catch (e) {}

        if (isPdf) {
          try {
            const blobUrl = await fetchActivityPdfBlobUrl(material.id);
            if (active) {
              localUrl = blobUrl;
              setPdfUrl(blobUrl);
            } else {
              URL.revokeObjectURL(blobUrl);
            }
          } catch (err) {
            console.error("Erro ao carregar o PDF:", err);
          }
        }
      }
    }

    loadPdf();

    return () => {
      active = false;
      if (localUrl) {
        URL.revokeObjectURL(localUrl);
      }
    };
  }, [material]);

  React.useEffect(() => {
    async function load() {
      setIsLoading(true);
      setError(null);
      try {
        const data = await fetchActivity(id);
        setMaterial(data);
      } catch (err) {
        setError("Não foi possível carregar este recurso.");
      } finally {
        setIsLoading(false);
      }
    }
    if (id) {
      load();
    }
  }, [id]);

  async function handleDelete() {
    if (!material) return;
    if (!confirm("Excluir este material permanentemente?")) return;

    try {
      await deleteActivity(material.id);
      router.push("/dashboard/library");
    } catch (err) {
      alert("Erro ao excluir.");
    }
  }

  function handlePrint() {
    window.print();
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <div className="w-12 h-12 rounded-full border-4 border-primary-200 border-t-primary-600 animate-spin" />
        <span className="text-text-500 font-medium">Carregando recurso didático...</span>
      </div>
    );
  }

  if (error || !material) {
    return (
      <div className="max-w-md mx-auto text-center py-16 bg-surface-0 border border-surface-200 rounded-xl shadow-sm">
        <AlertCircle className="w-12 h-12 text-error-500 mx-auto mb-4" />
        <h3 className="text-lg font-bold text-text-900 mb-2">Erro ao carregar</h3>
        <p className="text-sm text-text-500 mb-6">{error || "Material não encontrado."}</p>
        <Link href="/dashboard/library">
          <Button variant="outline" leftIcon={<ArrowLeft className="w-4 h-4" />}>
            Voltar para a biblioteca
          </Button>
        </Link>
      </div>
    );
  }

  // Parse do conteúdo estruturado gerado pela IA
  let contentData: any = {};
  try {
    contentData = JSON.parse(material.content);
  } catch (e) {
    contentData = {};
  }
  const isEarlyLiteracyWorksheet = material.type === "WORKSHEET"
    && isEarlyLiteracyWorksheetContent(contentData);
  const worksheetExercises = Array.isArray(contentData.exercicios)
    ? contentData.exercicios
    : Array.isArray(contentData.atividadesVisuais)
      ? contentData.atividadesVisuais
      : [];

  return (
    <div className="max-w-4xl mx-auto pb-20 print:p-0 print:pb-0">
      {/* 1. BARRA DE AÇÕES (ESCONDIDA NA IMPRESSÃO) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 bg-surface-0 border border-surface-200 rounded-xl p-4 shadow-sm print:hidden">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/library">
            <button className="p-2 hover:bg-surface-100 rounded-lg transition-colors cursor-pointer text-text-500">
              <ArrowLeft className="w-5 h-5" />
            </button>
          </Link>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-text-400">
              {ACTIVITY_TYPE_LABELS[material.type]}
            </span>
            <h1 className="font-bold text-lg text-text-900 leading-tight">
              {material.title}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {contentData.isPdf ? (
            <>
              {/* Botão de Abrir/Imprimir PDF */}
              <a href={pdfUrl} target="_blank" rel="noopener noreferrer">
                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={<Printer className="w-4 h-4" />}
                  className="text-xs"
                >
                  Imprimir PDF
                </Button>
              </a>

              {/* Botão de Download do PDF */}
              <a href={pdfUrl} download={material.title + ".pdf"}>
                <Button
                  variant="primary"
                  size="sm"
                  leftIcon={<Download className="w-4 h-4" />}
                  className="text-xs shadow-sm"
                >
                  Baixar PDF
                </Button>
              </a>
            </>
          ) : (
            <>
              {/* Botão de Vincular a Turma */}
              <LinkToClassroomModal
                activityId={material.id}
                type="ACTIVITY"
                title={material.title}
              />

              {/* Mostrar/esconder Gabarito (apenas para WORKSHEET) */}
              {material.type === "WORKSHEET" && !isEarlyLiteracyWorksheet && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAnswerKey(!showAnswerKey)}
                  leftIcon={showAnswerKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  className="text-xs"
                >
                  {showAnswerKey ? "Esconder Gabarito" : "Mostrar Gabarito"}
                </Button>
              )}

              {/* Botão de Adaptação Inclusiva */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsInclusionOpen(true)}
                leftIcon={<Sparkles className="w-4 h-4 text-purple-600" />}
                className="text-xs"
              >
                Adaptar (PDI)
              </Button>

              {/* Botão de Impressão Principal */}
              <Button
                variant="primary"
                size="sm"
                onClick={handlePrint}
                leftIcon={<Printer className="w-4 h-4" />}
                className="text-xs shadow-sm"
              >
                Imprimir Material
              </Button>
            </>
          )}

          {/* Exclusão de itens privados */}
          {!material.isPublic && (
            <button
              onClick={handleDelete}
              className="p-2 text-text-400 hover:text-error-500 hover:bg-error-50 rounded-lg transition-colors cursor-pointer border border-transparent hover:border-error-100"
              title="Excluir material"
            >
              <Trash2 className="w-4.5 h-4.5" />
            </button>
          )}
        </div>
      </div>

      {/* 1.5 PAINEL DE CABEÇALHO PERSONALIZADO (ESCONDIDO NA IMPRESSÃO) */}
      {!contentData.isPdf && (
        <div className="mb-6 bg-surface-0 border border-surface-200 rounded-xl overflow-hidden shadow-sm print:hidden">
          <div className="px-5 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary-50 rounded-lg text-primary-600">
                <Layers className="w-5.5 h-5.5" />
              </div>
              <div>
                <h3 className="font-semibold text-sm text-text-800">
                  Cabeçalho Escolar
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
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${
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
                <Input
                  value={headerInfo.schoolName}
                  onChange={(e) => setHeaderInfo({ ...headerInfo, schoolName: e.target.value })}
                  placeholder="Ex: Escola Municipal Dom Pedro II"
                  className="h-10 text-xs bg-white"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-text-500 uppercase tracking-wider mb-1.5">
                  Nome do(a) Professor(a)
                </label>
                <Input
                  value={headerInfo.teacherName}
                  onChange={(e) => setHeaderInfo({ ...headerInfo, teacherName: e.target.value })}
                  placeholder="Ex: Prof. Ana Paula"
                  className="h-10 text-xs bg-white"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-text-500 uppercase tracking-wider mb-1.5">
                  Turma
                </label>
                <Input
                  value={headerInfo.classroom}
                  onChange={(e) => setHeaderInfo({ ...headerInfo, classroom: e.target.value })}
                  placeholder="Ex: 2º Ano B"
                  className="h-10 text-xs bg-white"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-text-500 uppercase tracking-wider mb-1.5">
                  Data
                </label>
                <Input
                  value={headerInfo.date}
                  onChange={(e) => setHeaderInfo({ ...headerInfo, date: e.target.value })}
                  placeholder="Ex: 25/06/2026"
                  className="h-10 text-xs bg-white"
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* 2. DOCUMENTO DE IMPRESSÃO A4 (PREVIEW VISUAL REALÍSTICO / PDF EMBED) */}
      <div className="bg-white border border-surface-200 rounded-2xl shadow-xl overflow-hidden print:overflow-visible print:border-none print:shadow-none print:rounded-none">
        {contentData.isPdf ? (
          <div className="p-6 md:p-8 flex flex-col gap-6 bg-surface-50">
            {/* Cabeçalho informativo sobre o PDF */}
            <div className="bg-white border border-surface-200 rounded-xl p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex flex-col gap-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline" className="bg-primary-50 text-primary-700 border-primary-100 font-bold text-[10px]">
                    {material.subject}
                  </Badge>
                  <Badge variant="outline" className="bg-surface-100 text-surface-700 border-surface-200 font-bold text-[10px]">
                    {material.grade}
                  </Badge>
                </div>
                <h2 className="text-xl font-bold text-text-900 leading-tight">{material.title}</h2>
                <p className="text-sm text-text-500">{material.description}</p>
              </div>
              <div className="flex sm:flex-col gap-2 shrink-0">
                <a href={pdfUrl} download={material.title + ".pdf"}>
                  <Button variant="primary" size="sm" className="w-full justify-center text-xs" leftIcon={<Download className="w-4 h-4" />}>
                    Baixar PDF
                  </Button>
                </a>
                <a href={pdfUrl} target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" size="sm" className="w-full justify-center text-xs" leftIcon={<Printer className="w-4 h-4" />}>
                    Imprimir PDF
                  </Button>
                </a>
              </div>
            </div>

            {/* Alerta de impressão / visualização */}
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-xs leading-relaxed text-amber-800 flex items-start gap-2.5 shadow-sm">
              <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <strong className="text-amber-900 block mb-0.5">Dica de Impressão:</strong>
                Este é um recurso pedagógico digital em formato PDF. Para imprimi-lo perfeitamente com a formatação original do arquivo, utilize o botão <strong>Imprimir PDF</strong> para abrir o arquivo em tela cheia e use o comando de impressão do navegador (Ctrl+P) ou clique em baixar para salvar em seu dispositivo.
              </div>
            </div>

            {/* Visualizador de PDF incorporado */}
            <div className="bg-white border border-surface-200 rounded-xl overflow-hidden shadow-inner aspect-[1/1.4] w-full min-h-[750px] relative">
              <iframe
                src={pdfUrl}
                className="w-full h-full border-0 absolute inset-0"
                title={material.title}
              />
            </div>
          </div>
        ) : (
          /* Folha de Exercícios / Livro de Colorir real em A4 */
          <div className="p-8 md:p-12 print:p-0 print:pt-4 text-text-900 font-sans min-h-[1100px] print:min-h-0 flex flex-col relative bg-white">
            
            {/* Cabeçalho da Folha (Estilo escolar clássico) */}
            {hasHeader ? (
              <div className="border-2 border-text-900 p-4 rounded-lg mb-8 flex flex-col gap-3">
                {headerInfo.schoolName && (
                  <div className="text-center font-bold text-sm uppercase text-text-800 border-b border-text-200 pb-2 mb-1">
                    {headerInfo.schoolName}
                  </div>
                )}
                
                <div className="flex justify-between items-center border-b border-text-200 pb-2">
                  <span className="font-extrabold text-sm tracking-tight text-text-800 uppercase">
                    ATIVIDADE PEDAGÓGICA
                  </span>
                  <Badge variant="outline" className="border-text-800 text-text-800 text-[10px] font-bold">
                    {material.subject}
                  </Badge>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-xs font-semibold text-text-700">
                  <div className="flex gap-2">
                    <span>Aluno(a):</span>
                    <div className="flex-1 border-b border-dashed border-text-300 h-4" />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex gap-2">
                      <span>Data:</span>
                      <div className="flex-1 border-b border-dashed border-text-300 h-4 px-1 text-text-900 font-bold leading-tight">
                        {headerInfo.date}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <span>Turma:</span>
                      <div className="flex-1 border-b border-dashed border-text-300 h-4 px-1 text-text-900 font-bold leading-tight">
                        {headerInfo.classroom}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs font-semibold text-text-700">
                  <div className="flex gap-2">
                    <span>Série:</span>
                    <span className="text-text-900 font-bold">{material.grade}</span>
                  </div>
                  <div className="flex gap-2">
                    <span>Professor(a):</span>
                    <span className="text-text-900 font-bold">
                      {headerInfo.teacherName || "____________________"}
                    </span>
                  </div>
                </div>

                <div className="text-xs font-semibold text-text-700 flex gap-2 border-t border-surface-100 pt-2 mt-1">
                  <span>Tema:</span>
                  <span className="text-text-900 font-bold italic">"{contentData.titulo || material.title}"</span>
                </div>
              </div>
            ) : (
              <div className="mb-8 pb-4 border-b-2 border-text-900 flex justify-between items-end">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-primary-600 block mb-1">
                    {ACTIVITY_TYPE_LABELS[material.type]}
                  </span>
                  <h2 className="text-2xl font-extrabold text-text-900 leading-tight">
                    {contentData.titulo || material.title}
                  </h2>
                </div>
                <div className="flex flex-col items-end gap-1.5">
                  <Badge variant="outline" className="border-text-800 text-text-800 text-[10px] font-bold">
                    {material.subject}
                  </Badge>
                  <span className="text-[10px] font-bold text-text-500 uppercase">{material.grade}</span>
                </div>
              </div>
            )}

            {/* DESCRIÇÃO ORIENTATIVA DO PROFESSOR (OCULTA NO PRINT) */}
            {contentData.descricao && (
              <div className="mb-6 p-4 bg-primary-50/50 border border-primary-100 rounded-lg text-xs leading-relaxed text-text-600 print:hidden flex items-start gap-2.5">
                <Sparkles className="w-5 h-5 text-primary-500 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-primary-800 block mb-0.5">Nota Pedagógica:</strong>
                  {contentData.descricao}
                </div>
              </div>
            )}

            {/* INSTRUÇÕES DO ALUNO */}
            {contentData.instrucoes_alunos && (
              <div className="mb-6">
                <h3 className="font-bold text-sm text-text-900 mb-1 border-b border-text-200 pb-1 uppercase tracking-wider">
                  Instruções da Atividade:
                </h3>
                <p className="text-xs text-text-600 leading-relaxed italic">
                  {contentData.instrucoes_alunos}
                </p>
              </div>
            )}

            {/* AVISO DO LIVRO DE COLORIR / FILTRO DE CONTORNO */}
            {material.type === "COLORING_BOOK" && contentData.paginas?.some(
              (page: any) => !isGeneratedActivityImage(getActivityImagePath(page))
            ) && (
              <div className="mb-6 p-4 bg-primary-50/50 border border-primary-100 rounded-xl text-xs leading-relaxed text-text-600 print:hidden flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-2.5">
                  <Sparkles className="w-5 h-5 text-primary-500 shrink-0 mt-0.5 animate-pulse" />
                  <div>
                    <strong className="text-primary-850 block mb-0.5">Modo de Colorir Ativado:</strong>
                    Para que as imagens fiquem prontas para impressão e pintura, aplicamos um **filtro de contorno inteligente** nas fotos. Você pode alternar para visualizar a foto colorida de referência!
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setUseColoringFilter(!useColoringFilter)}
                  className="shrink-0 text-xs rounded-xl bg-white hover:bg-slate-50 cursor-pointer border-slate-200"
                >
                  {useColoringFilter ? "Ver Foto Original" : "Ver Desenho (Contorno)"}
                </Button>
              </div>
            )}

            {/* 3. RENDERIZADORES DE CONTEÚDO */}

            {/* A. RENDERIZADOR: COLORING_BOOK */}
            {material.type === "COLORING_BOOK" && contentData.paginas && (
              <div className="space-y-10 flex-1">
                {contentData.paginas.map((page: any) => (
                  <div
                    key={page.numero}
                    className="border border-surface-200 p-6 rounded-xl bg-surface-50/20 flex flex-col gap-4 print:border-none print:p-0 page-break-inside-avoid"
                  >
                    <div className="flex justify-between items-center border-b border-surface-200 pb-2">
                      <span className="font-extrabold text-sm text-text-800">
                        Página {page.numero} • {page.titulo_pagina}
                      </span>
                    </div>

                    {/* Quadro Delineado para a Criança Colorir */}
                    <div className={`w-full aspect-[1.4] rounded-2xl flex flex-col items-center justify-center text-center select-none relative overflow-hidden ${
                      isValidSvg(page.svg_content) || pageImages[page.numero] 
                        ? "bg-white p-2 border-0" 
                        : "border-2 border-dashed border-text-300 bg-surface-50 p-6"
                    }`}>
                      {pageImages[page.numero] ? (
                        <img
                          src={pageImages[page.numero]}
                          alt={page.descricao_desenho}
                          crossOrigin="anonymous"
                          className="w-full h-full object-contain max-h-[400px] print:max-h-[500px]"
                          style={
                            !isGeneratedActivityImage(getActivityImagePath(page)) && useColoringFilter
                              ? { filter: "url(#coloring-outline)" }
                              : undefined
                          }
                        />
                      ) : isValidSvg(page.svg_content) ? (
                        <div 
                          className="w-full h-full max-h-[400px] print:max-h-[500px] flex items-center justify-center [&>svg]:w-full [&>svg]:h-full [&>svg]:max-h-full [&>svg]:max-w-full"
                          dangerouslySetInnerHTML={{ __html: page.svg_content }}
                        />
                      ) : (
                        <>
                          <div className="absolute inset-4 border border-text-200 border-dashed rounded-xl pointer-events-none opacity-40" />
                          
                          <svg className="w-16 h-16 text-text-300 mb-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          
                          <span className="text-[10px] uppercase font-bold text-text-400 tracking-wider">
                            Espaço para colorir (Carregando desenho...)
                          </span>
                          <p className="text-[9px] text-text-400 mt-1 max-w-xs italic leading-snug">
                            "{page.descricao_desenho}"
                          </p>
                        </>
                      )}
                    </div>

                    {/* Texto de Caligrafia/Leitura Tracejado (Dashed Font) */}
                    {page.texto_apoio && (
                      <CalligraphyLine text={page.texto_apoio} />
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* B. RENDERIZADOR: WORKSHEET DE ALFABETIZAÇÃO INICIAL */}
            {material.type === "WORKSHEET" && isEarlyLiteracyWorksheet && worksheetExercises.length > 0 && (
              <div className="early-literacy-print space-y-8 flex-1">
                {worksheetExercises.map((ex: any, exerciseIndex: number) => (
                  <EarlyLiteracyExercise
                    key={ex.numero || exerciseIndex}
                    exercise={ex}
                    index={exerciseIndex}
                  />
                ))}
              </div>
            )}

            {/* C. RENDERIZADOR: WORKSHEET */}
            {material.type === "WORKSHEET" && !isEarlyLiteracyWorksheet && contentData.exercicios && (
              <div className="space-y-8 flex-1">
                {contentData.exercicios.map((ex: any) => (
                  <div key={ex.numero} className="page-break-inside-avoid">
                    <div className="font-bold text-xs mb-2 flex items-start gap-1">
                      <span className="bg-text-900 text-white w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-[10px]">
                        {ex.numero}
                      </span>
                      <span className="pt-0.5 leading-relaxed">{ex.enunciado}</span>
                    </div>

                    {/* Tipo Múltipla Escolha */}
                    {ex.tipo === "multipla_escolha" && ex.opcoes && (
                      <div className="pl-6 grid grid-cols-2 gap-2 mt-2">
                        {ex.opcoes.map((opt: string, idx: number) => (
                          <div key={idx} className="flex items-center gap-2 text-xs text-text-700">
                            <span className="w-4 h-4 rounded-full border border-text-800 shrink-0" />
                            <span>{opt}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Tipo Resposta Escrita (Linhas Pautadas) */}
                    {ex.tipo === "resposta_escrita" && (
                      <div className="pl-6 space-y-3 mt-3">
                        <div className="border-b border-text-200 h-1" />
                        <div className="border-b border-text-200 h-1" />
                        <div className="border-b border-text-200 h-1" />
                      </div>
                    )}

                    {/* Tipo Desenho (Caixa em branco) */}
                    {ex.tipo === "desenho" && (
                      <div className="pl-6 mt-3">
                        <div className="w-full h-32 border border-text-300 border-dashed rounded-lg bg-surface-50/30 flex items-center justify-center">
                          <span className="text-[10px] text-text-400 font-semibold uppercase">Desenhe aqui</span>
                        </div>
                      </div>
                    )}

                    {/* Exibir Gabarito do Professor */}
                    {ex.gabarito && showAnswerKey && (
                      <div className="mt-2 ml-6 p-2 bg-success-50 border border-success-200 rounded text-[10px] text-success-800 font-medium print:hidden flex items-start gap-1">
                        <span className="font-bold">Gabarito:</span>
                        <span>{ex.gabarito}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* D. RENDERIZADOR: FLASHCARD */}
            {material.type === "FLASHCARD" && contentData.fichas && (
              <div className="flex-1">
                <span className="text-[9px] text-text-400 font-bold uppercase tracking-wider mb-4 flex items-center gap-1 print:hidden">
                  <Scissors className="w-3.5 h-3.5 text-primary-500" />
                  Dica: Recorte ao longo das linhas pontilhadas, dobre ao meio e cole.
                </span>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                  {contentData.fichas.map((card: any, idx: number) => (
                    <div
                      key={idx}
                      className="border-2 border-dashed border-text-300 rounded-xl p-4 flex flex-col divide-y divide-dashed divide-text-300 relative bg-surface-50/10 page-break-inside-avoid"
                    >
                      <div className="absolute top-2 right-2 text-text-300 print:hidden">
                        <Scissors className="w-3.5 h-3.5" />
                      </div>
                      {/* Frente */}
                      <div className="pb-4 text-center">
                        <span className="text-[9px] text-text-400 font-semibold tracking-wider block mb-2 uppercase">Frente</span>
                        <span className="font-extrabold text-[24px] text-primary-600 block my-4">{card.frente}</span>
                      </div>
                      {/* Verso */}
                      <div className="pt-4 text-center">
                        <span className="text-[9px] text-text-400 font-semibold tracking-wider block mb-2 uppercase">Verso</span>
                        <p className="text-xs text-text-700 font-medium leading-relaxed my-2">{card.verso}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* D. RENDERIZADOR: GAME */}
            {material.type === "GAME" && (
              <div className="space-y-6 flex-1 text-xs">
                {/* Regras */}
                {contentData.regras && (
                  <div>
                    <h3 className="font-bold text-sm text-text-900 mb-2 border-b border-text-200 pb-1 uppercase tracking-wider">
                      Regras do Jogo:
                    </h3>
                    <ul className="space-y-1.5 list-disc pl-5 text-text-700 leading-relaxed">
                      {contentData.regras.map((regra: string, idx: number) => (
                        <li key={idx}>{regra}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Passo a Passo */}
                {contentData.passo_a_passo && (
                  <div>
                    <h3 className="font-bold text-sm text-text-900 mb-2 border-b border-text-200 pb-1 uppercase tracking-wider">
                      Como Jogar (Passo a Passo):
                    </h3>
                    <ol className="space-y-1.5 list-decimal pl-5 text-text-700 leading-relaxed">
                      {contentData.passo_a_passo.map((passo: string, idx: number) => (
                        <li key={idx}>{passo}</li>
                      ))}
                    </ol>
                  </div>
                )}

                {/* Cartões / Perguntas a serem recortadas */}
                {contentData.perguntas_jogo && (
                  <div className="page-break-inside-avoid">
                    <h3 className="font-bold text-sm text-text-900 mb-2 border-b border-text-200 pb-1 uppercase tracking-wider flex items-center gap-1.5">
                      <Scissors className="w-4 h-4 text-primary-500" />
                      Cartões de Sorteio / Palavras:
                    </h3>
                    <div className="grid grid-cols-3 gap-3 mt-3">
                      {contentData.perguntas_jogo.map((item: string, idx: number) => (
                        <div
                          key={idx}
                          className="border border-dashed border-text-300 rounded p-2 text-center font-bold text-xs bg-surface-50/30 flex items-center justify-center relative min-h-[44px]"
                        >
                          {item}
                          <Scissors className="w-2.5 h-2.5 text-text-300 absolute top-1 right-1 print:hidden" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Rodapé da folha de atividades */}
            <div className="mt-12 pt-4 print:mt-2 print:pt-2 border-t border-text-300 flex justify-between items-center text-[9px] text-text-500 font-bold">
              <span>Gerado por EduDocs.ai</span>
              <span>Aprovado pedagogicamente com a BNCC</span>
              <span>Folha de Atividades</span>
            </div>

          </div>
        )}
      </div>

      <InclusionModal
        isOpen={isInclusionOpen}
        onClose={() => setIsInclusionOpen(false)}
        originalContent={material.content}
        originalTitle={material.title}
        targetType="ACTIVITY"
        activityType={material.type}
        grade={material.grade}
        subject={material.subject}
      />

      {/* SVG filter to turn any photo into a coloring page outline drawing */}
      <svg className="absolute w-0 h-0" width="0" height="0">
        <defs>
          <filter id="coloring-outline">
            {/* 1. Convert to grayscale */}
            <feColorMatrix type="saturate" values="0" />
            
            {/* 2. Soften photo noise to ensure neat outlines */}
            <feGaussianBlur stdDeviation="1.0" />
            
            {/* 3. Edge detection using Laplacian convolution kernel */}
            <feConvolveMatrix
              order="3"
              kernelMatrix="-1 -1 -1
                            -1  8 -1
                            -1 -1 -1"
              preserveAlpha="true"
            />
            
            {/* 4. Invert to get black outline lines on a white background */}
            <feColorMatrix
              type="matrix"
              values="-1  0  0 0 1
                       0 -1  0 0 1
                       0  0 -1 0 1
                       0  0  0 1 0"
            />
            
            {/* 5. Extreme contrast adjustment (threshold) for clean white & black vector-like look */}
            <feComponentTransfer>
              <feFuncR type="linear" slope="14" intercept="-7.5" />
              <feFuncG type="linear" slope="14" intercept="-7.5" />
              <feFuncB type="linear" slope="14" intercept="-7.5" />
            </feComponentTransfer>
          </filter>
        </defs>
      </svg>
    </div>
  );
}
