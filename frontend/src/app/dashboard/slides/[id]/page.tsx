"use client";

import * as React from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Presentation,
  Download,
  Play,
  Layers,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  FileText,
  Search,
  Plus,
  Trash2,
  Sparkles,
  Info,
  CheckCircle2,
  AlertCircle,
  Image as ImageIcon,
  Copy,
  ArrowUp,
  ArrowDown,
  MessageSquare,
  PlusCircle
} from "lucide-react";
import pptxgen from "pptxgenjs";
import { toPng } from "html-to-image";

import { fetchPresentation, savePresentation, refinePresentation, API_BASE_URL, getToken } from "@/lib/api";
import type { Presentation as PresentationType, Slide, SlideLayout } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LinkToClassroomModal } from "@/components/classroom/LinkToClassroomModal";
import { ThemeAtmosphere } from "@/components/presentation-theme/ThemeAtmosphere";
import { PRESENTATION_THEME_LIBRARY, getPresentationTheme } from "@/lib/presentation-themes";

// Curated educational stock photos from Unsplash for robust fallback
const FALLBACK_STOCK_PHOTOS: Record<string, string> = {
  matematica: "https://images.unsplash.com/photo-1509228468518-180dd4864904?auto=format&fit=crop&w=1200&q=80",
  portugues: "https://images.unsplash.com/photo-1457369804613-52c61a468e7d?auto=format&fit=crop&w=1200&q=80",
  historia: "https://images.unsplash.com/photo-1461360370896-922624d12aa1?auto=format&fit=crop&w=1200&q=80",
  geografia: "https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&w=1200&q=80",
  ciencias: "https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=1200&q=80",
  biologia: "https://images.unsplash.com/photo-1530026405186-ed1ea0ac7a63?auto=format&fit=crop&w=1200&q=80",
  fisica: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&w=1200&q=80",
  quimica: "https://images.unsplash.com/photo-1603126857599-f6e157fa2fe6?auto=format&fit=crop&w=1200&q=80",
  artes: "https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?auto=format&fit=crop&w=1200&q=80",
  ingles: "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&w=1200&q=80",
  default: "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=1200&q=80"
};

function getSlideImages(slide: Slide): { img1: string; img2: string } {
  const url = slide.imageUrl || FALLBACK_STOCK_PHOTOS.default;
  if (url.includes(",")) {
    const parts = url.split(",");
    return { img1: parts[0]?.trim() || url, img2: parts[1]?.trim() || url };
  }
  return { img1: url, img2: url };
}

type LegacyThemeType =
  | "LUDICO"
  | "MODERNO_ESCURO"
  | "CLASSICO"
  | "VIBRANTE_NEON"
  | "WARM_OUTONO"
  | "MIND_MINIMAL"
  | "BRUTALISTA"
  | "FLORESTA_TROPICAL"
  | "CEU_PASTEL"
  | "OCEANO_PROFUNDO"
  | "CAFE_VINTAGE"
  | "SOLAR"
  | "ROSA_CREATIVO"
  | "CYBERPUNK"
  | "AURORA"
  | "CANDY_LAND"
  | "CHALKBOARD"
  | "ROYAL_GOLD"
  | "TERRA_COTTA"
  | "LAVANDA_ZEPHYR"
  | "TECH_ORANGE"
  | "MENTA_FRESCA";

interface ThemeStyle {
  label: string;
  bgClass: string;
  cardBgClass: string;
  titleColor: string;
  textColor: string;
  accentColor: string;
  badgeClass: string;
  fontFamily: string;
  pptxBg: string;
  pptxText: string;
  pptxTitle: string;
  pptxFont: string;
}

const THEME_STYLES: Record<LegacyThemeType, ThemeStyle> = {
  LUDICO: {
    label: "Lúdico Pastel",
    bgClass: "bg-gradient-to-tr from-purple-100 via-pink-50 to-indigo-100 text-purple-950",
    cardBgClass: "bg-white/80 backdrop-blur-md border border-purple-200/50 shadow-lg",
    titleColor: "text-purple-900 font-extrabold",
    textColor: "text-purple-950/80 font-medium",
    accentColor: "bg-purple-600 hover:bg-purple-700 text-white",
    badgeClass: "bg-purple-100 text-purple-800 border-purple-200",
    fontFamily: "font-sans",
    pptxBg: "F5ECFC",
    pptxText: "3B0764",
    pptxTitle: "581C87",
    pptxFont: "Trebuchet MS",
  },
  MODERNO_ESCURO: {
    label: "Moderno Escuro",
    bgClass: "bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 text-slate-100",
    cardBgClass: "bg-slate-900/60 backdrop-blur-md border border-slate-800 shadow-xl",
    titleColor: "text-white font-extrabold tracking-tight",
    textColor: "text-slate-300 font-normal",
    accentColor: "bg-cyan-500 hover:bg-cyan-600 text-slate-950",
    badgeClass: "bg-cyan-500/10 text-cyan-400 border-cyan-500/30",
    fontFamily: "font-mono",
    pptxBg: "0F172A",
    pptxText: "CBD5E1",
    pptxTitle: "FFFFFF",
    pptxFont: "Courier New",
  },
  CLASSICO: {
    label: "Clássico Ivory",
    bgClass: "bg-stone-50 text-stone-900",
    cardBgClass: "bg-white border-2 border-stone-200 shadow-md",
    titleColor: "text-blue-950 font-serif font-bold",
    textColor: "text-stone-700 font-serif",
    accentColor: "bg-blue-950 hover:bg-blue-900 text-white",
    badgeClass: "bg-stone-100 text-stone-800 border-stone-300",
    fontFamily: "font-serif",
    pptxBg: "FAF9F6",
    pptxText: "292524",
    pptxTitle: "172554",
    pptxFont: "Georgia",
  },
  VIBRANTE_NEON: {
    label: "Vibrante Neon",
    bgClass: "bg-slate-950 text-slate-100",
    cardBgClass: "bg-slate-900/40 border border-fuchsia-500/30 shadow-lg",
    titleColor: "text-fuchsia-400 font-extrabold tracking-wide",
    textColor: "text-slate-200 font-medium",
    accentColor: "bg-lime-400 hover:bg-lime-500 text-slate-950",
    badgeClass: "bg-fuchsia-500/10 text-fuchsia-300 border-fuchsia-500/30",
    fontFamily: "font-sans",
    pptxBg: "0B0F19",
    pptxText: "E2E8F0",
    pptxTitle: "F43F5E",
    pptxFont: "Arial",
  },
  WARM_OUTONO: {
    label: "Cálido Outono",
    bgClass: "bg-gradient-to-br from-orange-50 via-amber-50 to-orange-100 text-amber-950",
    cardBgClass: "bg-white/90 border border-amber-200 shadow-md",
    titleColor: "text-amber-900 font-extrabold",
    textColor: "text-amber-950/80 font-normal",
    accentColor: "bg-amber-700 hover:bg-amber-800 text-white",
    badgeClass: "bg-amber-100 text-amber-800 border-amber-200",
    fontFamily: "font-sans",
    pptxBg: "FEF3C7",
    pptxText: "78350F",
    pptxTitle: "92400E",
    pptxFont: "Georgia",
  },
  MIND_MINIMAL: {
    label: "Mente Minimalista",
    bgClass: "bg-white text-slate-900",
    cardBgClass: "bg-white border border-slate-200 shadow-none",
    titleColor: "text-slate-950 font-black tracking-tight",
    textColor: "text-slate-600 font-normal leading-relaxed",
    accentColor: "bg-slate-900 hover:bg-slate-800 text-white",
    badgeClass: "bg-slate-100 text-slate-700 border-slate-200",
    fontFamily: "font-sans",
    pptxBg: "FFFFFF",
    pptxText: "475569",
    pptxTitle: "0F172A",
    pptxFont: "Arial",
  },
  BRUTALISTA: {
    label: "Neo-Brutalismo",
    bgClass: "bg-yellow-100 text-black",
    cardBgClass: "bg-white border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]",
    titleColor: "text-black font-black uppercase tracking-wider",
    textColor: "text-black font-semibold",
    accentColor: "bg-black hover:bg-zinc-800 text-yellow-350 border-2 border-black",
    badgeClass: "bg-white text-black border-2 border-black font-bold",
    fontFamily: "font-mono",
    pptxBg: "FEF08A",
    pptxText: "000000",
    pptxTitle: "000000",
    pptxFont: "Trebuchet MS",
  },
  FLORESTA_TROPICAL: {
    label: "Floresta Tropical",
    bgClass: "bg-gradient-to-br from-emerald-950 via-teal-950 to-green-950 text-emerald-50",
    cardBgClass: "bg-emerald-900/30 backdrop-blur border border-emerald-800/40 shadow-xl",
    titleColor: "text-emerald-300 font-extrabold",
    textColor: "text-emerald-100/90 font-medium",
    accentColor: "bg-emerald-400 hover:bg-emerald-500 text-slate-950",
    badgeClass: "bg-emerald-500/10 text-emerald-300 border-emerald-500/30",
    fontFamily: "font-sans",
    pptxBg: "022C22",
    pptxText: "D1FAE5",
    pptxTitle: "34D399",
    pptxFont: "Arial",
  },
  CEU_PASTEL: {
    label: "Céu Pastel",
    bgClass: "bg-gradient-to-r from-blue-100 via-rose-50 to-orange-100 text-blue-950",
    cardBgClass: "bg-white/70 backdrop-blur border border-blue-200/50 shadow-md",
    titleColor: "text-blue-900 font-black",
    textColor: "text-blue-950/80 font-medium",
    accentColor: "bg-blue-600 hover:bg-blue-700 text-white",
    badgeClass: "bg-blue-100 text-blue-800 border-blue-200",
    fontFamily: "font-sans",
    pptxBg: "EFF6FF",
    pptxText: "1E3A8A",
    pptxTitle: "1D4ED8",
    pptxFont: "Arial",
  },
  OCEANO_PROFUNDO: {
    label: "Oceano Profundo",
    bgClass: "bg-gradient-to-br from-sky-950 via-slate-900 to-cyan-950 text-cyan-50",
    cardBgClass: "bg-sky-900/30 border border-sky-800/30 shadow-lg",
    titleColor: "text-cyan-400 font-extrabold",
    textColor: "text-sky-200 font-normal",
    accentColor: "bg-cyan-500 hover:bg-cyan-600 text-slate-950",
    badgeClass: "bg-cyan-500/10 text-cyan-300 border-cyan-500/30",
    fontFamily: "font-sans",
    pptxBg: "082F49",
    pptxText: "E0F2FE",
    pptxTitle: "06B6D4",
    pptxFont: "Arial",
  },
  CAFE_VINTAGE: {
    label: "Café Vintage",
    bgClass: "bg-gradient-to-tr from-amber-100/50 via-stone-100 to-orange-100/30 text-stone-900",
    cardBgClass: "bg-white/80 border-2 border-stone-200 shadow-md",
    titleColor: "text-amber-900 font-serif font-extrabold",
    textColor: "text-stone-700 font-serif font-medium",
    accentColor: "bg-amber-800 hover:bg-amber-900 text-white",
    badgeClass: "bg-amber-100 text-amber-900 border-amber-200",
    fontFamily: "font-serif",
    pptxBg: "F5F5F4",
    pptxText: "44403C",
    pptxTitle: "78350F",
    pptxFont: "Georgia",
  },
  SOLAR: {
    label: "Solar",
    bgClass: "bg-gradient-to-br from-yellow-50 via-amber-100 to-orange-100 text-amber-950",
    cardBgClass: "bg-white/90 border border-orange-200 shadow-lg",
    titleColor: "text-orange-950 font-black",
    textColor: "text-amber-900 font-medium",
    accentColor: "bg-orange-500 hover:bg-orange-600 text-white",
    badgeClass: "bg-orange-100 text-orange-850 border-orange-200",
    fontFamily: "font-sans",
    pptxBg: "FEF3C7",
    pptxText: "9A3412",
    pptxTitle: "EA580C",
    pptxFont: "Arial",
  },
  ROSA_CREATIVO: {
    label: "Rosa Criativo",
    bgClass: "bg-gradient-to-br from-pink-900 via-purple-950 to-indigo-950 text-pink-50",
    cardBgClass: "bg-pink-950/40 border border-pink-800/30 shadow-2xl",
    titleColor: "text-pink-300 font-black tracking-wide",
    textColor: "text-pink-100/90 font-medium",
    accentColor: "bg-pink-500 hover:bg-pink-600 text-white",
    badgeClass: "bg-pink-500/10 text-pink-300 border-pink-500/30",
    fontFamily: "font-sans",
    pptxBg: "500724",
    pptxText: "FCE7F3",
    pptxTitle: "F472B6",
    pptxFont: "Arial",
  },
  CYBERPUNK: {
    label: "Cyberpunk",
    bgClass: "bg-black text-white",
    cardBgClass: "bg-zinc-950 border border-yellow-400 shadow-[2px_2px_0px_0px_#eab308]",
    titleColor: "text-yellow-400 font-black uppercase tracking-widest",
    textColor: "text-zinc-350 font-mono",
    accentColor: "bg-yellow-400 hover:bg-yellow-500 text-black font-extrabold",
    badgeClass: "bg-zinc-900 text-yellow-400 border border-yellow-400 font-mono",
    fontFamily: "font-mono",
    pptxBg: "000000",
    pptxText: "E4E4E7",
    pptxTitle: "EAB308",
    pptxFont: "Courier New",
  },
  AURORA: {
    label: "Aurora Boreal",
    bgClass: "bg-gradient-to-b from-indigo-950 via-slate-900 to-emerald-950 text-indigo-50",
    cardBgClass: "bg-indigo-900/20 backdrop-blur border border-emerald-500/20 shadow-xl",
    titleColor: "text-emerald-400 font-extrabold tracking-tight",
    textColor: "text-indigo-200/90 font-normal",
    accentColor: "bg-emerald-500 hover:bg-emerald-600 text-indigo-950",
    badgeClass: "bg-emerald-500/10 text-emerald-300 border-emerald-500/20",
    fontFamily: "font-sans",
    pptxBg: "1E1B4B",
    pptxText: "EEF2F6",
    pptxTitle: "10B981",
    pptxFont: "Arial",
  },
  CANDY_LAND: {
    label: "Doce Candy",
    bgClass: "bg-gradient-to-br from-teal-50 via-pink-50 to-yellow-50 text-teal-950",
    cardBgClass: "bg-white/80 border border-pink-200/50 shadow-md",
    titleColor: "text-pink-550 font-black",
    textColor: "text-teal-900/80 font-medium",
    accentColor: "bg-teal-500 hover:bg-teal-600 text-white",
    badgeClass: "bg-pink-100 text-pink-700 border-pink-200",
    fontFamily: "font-sans",
    pptxBg: "F0FDFA",
    pptxText: "115E59",
    pptxTitle: "EC4899",
    pptxFont: "Arial",
  },
  CHALKBOARD: {
    label: "Quadro Negro",
    bgClass: "bg-emerald-950 text-emerald-100 border-4 border-amber-900/40 p-2",
    cardBgClass: "bg-emerald-900/40 border border-dashed border-emerald-500/30 text-emerald-50 shadow-inner",
    titleColor: "text-white font-serif font-extrabold tracking-wide",
    textColor: "text-emerald-100/90 font-serif leading-relaxed",
    accentColor: "bg-white hover:bg-slate-100 text-emerald-950",
    badgeClass: "bg-emerald-900 text-emerald-300 border border-emerald-700",
    fontFamily: "font-serif",
    pptxBg: "064E3B",
    pptxText: "ECFDF5",
    pptxTitle: "FFFFFF",
    pptxFont: "Georgia",
  },
  ROYAL_GOLD: {
    label: "Império Real",
    bgClass: "bg-gradient-to-br from-rose-950 via-red-950 to-stone-900 text-amber-100",
    cardBgClass: "bg-stone-900/50 border border-amber-500/30 shadow-2xl",
    titleColor: "text-amber-400 font-serif font-black tracking-wide",
    textColor: "text-stone-355 font-serif font-normal",
    accentColor: "bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold",
    badgeClass: "bg-amber-500/10 text-amber-400 border border-amber-500/30",
    fontFamily: "font-serif",
    pptxBg: "450A0A",
    pptxText: "FEF3C7",
    pptxTitle: "F59E0B",
    pptxFont: "Georgia",
  },
  TERRA_COTTA: {
    label: "Terracota",
    bgClass: "bg-gradient-to-br from-stone-100 via-orange-50 to-orange-100/40 text-orange-950",
    cardBgClass: "bg-white border border-orange-200/50 shadow-sm",
    titleColor: "text-orange-900 font-black",
    textColor: "text-stone-700 font-medium",
    accentColor: "bg-orange-600 hover:bg-orange-700 text-white",
    badgeClass: "bg-orange-100 text-orange-900 border-orange-200",
    fontFamily: "font-sans",
    pptxBg: "FAF7F5",
    pptxText: "431407",
    pptxTitle: "C2410C",
    pptxFont: "Georgia",
  },
  LAVANDA_ZEPHYR: {
    label: "Calmaria Lavanda",
    bgClass: "bg-gradient-to-tr from-violet-50 via-indigo-50 to-purple-100 text-violet-950",
    cardBgClass: "bg-white/80 border border-violet-200/60 shadow-md",
    titleColor: "text-violet-900 font-extrabold",
    textColor: "text-violet-950/80 font-medium",
    accentColor: "bg-violet-600 hover:bg-violet-700 text-white",
    badgeClass: "bg-violet-100 text-violet-800 border-violet-200",
    fontFamily: "font-sans",
    pptxBg: "F5F3FF",
    pptxText: "2E1065",
    pptxTitle: "6D28D9",
    pptxFont: "Arial",
  },
  TECH_ORANGE: {
    label: "Tech Orange",
    bgClass: "bg-gradient-to-br from-zinc-900 via-zinc-950 to-zinc-900 text-zinc-100",
    cardBgClass: "bg-zinc-900/55 border border-zinc-800 shadow-xl",
    titleColor: "text-orange-500 font-black tracking-tight",
    textColor: "text-zinc-300 font-normal",
    accentColor: "bg-orange-500 hover:bg-orange-600 text-zinc-950 font-bold",
    badgeClass: "bg-orange-500/10 text-orange-400 border border-orange-500/30",
    fontFamily: "font-mono",
    pptxBg: "18181B",
    pptxText: "E4E4E7",
    pptxTitle: "F97316",
    pptxFont: "Courier New",
  },
  MENTA_FRESCA: {
    label: "Menta Fresca",
    bgClass: "bg-gradient-to-tr from-green-50 via-teal-50 to-emerald-100 text-emerald-950",
    cardBgClass: "bg-white/90 border border-emerald-200 shadow-sm",
    titleColor: "text-emerald-900 font-black",
    textColor: "text-emerald-950/80 font-medium",
    accentColor: "bg-emerald-600 hover:bg-emerald-700 text-white",
    badgeClass: "bg-emerald-100 text-emerald-800 border-emerald-200",
    fontFamily: "font-sans",
    pptxBg: "F0FDF4",
    pptxText: "14532D",
    pptxTitle: "15803D",
    pptxFont: "Arial",
  },
};

function toPptxColor(hex: string) {
  return hex.replace("#", "").toUpperCase();
}

function resolveThemeStyle(themeId: string): ThemeStyle {
  if (themeId in THEME_STYLES) return THEME_STYLES[themeId as LegacyThemeType];
  const definition = getPresentationTheme(themeId);
  if (!definition) return THEME_STYLES.LUDICO;
  return {
    label: definition.name,
    bgClass: "bg-[var(--presentation-canvas)] text-[var(--presentation-ink)]",
    cardBgClass: "bg-[var(--presentation-surface)]/90 border border-[var(--presentation-accent)]/20 shadow-md",
    titleColor: "text-[var(--presentation-ink)] font-black",
    textColor: "text-[var(--presentation-muted)] font-medium",
    accentColor: "bg-[var(--presentation-accent)] text-[var(--presentation-on-accent)]",
    badgeClass: "bg-[var(--presentation-surface)]/90 text-[var(--presentation-ink)] border-[var(--presentation-accent)]/30",
    fontFamily: "",
    pptxBg: toPptxColor(definition.colors.canvas),
    pptxText: toPptxColor(definition.colors.muted),
    pptxTitle: toPptxColor(definition.colors.ink),
    pptxFont: definition.fontFamily.split(",")[0].trim(),
  };
}

function ThemeBackground({ theme }: { theme: string }) {
  switch (theme) {
    case "LUDICO":
      return (
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
          <div className="absolute top-0 right-0 w-32 h-32 bg-purple-300/30 rounded-full blur-2xl" />
          <div className="absolute bottom-0 left-0 w-40 h-40 bg-pink-300/30 rounded-full blur-2xl" />
        </div>
      );
    case "MODERNO_ESCURO":
      return (
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
          <div className="absolute inset-0 opacity-[0.03] bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:24px_24px]" />
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500 to-blue-500" />
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-cyan-500/10 rounded-full blur-3xl" />
        </div>
      );
    case "CLASSICO":
      return (
        <div className="absolute inset-0 pointer-events-none z-0 p-4">
          <div className="w-full h-full border border-stone-300 rounded-lg flex items-center justify-center p-1">
            <div className="w-full h-full border border-stone-200 rounded-md" />
          </div>
        </div>
      );
    case "VIBRANTE_NEON":
      return (
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
          <div className="absolute top-0 right-0 w-32 h-32 bg-fuchsia-500/10 rounded-full blur-2xl" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-lime-400/10 rounded-full blur-2xl" />
          <div className="absolute bottom-6 right-6 w-3 h-3 bg-fuchsia-500/25 rounded-full" />
          <div className="absolute bottom-6 right-12 w-1.5 h-1.5 bg-lime-400/25 rounded-full" />
        </div>
      );
    case "WARM_OUTONO":
      return (
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
          <div className="absolute top-4 right-4 w-12 h-12 rounded-full border border-amber-800/10" />
          <div className="absolute -bottom-10 -right-10 w-32 h-32 rounded-full bg-amber-500/5 blur-xl" />
          <div className="absolute bottom-4 left-4 w-16 h-16 rounded-full border border-dashed border-amber-800/10" />
        </div>
      );
    case "MIND_MINIMAL":
      return (
        <div className="absolute inset-0 pointer-events-none z-0">
          <div className="absolute left-6 top-6 bottom-6 w-[1px] bg-slate-900/10" />
          <div className="absolute right-6 top-6 bottom-6 w-[1px] bg-slate-900/10" />
        </div>
      );
    case "BRUTALISTA":
      return (
        <div className="absolute inset-0 pointer-events-none z-0 p-3">
          <div className="w-full h-full border-2 border-black/40 opacity-20 relative">
            <div className="absolute top-2 left-2 text-xs font-mono font-black">+</div>
            <div className="absolute top-2 right-2 text-xs font-mono font-black">+</div>
            <div className="absolute bottom-2 left-2 text-xs font-mono font-black">+</div>
            <div className="absolute bottom-2 right-2 text-xs font-mono font-black">+</div>
          </div>
        </div>
      );
    case "FLORESTA_TROPICAL":
      return (
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
          <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-800/20 rounded-full blur-3xl" />
          <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-teal-850/20 rounded-full blur-3xl" />
          <div className="absolute bottom-8 right-8 text-[48px] opacity-[0.04] font-serif select-none">☘</div>
        </div>
      );
    case "CEU_PASTEL":
      return (
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
          <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-white/30 to-transparent" />
          <div className="absolute top-4 left-6 w-8 h-8 rounded-full bg-white/20 blur-sm" />
          <div className="absolute top-6 left-12 w-12 h-6 rounded-full bg-white/20 blur-sm" />
        </div>
      );
    case "OCEANO_PROFUNDO":
      return (
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
          <div className="absolute inset-0 opacity-[0.02] bg-[radial-gradient(#fff_1px,transparent_1px)] bg-[size:16px_16px]" />
          <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-cyan-400/10 rounded-full blur-3xl" />
        </div>
      );
    case "CAFE_VINTAGE":
      return (
        <div className="absolute inset-0 pointer-events-none z-0 p-5">
          <div className="w-full h-full border border-amber-900/10 rounded-lg relative">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 px-2 bg-stone-100/10 text-[8px] font-serif uppercase tracking-widest text-amber-900/60">
              * EST. 2026 *
            </div>
          </div>
        </div>
      );
    case "SOLAR":
      return (
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
          <div className="absolute -top-20 -left-20 w-80 h-80 bg-yellow-400/20 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-0 w-32 h-32 bg-orange-400/15 rounded-full blur-2xl" />
        </div>
      );
    case "ROSA_CREATIVO":
      return (
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
          <div className="absolute -top-12 -left-12 w-36 h-36 bg-pink-500/10 rounded-full blur-2xl" />
          <div className="absolute bottom-8 right-8 text-[48px] opacity-[0.06] select-none">★</div>
        </div>
      );
    case "CYBERPUNK":
      return (
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
          <div className="absolute top-0 left-0 right-0 h-1 bg-yellow-400" />
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-yellow-400" />
          <div className="absolute top-3 right-3 text-[9px] font-mono text-yellow-400/40">SYS_SEC: ACTIVE</div>
          <div className="absolute bottom-8 left-4 w-4 h-4 border-l border-b border-yellow-400/30" />
        </div>
      );
    case "AURORA":
      return (
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
          <div className="absolute inset-0 bg-gradient-to-t from-emerald-500/5 via-indigo-500/0 to-purple-500/5" />
          <div className="absolute -top-40 left-0 right-0 h-80 bg-emerald-500/10 rounded-full blur-[100px]" />
        </div>
      );
    case "CANDY_LAND":
      return (
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
          <div className="absolute top-0 right-0 w-32 h-32 bg-pink-300/20 rounded-full blur-2xl" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-teal-300/20 rounded-full blur-2xl" />
        </div>
      );
    case "CHALKBOARD":
      return (
        <div className="absolute inset-0 pointer-events-none z-0 p-2">
          <div className="w-full h-full border-4 border-amber-900/60 rounded-lg relative">
            <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(#fff_1px,transparent_1px)] bg-[size:8px_8px]" />
          </div>
        </div>
      );
    case "ROYAL_GOLD":
      return (
        <div className="absolute inset-0 pointer-events-none z-0 p-5">
          <div className="absolute top-4 left-4 w-4 h-4 border-t-2 border-l-2 border-amber-400/40" />
          <div className="absolute top-4 right-4 w-4 h-4 border-t-2 border-r-2 border-amber-400/40" />
          <div className="absolute bottom-4 left-4 w-4 h-4 border-b-2 border-l-2 border-amber-400/40" />
          <div className="absolute bottom-4 right-4 w-4 h-4 border-b-2 border-r-2 border-amber-400/40" />
          <div className="absolute inset-0 flex items-center justify-center opacity-[0.02] text-[180px] select-none">⚜</div>
        </div>
      );
    case "TERRA_COTTA":
      return (
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
          <div className="absolute -bottom-10 -right-10 w-44 h-44 rounded-full border-8 border-orange-700/5" />
          <div className="absolute -top-10 -left-10 w-44 h-44 rounded-full border-8 border-orange-700/5" />
        </div>
      );
    case "LAVANDA_ZEPHYR":
      return (
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
          <div className="absolute top-1/4 right-0 w-40 h-40 bg-purple-300/10 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 left-0 w-40 h-40 bg-indigo-300/10 rounded-full blur-3xl" />
        </div>
      );
    case "TECH_ORANGE":
      return (
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
          <div className="absolute inset-0 opacity-[0.015] bg-[linear-gradient(to_right,#fff_1px,transparent_1px),linear-gradient(to_bottom,#fff_1px,transparent_1px)] bg-[size:32px_32px]" />
          <div className="absolute top-4 left-4 w-2 h-2 rounded-full bg-orange-500/40" />
          <div className="absolute top-4 left-8 w-2 h-2 rounded-full bg-zinc-800" />
          <div className="absolute top-4 left-12 w-2 h-2 rounded-full bg-zinc-800" />
        </div>
      );
    case "MENTA_FRESCA":
      return (
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
          <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-80 h-32 bg-emerald-500/5 rounded-full blur-2xl" />
        </div>
      );
    default:
      return null;
  }
}

const LAYOUT_LABELS: Record<SlideLayout, string> = {
  title_slide: "Capa Split",
  bullet_points: "Tópicos",
  text_and_image: "Texto & Imagem",
  quote: "Citação",
  exercise: "Exercício / Desafio",
  summary: "Recapitulando",
  comparison: "Duas Colunas (Comparação)",
  numbered_steps: "Passos Numerados",
  timeline: "Linha do Tempo",
  grid_cards: "Grade de 3 Colunas",
  split_columns: "Colunas com Imagem",
  highlight_quote: "Imagem & Destaque (Callout)"
};

const compositionGridClasses: Record<string, string> = {
  organic: "grid-cols-[46%_54%]",
  editorial: "grid-cols-[58%_42%]",
  archive: "grid-cols-[42%_58%]",
  laboratory: "grid-cols-[40%_60%]",
  geometric: "grid-cols-2",
  cinematic: "grid-cols-[62%_38%]",
  collage: "grid-cols-[48%_52%]",
  notebook: "grid-cols-[36%_64%]",
  gallery: "grid-cols-[60%_40%]",
  focus: "grid-cols-[34%_66%]",
};

export default function SlideWorkspacePage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = params.id as string;
  const slideCanvasRef = React.useRef<HTMLDivElement>(null);

  const themeParam = searchParams.get("theme");

  const [presentation, setPresentation] = React.useState<PresentationType | null>(null);

  // Style to hide elements during export
  React.useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = `
      .export-hidden {
        transition: opacity 0.2s ease;
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);
  const [slides, setSlides] = React.useState<Slide[]>([]);
  const [activeIndex, setActiveIndex] = React.useState<number>(0);
  const [activeTheme, setActiveTheme] = React.useState<string>(() => themeParam || "LUDICO");
  const [isSaving, setIsSaving] = React.useState(false);
  const [isExporting, setIsExporting] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // AI Refinement states
  const [isRefining, setIsRefining] = React.useState(false);
  const [refineMessage, setRefineMessage] = React.useState("");
  const [aiInstruction, setAiInstruction] = React.useState("");
  const [rightTab, setRightTab] = React.useState<"edit" | "ai">("edit");
  
  // Presenter Mode state
  const [isPresenterMode, setIsPresenterMode] = React.useState(false);
  
  // Image Search states
  const [imageSearchQuery, setImageSearchQuery] = React.useState("");
  const [searchResults, setSearchResults] = React.useState<string[]>([]);
  const [isSearchingImages, setIsSearchingImages] = React.useState(false);
  const [isModalSearchOpen, setIsModalSearchOpen] = React.useState(false);
  const [isSpeakerNotesOpen, setIsSpeakerNotesOpen] = React.useState(false);

  // Helper point functions to safely read/write slide points array
  const currentSlide = slides[activeIndex];
  function getPoint(index: number, defaultValue = ""): string {
    if (!currentSlide || !currentSlide.pontos) return defaultValue;
    return currentSlide.pontos[index] || defaultValue;
  }

  function setPoint(index: number, val: string) {
    if (!currentSlide) return;
    setSlides(prev => {
      const copy = [...prev];
      if (copy[activeIndex]) {
        const newPoints = [...(copy[activeIndex].pontos || [])];
        while (newPoints.length <= index) {
          newPoints.push("");
        }
        newPoints[index] = val;
        copy[activeIndex] = { ...copy[activeIndex], pontos: newPoints };
      }
      return copy;
    });
  }

  // Slide management functions
  function addSlide() {
    const nextNum = slides.length + 1;
    const newSlide: Slide = {
      slide_number: nextNum,
      layout: "bullet_points",
      titulo: "Novo Slide",
      pontos: ["Adicione um ponto relevante de ensino."],
      notas_professor: "Notas pedagógicas do professor para este slide.",
      palavras_chave_imagem: "escola"
    };
    setSlides(prev => [...prev, newSlide]);
    setActiveIndex(slides.length);
  }

  function duplicateSlide(idx: number, e: React.MouseEvent) {
    e.stopPropagation();
    const slideToDuplicate = slides[idx];
    if (!slideToDuplicate) return;
    const newSlide: Slide = {
      ...slideToDuplicate,
      slide_number: slides.length + 1
    };
    const copy = [...slides];
    copy.splice(idx + 1, 0, newSlide);
    const renumbered = copy.map((s, i) => ({ ...s, slide_number: i + 1 }));
    setSlides(renumbered);
    setActiveIndex(idx + 1);
  }

  function deleteSlide(idx: number, e: React.MouseEvent) {
    e.stopPropagation();
    if (slides.length <= 1) {
      alert("A apresentação deve ter no mínimo 1 slide.");
      return;
    }
    if (!confirm("Tem certeza que deseja excluir este slide?")) return;
    const copy = slides.filter((_, i) => i !== idx);
    const renumbered = copy.map((s, i) => ({ ...s, slide_number: i + 1 }));
    setSlides(renumbered);
    setActiveIndex(Math.max(0, Math.min(activeIndex, renumbered.length - 1)));
  }

  function moveSlide(idx: number, direction: "up" | "down", e: React.MouseEvent) {
    e.stopPropagation();
    if (direction === "up" && idx === 0) return;
    if (direction === "down" && idx === slides.length - 1) return;
    const targetIdx = direction === "up" ? idx - 1 : idx + 1;
    const copy = [...slides];
    const temp = copy[idx];
    copy[idx] = copy[targetIdx];
    copy[targetIdx] = temp;
    const renumbered = copy.map((s, i) => ({ ...s, slide_number: i + 1 }));
    setSlides(renumbered);
    setActiveIndex(targetIdx);
  }

  // Load Presentation
  const load = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchPresentation(id);
      setPresentation(data);
      
      const parsed = JSON.parse(data.slidesJson);
      const slidesList: Slide[] = parsed.slides || [];
      
      // Auto-load matching stock photos for slides if they don't have images yet
      const subjectKey = (data.subject || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      const defaultPhoto = FALLBACK_STOCK_PHOTOS[subjectKey] || FALLBACK_STOCK_PHOTOS.default;

      const initializedSlides = slidesList.map((slide, idx) => {
        if (!slide.imageUrl) {
          // Attempt to assign a specific fallback image or use default
          return {
            ...slide,
            imageUrl: defaultPhoto
          };
        }
        return slide;
      });

      setSlides(initializedSlides);
      
      // Trigger background photo fetches using Unsplash NAPI
      initializedSlides.forEach((slide, index) => {
        fetchUnsplashImageForSlide(slide, index, data.topic, data.subject);
      });

    } catch (err) {
      setError("Não foi possível carregar a apresentação.");
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  React.useEffect(() => {
    if (id) {
      load();
    }
  }, [id, load]);

  // Fetch image helper from Unsplash Public NAPI
  async function fetchUnsplashImageForSlide(slide: Slide, index: number, topic: string, subject: string) {
    if (!slide) return;

    const queries: string[] = [];
    if (slide.palavras_chave_imagem) {
      queries.push(slide.palavras_chave_imagem);
    }
    if (slide.titulo) {
      queries.push(slide.titulo);
      if (subject) {
        queries.push(`${slide.titulo} ${subject}`);
      }
    }
    if (topic) {
      queries.push(topic);
    }

    for (const rawQuery of queries) {
      try {
        const cleanQuery = encodeURIComponent(rawQuery.trim());
        // Fetch up to 15 images to ensure variety and different pictures for each slide
        const response = await fetch(`/unsplash-images/napi/search/photos?query=${cleanQuery}&per_page=15`);
        if (response.ok) {
          const data = await response.json();
          const results = data?.results || [];
          if (results.length > 0) {
            // Select photo dynamically using slide index modulo the number of results to ensure distinct pictures
            const photoIndex = index % results.length;
            const photoUrl = results[photoIndex]?.urls?.regular;
            if (photoUrl) {
              setSlides(prev => {
                const copy = [...prev];
                if (copy[index]) {
                  copy[index] = { ...copy[index], imageUrl: photoUrl };
                }
                return copy;
              });
              return; // Success, exit query loop for this slide
            }
          }
        }
      } catch (e) {
        console.warn("Erro ao buscar imagem no Unsplash para slide " + index + " com query: " + rawQuery, e);
      }
    }
  }

  function logPhotoError(e: any) {
    console.warn("Unsplash API load issue, using default stock photo. Details:", e);
  }

  // Keyboard navigation in Presenter Mode
  React.useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (!isPresenterMode) return;
      if (e.key === "ArrowRight" || e.key === "Space") {
        setActiveIndex(prev => Math.min(prev + 1, slides.length - 1));
      } else if (e.key === "ArrowLeft") {
        setActiveIndex(prev => Math.max(prev - 1, 0));
      } else if (e.key === "Escape") {
        setIsPresenterMode(false);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isPresenterMode, slides.length]);

  // Save changes
  async function handleSave() {
    if (!presentation) return;
    setIsSaving(true);
    try {
      const updatedJson = JSON.stringify({ slides });
      await savePresentation(presentation.id, {
        title: presentation.title,
        topic: presentation.topic,
        grade: presentation.grade,
        subject: presentation.subject,
        slidesJson: updatedJson
      });
      // reload details
      const data = await fetchPresentation(id);
      setPresentation(data);
    } catch (err) {
      alert("Erro ao salvar alterações.");
    } finally {
      setIsSaving(false);
    }
  }

  // AI Refine conversational edits
  async function handleAIRefine(instructionText: string) {
    if (!presentation || !instructionText.trim()) return;
    setIsRefining(true);
    setRefineMessage("A IA está analisando e refinando seu slide...");
    try {
      const updated = await refinePresentation(presentation.id, {
        instruction: instructionText,
        slideIndex: activeIndex
      });
      setPresentation(updated);
      
      const parsed = JSON.parse(updated.slidesJson);
      const slidesList: Slide[] = parsed.slides || [];
      
      const subjectKey = (updated.subject || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      const defaultPhoto = FALLBACK_STOCK_PHOTOS[subjectKey] || FALLBACK_STOCK_PHOTOS.default;

      const initializedSlides = slidesList.map((slide, idx) => {
        return {
          ...slide,
          imageUrl: slide.imageUrl || defaultPhoto
        };
      });

      setSlides(initializedSlides);
      setAiInstruction("");
      setActiveIndex(prev => Math.min(prev, initializedSlides.length - 1));
    } catch (err) {
      alert(err instanceof Error ? err.message : "Erro ao refinar com IA.");
    } finally {
      setIsRefining(false);
    }
  }

  // Search photos manually
  async function handleImageSearch() {
    if (!imageSearchQuery.trim()) return;
    setIsSearchingImages(true);
    try {
      const response = await fetch(`/unsplash-images/napi/search/photos?query=${encodeURIComponent(imageSearchQuery)}&per_page=12`);
      if (response.ok) {
        const data = await response.json();
        const urls = (data?.results || []).map((r: any) => r?.urls?.regular).filter(Boolean);
        setSearchResults(urls);
      } else {
        throw new Error();
      }
    } catch (e) {
      alert("Erro ao pesquisar fotos. Digite termos em inglês ou tente novamente.");
    } finally {
      setIsSearchingImages(false);
    }
  }

  const [activeImageSearchIndex, setActiveImageSearchIndex] = React.useState<0 | 1>(0);

  function selectImage(url: string) {
    if (!currentSlide) return;
    setSlides(prev => {
      const copy = [...prev];
      if (copy[activeIndex]) {
        const slide = copy[activeIndex];
        const { img1, img2 } = getSlideImages(slide);
        const updatedUrl = activeImageSearchIndex === 0
          ? `${url},${img2}`
          : `${img1},${url}`;
        copy[activeIndex] = { ...slide, imageUrl: updatedUrl };
      }
      return copy;
    });
  }

  // PPTX Export Logic (pptxgenjs)
  async function handleExportPPTXLegacy() {
    if (!presentation) return;
    const pres = new pptxgen();
    pres.layout = "LAYOUT_16x9";
    
    const theme = resolveThemeStyle(activeTheme);

    // Define colors for pptx
    const pptxBg = theme.pptxBg;
    const pptxText = theme.pptxText;
    const pptxTitle = theme.pptxTitle;
    const pptxFont = theme.pptxFont;

    slides.forEach((slide) => {
      const newSlide = pres.addSlide();
      // Set background color
      newSlide.background = { fill: pptxBg };

      const { img1, img2 } = getSlideImages(slide);

      // Render depending on layout
      if (slide.layout === "title_slide") {
        if (slide.imageUrl) {
          // Left side text
          newSlide.addText(slide.titulo, {
            x: 0.8, y: 1.2, w: 4.8, h: 2.0,
            fontSize: 32, bold: true, color: pptxTitle, fontFace: pptxFont
          });
          if (slide.subtitulo) {
            newSlide.addText(slide.subtitulo, {
              x: 0.8, y: 3.2, w: 4.8, h: 1.5,
              fontSize: 16, color: pptxText, fontFace: pptxFont
            });
          }
          // Right side cover image
          newSlide.addImage({
            path: img1,
            x: 6.0, y: 0.5, w: 3.4, h: 4.5,
            sizing: { type: "cover", w: 3.4, h: 4.5 }
          });
        } else {
          newSlide.addText(slide.titulo, {
            x: 1.0, y: 1.8, w: 8.0, h: 1.5,
            fontSize: 40, bold: true, color: pptxTitle, fontFace: pptxFont, align: "center"
          });
          if (slide.subtitulo) {
            newSlide.addText(slide.subtitulo, {
              x: 1.0, y: 3.4, w: 8.0, h: 1.0,
              fontSize: 18, color: pptxText, fontFace: pptxFont, align: "center"
            });
          }
        }
      } else if (slide.layout === "quote") {
        newSlide.addText("“", {
          x: 1.0, y: 1.2, w: 8.0, h: 0.5,
          fontSize: 60, color: pptxTitle, fontFace: pptxFont, align: "center"
        });
        newSlide.addText(slide.titulo, {
          x: 1.5, y: 1.8, w: 7.0, h: 2.2,
          fontSize: 24, italic: true, color: pptxText, fontFace: pptxFont, align: "center"
        });
        if (slide.subtitulo) {
          newSlide.addText(slide.subtitulo, {
            x: 1.5, y: 4.2, w: 7.0, h: 0.5,
            fontSize: 14, color: pptxTitle, fontFace: pptxFont, align: "center"
          });
        }
      } else if (slide.layout === "text_and_image") {
        newSlide.addText(slide.titulo, {
          x: 0.8, y: 0.5, w: 8.4, h: 0.8,
          fontSize: 28, bold: true, color: pptxTitle, fontFace: pptxFont
        });
        const textContent = slide.pontos.join("\n\n");
        newSlide.addText(textContent, {
          x: 0.8, y: 1.5, w: 4.6, h: 3.5,
          fontSize: 16, color: pptxText, fontFace: pptxFont
        });
        if (slide.imageUrl) {
          newSlide.addImage({
            path: img1,
            x: 5.8, y: 1.5, w: 3.4, h: 3.5,
            sizing: { type: "cover", w: 3.4, h: 3.5 }
          });
        }
      } else if (slide.layout === "bullet_points") {
        newSlide.addText(slide.titulo, {
          x: 0.8, y: 0.5, w: 8.4, h: 0.8,
          fontSize: 28, bold: true, color: pptxTitle, fontFace: pptxFont
        });
        const bullets = slide.pontos.map((p) => { return { text: p, options: { bullet: true, fontFace: pptxFont } }; });
        newSlide.addText(bullets, {
          x: 0.8, y: 1.5, w: 8.4, h: 3.5,
          fontSize: 16, color: pptxText, lineSpacing: 24
        });
      } else if (slide.layout === "exercise") {
        newSlide.addText(slide.titulo, {
          x: 0.8, y: 0.5, w: 8.4, h: 0.8,
          fontSize: 28, bold: true, color: pptxTitle, fontFace: pptxFont
        });
        // Draw exercise box
        newSlide.addText([
          { text: "Desafio Prático\n", options: { bold: true, fontSize: 12, color: "7C3AED" } },
          { text: (slide.pontos[0] || "") + "\n\n", options: { bold: true, fontSize: 16, color: pptxTitle } },
          ...slide.pontos.slice(1).map((p) => { return { text: `• ${p}\n`, options: { fontSize: 13, color: pptxText } }; })
        ], {
          x: 0.8, y: 1.4, w: 8.4, h: 3.4,
          fill: { color: "FFFFFF" },
          valign: "top",
          margin: [15, 15, 15, 15]
        });
      } else if (slide.layout === "summary") {
        newSlide.addText(slide.titulo, {
          x: 0.8, y: 0.5, w: 8.4, h: 0.8,
          fontSize: 28, bold: true, color: pptxTitle, fontFace: pptxFont
        });
        // 2x2 grid for points
        const points = slide.pontos.slice(0, 4);
        points.forEach((p, idx) => {
          const col = idx % 2;
          const row = Math.floor(idx / 2);
          newSlide.addText([
            { text: "✓ ", options: { bold: true, color: "10B981" } },
            { text: p, options: { fontSize: 13, color: pptxText } }
          ], {
            x: 0.8 + col * 4.3,
            y: 1.5 + row * 1.7,
            w: 4.1,
            h: 1.4,
            fill: { color: "FFFFFF" },
            valign: "middle",
            margin: [10, 10, 10, 10]
          });
        });
      } else if (slide.layout === "comparison") {
        newSlide.addText(slide.titulo, {
          x: 0.8, y: 0.4, w: 8.4, h: 0.6,
          fontSize: 26, bold: true, color: pptxTitle, fontFace: pptxFont
        });
        const parts = (slide.subtitulo || "").split("|");
        const titleA = parts[0] || "Tema A";
        const titleB = parts[1] || "Tema B";
        const textA = slide.pontos[0] || "";
        const textB = slide.pontos[1] || "";
        const conclusion = slide.pontos[2] || "";

        // Col A (Orange background)
        newSlide.addText([
          { text: titleA + "\n\n", options: { bold: true, fontSize: 16, color: "FFFFFF" } },
          { text: textA, options: { fontSize: 12, color: "FFFFFF" } }
        ], {
          x: 0.8, y: 1.1, w: 4.0, h: 3.2,
          fill: { color: "C2410C" },
          valign: "top",
          margin: [15, 15, 15, 15]
        });

        // Col B (Beige / Light background)
        newSlide.addText([
          { text: titleB + "\n\n", options: { bold: true, fontSize: 16, color: pptxTitle } },
          { text: textB, options: { fontSize: 12, color: pptxText } }
        ], {
          x: 5.2, y: 1.1, w: 4.0, h: 3.2,
          fill: { color: "FFFFFF" },
          valign: "top",
          margin: [15, 15, 15, 15]
        });

        if (conclusion) {
          newSlide.addText(conclusion, {
            x: 0.8, y: 4.5, w: 8.4, h: 0.4,
            fontSize: 12, italic: true, color: pptxText, fontFace: pptxFont, align: "center"
          });
        }
      } else if (slide.layout === "numbered_steps") {
        newSlide.addText(slide.titulo, {
          x: 0.8, y: 0.4, w: 8.4, h: 0.6,
          fontSize: 26, bold: true, color: pptxTitle, fontFace: pptxFont
        });

        const stepData = [
          { num: "1", title: slide.subtitulo || "Etapa 1", desc: slide.pontos[0] || "" },
          { num: "2", title: slide.pontos[1] || "Etapa 2", desc: slide.pontos[2] || "" },
          { num: "3", title: slide.pontos[3] || "Etapa 3", desc: slide.pontos[4] || "" }
        ];

        stepData.forEach((s, idx) => {
          // Number badge
          newSlide.addText(s.num, {
            x: 0.8, y: 1.2 + idx * 1.1, w: 0.4, h: 0.4,
            fill: { color: idx === 0 ? "7C3AED" : idx === 1 ? "9061F9" : "C084FC" },
            color: "FFFFFF", bold: true, align: "center", fontSize: 14, valign: "middle"
          });
          // Step text
          newSlide.addText([
            { text: s.title + "\n", options: { bold: true, fontSize: 13, color: pptxTitle } },
            { text: s.desc, options: { fontSize: 11, color: pptxText } }
          ], {
            x: 1.4, y: 1.2 + idx * 1.1, w: 4.2, h: 0.9,
            valign: "top"
          });
        });

        if (slide.imageUrl) {
          newSlide.addImage({
            path: img1,
            x: 5.9, y: 1.2, w: 3.3, h: 3.2,
            sizing: { type: "cover", w: 3.3, h: 3.2 }
          });
        }
      } else if (slide.layout === "timeline") {
        newSlide.addText(slide.titulo, {
          x: 0.8, y: 0.4, w: 8.4, h: 0.6,
          fontSize: 26, bold: true, color: pptxTitle, fontFace: pptxFont
        });

        // Add connecting line
        newSlide.addText("", {
          x: 1.0, y: 1.7, w: 7.0, h: 0.04,
          fill: { color: "D1D5DB" }
        });

        const timelineData = [
          { num: "1", title: slide.subtitulo || "Marco 1", desc: slide.pontos[0] || "" },
          { num: "2", title: slide.pontos[1] || "Marco 2", desc: slide.pontos[2] || "" },
          { num: "3", title: slide.pontos[3] || "Marco 3", desc: slide.pontos[4] || "" },
          { num: "4", title: slide.pontos[5] || "Marco 4", desc: slide.pontos[6] || "" }
        ];

        timelineData.forEach((s, idx) => {
          // Circle/Number badge
          newSlide.addText(s.num, {
            x: 0.9 + idx * 2.2, y: 1.45, w: 0.5, h: 0.5,
            fill: { color: "7C3AED" },
            color: "FFFFFF", bold: true, align: "center", fontSize: 12, valign: "middle"
          });
          // Milestone text
          newSlide.addText([
            { text: s.title + "\n", options: { bold: true, fontSize: 11, color: pptxTitle } },
            { text: s.desc, options: { fontSize: 9, color: pptxText } }
          ], {
            x: 0.6 + idx * 2.2, y: 2.1, w: 2.0, h: 2.0,
            align: "center",
            valign: "top"
          });
        });
      } else if (slide.layout === "split_columns") {
        newSlide.addText(slide.titulo, {
          x: 0.8, y: 0.4, w: 8.4, h: 0.6,
          fontSize: 26, bold: true, color: pptxTitle, fontFace: pptxFont
        });

        // Col 1
        newSlide.addImage({
          path: img1,
          x: 0.8, y: 1.2, w: 4.0, h: 2.0,
          sizing: { type: "cover", w: 4.0, h: 2.0 }
        });
        newSlide.addText([
          { text: (slide.subtitulo || "Tópico A") + "\n\n", options: { bold: true, fontSize: 14, color: pptxTitle } },
          { text: slide.pontos[0] || "", options: { fontSize: 11, color: pptxText } }
        ], {
          x: 0.8, y: 3.3, w: 4.0, h: 1.5,
          valign: "top"
        });

        // Col 2
        newSlide.addImage({
          path: img2,
          x: 5.2, y: 1.2, w: 4.0, h: 2.0,
          sizing: { type: "cover", w: 4.0, h: 2.0 }
        });
        newSlide.addText([
          { text: (slide.pontos[1] || "Tópico B") + "\n\n", options: { bold: true, fontSize: 14, color: pptxTitle } },
          { text: slide.pontos[2] || "", options: { fontSize: 11, color: pptxText } }
        ], {
          x: 5.2, y: 3.3, w: 4.0, h: 1.5,
          valign: "top"
        });
      } else if (slide.layout === "grid_cards") {
        newSlide.addText(slide.titulo, {
          x: 0.8, y: 0.4, w: 8.4, h: 0.6,
          fontSize: 26, bold: true, color: pptxTitle, fontFace: pptxFont
        });

        const cards = [
          { marker: "A", title: slide.subtitulo || "Recurso 1", desc: slide.pontos[0] || "" },
          { marker: "B", title: slide.pontos[1] || "Recurso 2", desc: slide.pontos[2] || "" },
          { marker: "C", title: slide.pontos[3] || "Recurso 3", desc: slide.pontos[4] || "" }
        ];

        cards.forEach((c, idx) => {
          newSlide.addText([
            { text: c.marker + "\n", options: { bold: true, fontSize: 12, color: "7C3AED" } },
            { text: c.title + "\n\n", options: { bold: true, fontSize: 14, color: pptxTitle } },
            { text: c.desc, options: { fontSize: 11, color: pptxText } }
          ], {
            x: 0.8 + idx * 2.9, y: 1.2, w: 2.6, h: 3.2,
            fill: { color: "FFFFFF" },
            valign: "top",
            margin: [10, 10, 10, 10]
          });
        });
      } else if (slide.layout === "highlight_quote") {
        newSlide.addText(slide.titulo, {
          x: 0.8, y: 0.4, w: 8.4, h: 0.6,
          fontSize: 26, bold: true, color: pptxTitle, fontFace: pptxFont
        });

        if (slide.imageUrl) {
          newSlide.addImage({
            path: img1,
            x: 0.8, y: 1.2, w: 3.4, h: 3.6,
            sizing: { type: "cover", w: 3.4, h: 3.6 }
          });
        }

        const leftOffset = slide.imageUrl ? 4.6 : 0.8;
        const rightWidth = slide.imageUrl ? 4.6 : 8.4;

        if (slide.subtitulo) {
          newSlide.addText(slide.subtitulo, {
            x: leftOffset, y: 1.2, w: rightWidth, h: 0.8,
            fontSize: 14, color: pptxText, fontFace: pptxFont, valign: "top"
          });
        }

        newSlide.addText(slide.pontos[0] || "", {
          x: leftOffset, y: 2.1, w: rightWidth, h: 2.3,
          fill: { color: "F5ECFC" },
          fontSize: 13, bold: true, italic: true, color: pptxText, fontFace: pptxFont,
          valign: "top",
          margin: [12, 12, 12, 12]
        });
      }

      // Add small branding footer
      newSlide.addText("Gerado por EduDocs.ai", {
        x: 0.8, y: 5.2, w: 3.0, h: 0.3,
        fontSize: 10, color: "7C3AED", fontFace: pptxFont
      });
    });

    pres.writeFile({ fileName: `${presentation.title.replace(/[^\w\s-]/g, "")}.pptx` });
  }

  async function handleExportPPTX() {
    if (!presentation || !slideCanvasRef.current || isExporting) return;
    const previousIndex = activeIndex;
    const exportedDeck = new pptxgen();
    exportedDeck.layout = "LAYOUT_16x9";
    exportedDeck.author = "EduDocs.ai";
    exportedDeck.subject = presentation.subject;
    exportedDeck.title = presentation.title;
    setIsExporting(true);

    try {
      for (let index = 0; index < slides.length; index += 1) {
        setActiveIndex(index);
        await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
        if (document.fonts?.ready) await document.fonts.ready;
        const canvas = slideCanvasRef.current;
        if (!canvas) throw new Error("Canvas do slide indisponível para exportação.");
        const imageData = await toPng(canvas, {
          cacheBust: true,
          pixelRatio: 2,
          backgroundColor: getPresentationTheme(activeTheme)?.colors.canvas,
          filter: (node) => {
            if (node instanceof HTMLElement && node.classList.contains("export-hidden")) {
              return false;
            }
            return true;
          }
        });
        const outputSlide = exportedDeck.addSlide();
        outputSlide.addImage({ data: imageData, x: 0, y: 0, w: 10, h: 5.625 });
        outputSlide.addNotes(slides[index]?.notas_professor || "");
      }
      const safeTitle = presentation.title.replace(/[^\p{L}\p{N}\s-]/gu, "").trim() || "apresentacao";
      await exportedDeck.writeFile({ fileName: `${safeTitle}.pptx` });
    } finally {
      setActiveIndex(previousIndex);
      setIsExporting(false);
    }
  }

  // Update slide fields helper
  function updateActiveSlide(fields: Partial<Slide>) {
    setSlides(prev => {
      const copy = [...prev];
      if (copy[activeIndex]) {
        copy[activeIndex] = { ...copy[activeIndex], ...fields };
      }
      return copy;
    });
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <div className="w-12 h-12 rounded-full border-4 border-primary-200 border-t-primary-600 animate-spin" />
        <span className="text-text-500 font-medium">Carregando workspace do slide...</span>
      </div>
    );
  }

  if (error || !presentation) {
    return (
      <div className="max-w-md mx-auto text-center py-16 bg-surface-0 border border-surface-200 rounded-xl shadow-sm">
        <AlertCircle className="w-12 h-12 text-error-500 mx-auto mb-4" />
        <h3 className="text-lg font-bold text-text-900 mb-2">Erro ao carregar</h3>
        <p className="text-sm text-text-500 mb-6">{error || "Apresentação não encontrada."}</p>
        <Link href="/dashboard/slides">
          <Button variant="outline" leftIcon={<ArrowLeft className="w-4 h-4" />}>
            Voltar para Apresentações
          </Button>
        </Link>
      </div>
    );
  }

  const theme = resolveThemeStyle(activeTheme);
  const customTheme = getPresentationTheme(activeTheme);
  const themeVariables = customTheme ? ({
    "--presentation-canvas": customTheme.colors.canvas,
    "--presentation-surface": customTheme.colors.surface,
    "--presentation-ink": customTheme.colors.ink,
    "--presentation-muted": customTheme.colors.muted,
    "--presentation-accent": customTheme.colors.accent,
    "--presentation-on-accent": customTheme.colors.onAccent,
    fontFamily: customTheme.fontFamily,
  } as React.CSSProperties) : undefined;

  return (
    <div className="h-[calc(100vh-100px)] flex flex-col -m-6 relative" style={themeVariables}>
      {/* 1. TOP BAR DE CONTROLES */}
      <div className="bg-white border-b border-surface-200 px-6 py-4 flex items-center justify-between shadow-sm shrink-0">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/slides">
            <button className="p-2 hover:bg-surface-100 rounded-lg transition-colors cursor-pointer text-text-500">
              <ArrowLeft className="w-5 h-5" />
            </button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-primary-600">
                {presentation.subject} • {presentation.grade}
              </span>
            </div>
            <h1 className="font-extrabold text-base text-text-900 leading-tight">
              {presentation.title}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Theme Selector */}
          <div className="w-48 mr-2">
            <Select value={activeTheme} onValueChange={setActiveTheme}>
              <SelectTrigger className="h-9 text-xs rounded-xl border-surface-200 bg-white hover:bg-surface-50 cursor-pointer">
                <SelectValue placeholder="Selecione o estilo" />
              </SelectTrigger>
              <SelectContent className="max-h-60 overflow-y-auto w-48">
                {(Object.keys(THEME_STYLES) as LegacyThemeType[]).map((t) => (
                  <SelectItem key={t} value={t}>
                    {THEME_STYLES[t].label}
                  </SelectItem>
                ))}
                {PRESENTATION_THEME_LIBRARY.map((item) => (
                  <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <LinkToClassroomModal
            presentationId={presentation.id}
            type="SLIDES"
            title={presentation.title}
            className="text-xs mr-1"
          />

          <Button
            variant="outline"
            size="sm"
            onClick={handleSave}
            isLoading={isSaving}
            className="text-xs"
          >
            Salvar
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsPresenterMode(true)}
            leftIcon={<Play className="w-4 h-4" />}
            className="text-xs"
          >
            Apresentar
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={handleExportPPTX}
            isLoading={isExporting}
            leftIcon={<Download className="w-4 h-4" />}
            className="text-xs shadow-sm"
          >
            Baixar PPTX
          </Button>
        </div>
      </div>

      {/* 2. AREA DE EDICAO TRIPLICE */}
      <div className="flex-1 flex overflow-hidden bg-surface-50">
        
        {/* LADO A: MINIATURAS (ESQUERDO) */}
        <div className="w-52 border-r border-surface-200 bg-white overflow-y-auto p-4 flex flex-col gap-4 shrink-0 select-none">
          <span className="text-[9px] font-bold uppercase tracking-wider text-text-400 block mb-1">
            Slides ({slides.length})
          </span>
          {slides.map((slide, idx) => {
            const slideTheme = resolveThemeStyle(activeTheme);
            const isSelected = activeIndex === idx;

            return (
              <button
                key={slide.slide_number}
                onClick={() => setActiveIndex(idx)}
                className={`w-full text-left rounded-2xl border p-2.5 transition-all relative overflow-hidden group cursor-pointer ${
                  isSelected
                    ? "border-primary-500 bg-primary-50/20 ring-1 ring-primary-500/10 shadow-sm"
                    : "border-surface-200 hover:border-surface-300 bg-white"
                }`}
              >
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between text-[9px] font-extrabold text-text-400">
                    <span>Slide {slide.slide_number}</span>
                    <span className="capitalize font-semibold text-[8px] max-w-[80px] truncate">
                      {LAYOUT_LABELS[slide.layout]}
                    </span>
                  </div>

                  {/* Miniature Slide Canvas preview */}
                  <div
                    className={`w-full aspect-[16/9] rounded-lg border shadow-sm relative overflow-hidden p-1.5 flex flex-col justify-between select-none ${slideTheme.bgClass} ${slideTheme.fontFamily}`}
                  >
                    <ThemeAtmosphere theme={customTheme} />
                    {/* Miniature header decorative */}
                    <div className="h-0.5 w-1/3 bg-current/15 rounded-full" />
                    
                    {/* Miniature Layout Representation */}
                    <div className="flex-1 flex items-center justify-center p-0.5 overflow-hidden">
                      {slide.layout === "title_slide" && (
                        <div className="w-full flex gap-1 h-full items-center">
                          <div className="flex-1 space-y-0.5">
                            <div className="h-1 bg-current/40 rounded w-4/5" />
                            <div className="h-0.5 bg-current/20 rounded w-3/5" />
                          </div>
                          <div className="w-1/3 h-full bg-current/10 rounded" />
                        </div>
                      )}
                      {slide.layout === "bullet_points" && (
                        <div className="w-full space-y-0.5 py-0.5">
                          <div className="h-1 bg-current/45 rounded w-3/4 mb-1" />
                          <div className="h-0.5 bg-current/20 rounded w-4/5" />
                          <div className="h-0.5 bg-current/20 rounded w-2/3" />
                        </div>
                      )}
                      {slide.layout === "quote" && (
                        <div className="w-full text-center space-y-0.5">
                          <span className="text-[6px] font-serif leading-none opacity-40 block">“</span>
                          <div className="h-0.5 bg-current/30 rounded w-3/4 mx-auto" />
                        </div>
                      )}
                      {slide.layout === "exercise" && (
                        <div className="w-full h-full bg-current/5 border border-current/15 rounded p-0.5 space-y-0.5">
                          <div className="h-0.5 bg-current/40 rounded w-1/3" />
                          <div className="h-0.5 bg-current/20 rounded w-4/5" />
                        </div>
                      )}
                      {slide.layout === "text_and_image" && (
                        <div className="w-full flex gap-1 h-full items-center">
                          <div className="flex-1 space-y-0.5">
                            <div className="h-1 bg-current/45 rounded w-4/5" />
                            <div className="h-0.5 bg-current/20 rounded w-2/3" />
                          </div>
                          <div className="w-1/3 h-full bg-current/15 rounded" />
                        </div>
                      )}
                      {slide.layout === "summary" && (
                        <div className="w-full grid grid-cols-2 gap-0.5">
                          <div className="h-2 bg-current/5 rounded border border-current/10" />
                          <div className="h-2 bg-current/5 rounded border border-current/10" />
                        </div>
                      )}
                      {slide.layout === "comparison" && (
                        <div className="w-full grid grid-cols-2 gap-0.5 h-full py-0.5">
                          <div className="bg-orange-600/70 rounded h-full" />
                          <div className="bg-current/10 rounded h-full" />
                        </div>
                      )}
                      {slide.layout === "numbered_steps" && (
                        <div className="w-full space-y-0.5">
                          <div className="flex gap-1 items-center">
                            <div className="w-1 h-1 bg-primary-600 rounded-sm" />
                            <div className="h-0.5 bg-current/20 rounded w-2/3" />
                          </div>
                          <div className="flex gap-1 items-center">
                            <div className="w-1 h-1 bg-primary-600 rounded-sm" />
                            <div className="h-0.5 bg-current/20 rounded w-4/5" />
                          </div>
                        </div>
                      )}
                      {slide.layout === "timeline" && (
                        <div className="w-full flex items-center justify-between gap-0.5 py-2">
                          <div className="w-1 h-1 rounded-full bg-primary-600" />
                          <div className="flex-1 h-[1px] bg-current/20 border-t border-dashed" />
                          <div className="w-1 h-1 rounded-full bg-primary-600" />
                        </div>
                      )}
                      {slide.layout === "split_columns" && (
                        <div className="w-full grid grid-cols-2 gap-1 h-full items-center">
                          <div className="h-2 bg-current/15 rounded" />
                          <div className="h-2 bg-current/15 rounded" />
                        </div>
                      )}
                      {slide.layout === "grid_cards" && (
                        <div className="w-full grid grid-cols-3 gap-0.5">
                          <div className="h-4 bg-current/5 border border-current/10 rounded" />
                          <div className="h-4 bg-current/5 border border-current/10 rounded" />
                        </div>
                      )}
                      {slide.layout === "highlight_quote" && (
                        <div className="w-full flex gap-1 h-full items-center">
                          <div className="w-1/3 h-full bg-current/15 rounded" />
                          <div className="flex-1 space-y-0.5">
                            <div className="h-0.5 bg-current/30 rounded w-full" />
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="text-[7px] font-bold text-current/60 text-center line-clamp-1">
                      {slide.titulo || "(Sem Título)"}
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* LADO B: CANVAS DO SLIDE (CENTRAL PREVIEW) */}
        <div className="flex-1 p-8 flex flex-col items-center gap-6 overflow-y-auto">
          {currentSlide ? (
            <>
              {/* CANVAS CARD */}
              <div
                ref={slideCanvasRef}
                className={`w-full max-w-4xl aspect-[16/9] rounded-2xl shadow-2xl overflow-hidden flex flex-col justify-between p-10 relative transition-all duration-300 shrink-0 ${theme.bgClass} ${theme.fontFamily}`}
              >
                {/* AI Refinement Loading Overlay */}
                <AnimatePresence>
                  {isRefining && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 bg-white/80 backdrop-blur-md z-30 flex flex-col items-center justify-center gap-4"
                    >
                      <div className="relative">
                        <div className="absolute inset-0 bg-primary-500/25 rounded-full blur-xl animate-pulse" />
                        <div className="w-14 h-14 rounded-2xl bg-white border border-primary-100 flex items-center justify-center text-primary-600 shadow-xl relative animate-spin">
                          <Sparkles className="w-7 h-7" />
                        </div>
                      </div>
                      <div className="text-center space-y-1">
                        <span className="text-xs font-black text-text-900 block animate-pulse">
                          {refineMessage}
                        </span>
                        <span className="text-[9px] text-text-450 block">
                          A IA está desenhando a aula ideal para você...
                        </span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Background theme decorative elements */}
                <ThemeBackground theme={activeTheme} />
                <ThemeAtmosphere theme={customTheme} />

                {/* Header (Hidden during export) */}
                <div className="flex justify-between items-start z-10 shrink-0 select-none export-hidden">
                  <span className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full border ${theme.badgeClass}`}>
                    Slide {currentSlide.slide_number} • {LAYOUT_LABELS[currentSlide.layout]}
                  </span>
                  <span className="text-[10px] font-bold opacity-60">EduDocs.ai</span>
                </div>

                {/* Main Content Area based on Layout */}
                <div className="flex-1 flex items-center justify-center py-4 z-10 overflow-hidden">
                  
                  {/* 1. Capa Split (title_slide) */}
                  {currentSlide.layout === "title_slide" && (
                    <div className={`w-full grid gap-8 items-center h-full ${customTheme ? compositionGridClasses[customTheme.composition] || "grid-cols-2" : "grid-cols-2"}`}>
                      <div className="flex-1 flex flex-col justify-center space-y-4">
                        <textarea
                          value={currentSlide.titulo}
                          onChange={(e) => updateActiveSlide({ titulo: e.target.value })}
                          rows={2}
                          className={`w-full bg-transparent border-b border-transparent hover:border-current/10 focus:border-current/30 focus:outline-none focus:ring-0 p-0 font-black leading-tight resize-none ${theme.titleColor} ${currentSlide.titulo.length > 50 ? 'text-2xl md:text-3xl' : 'text-3xl md:text-4xl'}`}
                          placeholder="Título do Slide"
                        />
                        <textarea
                          value={currentSlide.subtitulo || ""}
                          onChange={(e) => updateActiveSlide({ subtitulo: e.target.value })}
                          rows={2}
                          className={`w-full bg-transparent border-b border-transparent hover:border-current/10 focus:border-current/30 focus:outline-none focus:ring-0 p-0 text-sm md:text-base leading-relaxed resize-none ${theme.textColor}`}
                          placeholder="Subtítulo ou descrição curta..."
                        />
                      </div>
                      {currentSlide.imageUrl && (
                        <div className={`h-full overflow-hidden shadow-xl border border-white/20 shrink-0 relative group ${customTheme?.composition === 'organic' ? 'rounded-[38%_12%_28%_16%]' : 'rounded-xl'}`}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={getSlideImages(currentSlide).img1}
                            alt="Capa"
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setImageSearchQuery(currentSlide.palavras_chave_imagem || currentSlide.titulo || "");
                                setIsModalSearchOpen(true);
                              }}
                              className="text-xs font-bold"
                            >
                              Trocar Imagem
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* 2. Tópicos normais (bullet_points) */}
                  {currentSlide.layout === "bullet_points" && (
                    <div className="w-full max-w-3xl space-y-4">
                      <textarea
                        value={currentSlide.titulo}
                        onChange={(e) => updateActiveSlide({ titulo: e.target.value })}
                        rows={1}
                        className={`w-full bg-transparent border-b border-transparent hover:border-current/10 focus:border-current/30 focus:outline-none focus:ring-0 p-0 font-black leading-tight resize-none mb-4 ${theme.titleColor} ${currentSlide.titulo.length > 50 ? 'text-xl md:text-2xl' : 'text-2xl md:text-3xl'}`}
                        placeholder="Título do Slide"
                      />
                      <ul className="space-y-3.5 pl-2">
                        {Array.from({ length: 4 }).map((_, idx) => (
                          <li key={idx} className="flex items-start gap-3">
                            <CheckCircle2 className="w-5 h-5 text-primary-500 shrink-0 mt-1" />
                            <textarea
                              value={getPoint(idx)}
                              onChange={(e) => setPoint(idx, e.target.value)}
                              rows={1}
                              className={`w-full bg-transparent border-b border-transparent hover:border-current/10 focus:border-current/30 focus:outline-none focus:ring-0 p-0 text-sm md:text-base leading-normal resize-none ${theme.textColor}`}
                              placeholder="Adicione um ponto de conteúdo..."
                            />
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* 3. Citação (quote) */}
                  {currentSlide.layout === "quote" && (
                    <div className="text-center max-w-2xl space-y-4">
                      <span className="text-4xl leading-none font-serif block opacity-30 select-none">“</span>
                      <textarea
                        value={currentSlide.titulo}
                        onChange={(e) => updateActiveSlide({ titulo: e.target.value })}
                        rows={3}
                        className={`w-full text-center bg-transparent border-b border-transparent hover:border-current/10 focus:border-current/30 focus:outline-none focus:ring-0 p-0 text-lg md:text-xl font-semibold italic leading-relaxed resize-none ${theme.textColor}`}
                        placeholder="Escreva a citação aqui..."
                      />
                      <input
                        type="text"
                        value={currentSlide.subtitulo || ""}
                        onChange={(e) => updateActiveSlide({ subtitulo: e.target.value })}
                        className={`w-full text-center bg-transparent border-b border-transparent hover:border-current/10 focus:border-current/30 focus:outline-none focus:ring-0 p-0 text-xs md:text-sm font-bold uppercase tracking-wider ${theme.titleColor}`}
                        placeholder="— Autor / Fonte"
                      />
                    </div>
                  )}

                  {/* 4. Exercício / Desafio (exercise) */}
                  {currentSlide.layout === "exercise" && (
                    <div className="w-full max-w-3xl">
                      <textarea
                        value={currentSlide.titulo}
                        onChange={(e) => updateActiveSlide({ titulo: e.target.value })}
                        rows={1}
                        className={`w-full bg-transparent border-b border-transparent hover:border-current/10 focus:border-current/30 focus:outline-none focus:ring-0 p-0 font-black leading-tight resize-none mb-3 ${theme.titleColor} ${currentSlide.titulo.length > 50 ? 'text-xl md:text-2xl' : 'text-2xl md:text-3xl'}`}
                        placeholder="Título do Desafio"
                      />
                      <div className={`p-5 rounded-xl border ${theme.cardBgClass}`}>
                        <span className="text-[9px] font-bold uppercase tracking-widest text-primary-600 block mb-1">Desafio Prático</span>
                        <textarea
                          value={getPoint(0)}
                          onChange={(e) => setPoint(0, e.target.value)}
                          rows={2}
                          className={`w-full bg-transparent border-b border-transparent hover:border-current/10 focus:border-current/30 focus:outline-none focus:ring-0 p-0 text-sm md:text-base font-bold leading-normal resize-none mb-3 ${theme.titleColor}`}
                          placeholder="Escreva a pergunta principal..."
                        />
                        <div className="space-y-1.5 pl-2">
                          {Array.from({ length: 3 }).map((_, idx) => (
                            <div key={idx} className="flex items-center gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-primary-500 shrink-0" />
                              <textarea
                                value={getPoint(idx + 1)}
                                onChange={(e) => setPoint(idx + 1, e.target.value)}
                                rows={1}
                                className={`w-full bg-transparent border-b border-transparent hover:border-current/10 focus:border-current/30 focus:outline-none focus:ring-0 p-0 text-xs md:text-sm leading-relaxed resize-none ${theme.textColor}`}
                                placeholder={`Opção ou dica de resposta ${idx + 1}...`}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 5. Texto e Imagem (text_and_image) */}
                  {currentSlide.layout === "text_and_image" && (
                    <div className={`w-full grid gap-8 items-center h-full ${customTheme ? compositionGridClasses[customTheme.composition] || "grid-cols-2" : "grid-cols-2"}`}>
                      <div className="flex-1 flex flex-col justify-center space-y-3">
                        <textarea
                          value={currentSlide.titulo}
                          onChange={(e) => updateActiveSlide({ titulo: e.target.value })}
                          rows={1}
                          className={`w-full bg-transparent border-b border-transparent hover:border-current/10 focus:border-current/30 focus:outline-none focus:ring-0 p-0 font-black leading-tight resize-none mb-2 ${theme.titleColor} ${currentSlide.titulo.length > 50 ? 'text-xl md:text-2xl' : 'text-2xl md:text-3xl'}`}
                          placeholder="Título do Slide"
                        />
                        <ul className="space-y-3">
                          {Array.from({ length: 2 }).map((_, idx) => (
                            <li key={idx}>
                              <textarea
                                value={getPoint(idx)}
                                onChange={(e) => setPoint(idx, e.target.value)}
                                rows={2}
                                className={`w-full bg-transparent border-b border-transparent hover:border-current/10 focus:border-current/30 focus:outline-none focus:ring-0 p-0 text-sm md:text-base leading-relaxed resize-none ${theme.textColor}`}
                                placeholder="Clique para adicionar conteúdo..."
                              />
                            </li>
                          ))}
                        </ul>
                      </div>
                      {currentSlide.imageUrl && (
                        <div className={`h-full overflow-hidden shadow-xl border border-white/20 shrink-0 relative group ${customTheme?.composition === 'organic' ? 'rounded-[38%_12%_28%_16%]' : 'rounded-xl'}`}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={getSlideImages(currentSlide).img1}
                            alt="Preview"
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setImageSearchQuery(currentSlide.palavras_chave_imagem || currentSlide.titulo || "");
                                setIsModalSearchOpen(true);
                              }}
                              className="text-xs font-bold"
                            >
                              Trocar Imagem
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* 6. Summary (summary) */}
                  {currentSlide.layout === "summary" && (
                    <div className="w-full max-w-3xl space-y-4">
                      <textarea
                        value={currentSlide.titulo}
                        onChange={(e) => updateActiveSlide({ titulo: e.target.value })}
                        rows={1}
                        className={`w-full bg-transparent border-b border-transparent hover:border-current/10 focus:border-current/30 focus:outline-none focus:ring-0 p-0 font-black leading-tight resize-none mb-3 ${theme.titleColor} ${currentSlide.titulo.length > 50 ? 'text-xl md:text-2xl' : 'text-2xl md:text-3xl'}`}
                        placeholder="Recapitulando"
                      />
                      <div className="grid grid-cols-2 gap-4">
                        {Array.from({ length: 4 }).map((_, idx) => (
                          <div key={idx} className={`p-3.5 rounded-xl border flex items-start gap-2.5 ${theme.cardBgClass}`}>
                            <CheckCircle2 className="w-4.5 h-4.5 text-primary-500 shrink-0 mt-0.5" />
                            <textarea
                              value={getPoint(idx)}
                              onChange={(e) => setPoint(idx, e.target.value)}
                              rows={2}
                              className={`w-full bg-transparent border-0 focus:outline-none focus:ring-0 p-0 text-xs md:text-sm leading-normal resize-none font-semibold ${theme.textColor}`}
                              placeholder="Fato ou ponto chave de resumo..."
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 7. Comparison (comparison) */}
                  {currentSlide.layout === "comparison" && (
                    <div className="w-full max-w-3xl space-y-4">
                      <textarea
                        value={currentSlide.titulo}
                        onChange={(e) => updateActiveSlide({ titulo: e.target.value })}
                        rows={1}
                        className={`w-full bg-transparent border-b border-transparent hover:border-current/10 focus:border-current/30 focus:outline-none focus:ring-0 p-0 font-black leading-tight resize-none mb-2 ${theme.titleColor} ${currentSlide.titulo.length > 50 ? 'text-xl md:text-2xl' : 'text-2xl md:text-3xl'}`}
                        placeholder="Comparando Visões"
                      />
                      <div className="grid grid-cols-2 gap-4 flex-1">
	                        {/* Coluna 1 (Suavizada conforme diagnóstico) */}
	                        <div className={`p-4 rounded-xl border-2 border-primary-500/20 flex flex-col justify-between ${theme.cardBgClass}`}>
	                          <input
	                            type="text"
	                            value={currentSlide.subtitulo ? currentSlide.subtitulo.split("|")[0] || "" : ""}
	                            onChange={(e) => {
	                              const parts = (currentSlide.subtitulo || "").split("|");
	                              const p2 = parts[1] || "";
	                              updateActiveSlide({ subtitulo: `${e.target.value}|${p2}` });
	                            }}
	                            className={`bg-transparent border-b border-current/10 focus:outline-none focus:ring-0 p-0 text-sm font-bold w-full pb-1 mb-2 ${theme.titleColor}`}
	                            placeholder="Tema A"
	                          />
	                          <textarea
	                            value={getPoint(0)}
	                            onChange={(e) => setPoint(0, e.target.value)}
	                            rows={3}
	                            className={`bg-transparent border-0 focus:outline-none focus:ring-0 p-0 text-xs leading-relaxed resize-none ${theme.textColor}`}
	                            placeholder="Visão detalhada sobre o tema A..."
	                          />
	                        </div>
                        {/* Coluna 2 (Neutro) */}
                        <div className={`p-4 rounded-xl border flex flex-col justify-between ${theme.cardBgClass}`}>
                          <input
                            type="text"
                            value={currentSlide.subtitulo ? currentSlide.subtitulo.split("|")[1] || "" : ""}
                            onChange={(e) => {
                              const parts = (currentSlide.subtitulo || "").split("|");
                              const p1 = parts[0] || "";
                              updateActiveSlide({ subtitulo: `${p1}|${e.target.value}` });
                            }}
                            className={`bg-transparent border-b border-current/10 focus:outline-none focus:ring-0 p-0 text-sm font-bold w-full pb-1 mb-2 ${theme.titleColor}`}
                            placeholder="Tema B"
                          />
                          <textarea
                            value={getPoint(1)}
                            onChange={(e) => setPoint(1, e.target.value)}
                            rows={3}
                            className={`bg-transparent border-0 focus:outline-none focus:ring-0 p-0 text-xs leading-relaxed resize-none ${theme.textColor}`}
                            placeholder="Visão detalhada sobre o tema B..."
                          />
                        </div>
                      </div>
                      <input
                        type="text"
                        value={getPoint(2)}
                        onChange={(e) => setPoint(2, e.target.value)}
                        className={`w-full bg-transparent border-b border-transparent hover:border-current/10 focus:border-current/30 focus:outline-none focus:ring-0 p-0 text-[10px] md:text-xs text-center font-medium mt-2 ${theme.textColor}`}
                        placeholder="Nota de conclusão da comparação..."
                      />
                    </div>
                  )}

                  {/* 8. Numbered Steps (numbered_steps) */}
                  {currentSlide.layout === "numbered_steps" && (
                    <div className={`w-full grid gap-8 items-center h-full ${customTheme ? compositionGridClasses[customTheme.composition] || "grid-cols-2" : "grid-cols-2"}`}>
                      <div className="flex-1 flex flex-col justify-center space-y-3">
                        <textarea
                          value={currentSlide.titulo}
                          onChange={(e) => updateActiveSlide({ titulo: e.target.value })}
                          rows={1}
                          className={`w-full bg-transparent border-b border-transparent hover:border-current/10 focus:border-current/30 focus:outline-none focus:ring-0 p-0 font-black leading-tight resize-none mb-1 ${theme.titleColor} ${currentSlide.titulo.length > 50 ? 'text-xl md:text-2xl' : 'text-2xl md:text-3xl'}`}
                          placeholder="Progressão de Etapas"
                        />
                        <div className="space-y-3 pl-1">
                          {/* Step 1 */}
                          <div className="flex gap-3">
                            <div className="w-7 h-7 rounded-lg bg-primary-600 text-white font-bold text-xs flex items-center justify-center shrink-0 mt-1">1</div>
                            <div className="flex-1">
                              <input
                                type="text"
                                value={currentSlide.subtitulo || ""}
                                onChange={(e) => updateActiveSlide({ subtitulo: e.target.value })}
                                className={`bg-transparent border-b border-transparent hover:border-current/10 focus:border-current/30 focus:outline-none focus:ring-0 p-0 text-sm font-bold w-full ${theme.titleColor}`}
                                placeholder="Título do Passo 1"
                              />
                              <textarea
                                value={getPoint(0)}
                                onChange={(e) => setPoint(0, e.target.value)}
                                rows={1}
                                className={`bg-transparent border-0 focus:outline-none focus:ring-0 p-0 text-xs leading-normal resize-none w-full ${theme.textColor}`}
                                placeholder="Descrição do passo 1..."
                              />
                            </div>
                          </div>
                          {/* Step 2 */}
                          <div className="flex gap-3">
                            <div className="w-7 h-7 rounded-lg bg-primary-600/80 text-white font-bold text-xs flex items-center justify-center shrink-0 mt-1">2</div>
                            <div className="flex-1">
                              <input
                                type="text"
                                value={getPoint(1)}
                                onChange={(e) => setPoint(1, e.target.value)}
                                className={`bg-transparent border-b border-transparent hover:border-current/10 focus:border-current/30 focus:outline-none focus:ring-0 p-0 text-sm font-bold w-full ${theme.titleColor}`}
                                placeholder="Título do Passo 2"
                              />
                              <textarea
                                value={getPoint(2)}
                                onChange={(e) => setPoint(2, e.target.value)}
                                rows={1}
                                className={`bg-transparent border-0 focus:outline-none focus:ring-0 p-0 text-xs leading-normal resize-none w-full ${theme.textColor}`}
                                placeholder="Descrição do passo 2..."
                              />
                            </div>
                          </div>
                          {/* Step 3 */}
                          <div className="flex gap-3">
                            <div className="w-7 h-7 rounded-lg bg-primary-600/60 text-white font-bold text-xs flex items-center justify-center shrink-0 mt-1">3</div>
                            <div className="flex-1">
                              <input
                                type="text"
                                value={getPoint(3)}
                                onChange={(e) => setPoint(3, e.target.value)}
                                className={`bg-transparent border-b border-transparent hover:border-current/10 focus:border-current/30 focus:outline-none focus:ring-0 p-0 text-sm font-bold w-full ${theme.titleColor}`}
                                placeholder="Título do Passo 3"
                              />
                              <textarea
                                value={getPoint(4)}
                                onChange={(e) => setPoint(4, e.target.value)}
                                rows={1}
                                className={`bg-transparent border-0 focus:outline-none focus:ring-0 p-0 text-xs leading-normal resize-none w-full ${theme.textColor}`}
                                placeholder="Descrição do passo 3..."
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                      {currentSlide.imageUrl && (
                        <div className={`h-full overflow-hidden shadow-xl border border-white/20 shrink-0 relative group ${customTheme?.composition === 'organic' ? 'rounded-[38%_12%_28%_16%]' : 'rounded-xl'}`}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={getSlideImages(currentSlide).img1}
                            alt="Steps illustration"
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setImageSearchQuery(currentSlide.palavras_chave_imagem || currentSlide.titulo || "");
                                setIsModalSearchOpen(true);
                              }}
                              className="text-xs font-bold"
                            >
                              Trocar Imagem
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* 9. Timeline (timeline) */}
                  {currentSlide.layout === "timeline" && (
                    <div className="w-full max-w-3xl space-y-4">
                      <textarea
                        value={currentSlide.titulo}
                        onChange={(e) => updateActiveSlide({ titulo: e.target.value })}
                        rows={1}
                        className={`w-full bg-transparent border-b border-transparent hover:border-current/10 focus:border-current/30 focus:outline-none focus:ring-0 p-0 font-black leading-tight resize-none mb-1 ${theme.titleColor} ${currentSlide.titulo.length > 50 ? 'text-xl md:text-2xl' : 'text-2xl md:text-3xl'}`}
                        placeholder="Roteiro Cronológico"
                      />
                      <div className="relative flex items-start justify-between gap-2 pt-6">
                        {/* Linha pontilhada conectora horizontal */}
                        <div className="absolute top-[38px] left-[5%] right-[5%] h-[2px] border-t-2 border-dashed border-primary-500/30 z-0" />
                        
                        {/* Milestone 1 */}
                        <div className="flex-1 flex flex-col items-center text-center relative z-10">
                          <div className="w-7 h-7 rounded-full bg-primary-600 text-white font-bold text-xs flex items-center justify-center shadow-md mb-2">1</div>
                          <input
                            type="text"
                            value={currentSlide.subtitulo || ""}
                            onChange={(e) => updateActiveSlide({ subtitulo: e.target.value })}
                            className={`bg-transparent border-0 focus:outline-none focus:ring-0 p-0 text-center font-bold text-[11px] w-full ${theme.titleColor}`}
                            placeholder="Marco 1"
                          />
                          <textarea
                            value={getPoint(0)}
                            onChange={(e) => setPoint(0, e.target.value)}
                            rows={2}
                            className={`bg-transparent border-0 focus:outline-none focus:ring-0 p-0 text-center text-[10px] leading-normal resize-none w-full ${theme.textColor}`}
                            placeholder="Data/descrição..."
                          />
                        </div>
                        {/* Milestone 2 */}
                        <div className="flex-1 flex flex-col items-center text-center relative z-10">
                          <div className="w-7 h-7 rounded-full bg-primary-600 text-white font-bold text-xs flex items-center justify-center shadow-md mb-2">2</div>
                          <input
                            type="text"
                            value={getPoint(1)}
                            onChange={(e) => setPoint(1, e.target.value)}
                            className={`bg-transparent border-0 focus:outline-none focus:ring-0 p-0 text-center font-bold text-[11px] w-full ${theme.titleColor}`}
                            placeholder="Marco 2"
                          />
                          <textarea
                            value={getPoint(2)}
                            onChange={(e) => setPoint(2, e.target.value)}
                            rows={2}
                            className={`bg-transparent border-0 focus:outline-none focus:ring-0 p-0 text-center text-[10px] leading-normal resize-none w-full ${theme.textColor}`}
                            placeholder="Data/descrição..."
                          />
                        </div>
                        {/* Milestone 3 */}
                        <div className="flex-1 flex flex-col items-center text-center relative z-10">
                          <div className="w-7 h-7 rounded-full bg-primary-600 text-white font-bold text-xs flex items-center justify-center shadow-md mb-2">3</div>
                          <input
                            type="text"
                            value={getPoint(3)}
                            onChange={(e) => setPoint(3, e.target.value)}
                            className={`bg-transparent border-0 focus:outline-none focus:ring-0 p-0 text-center font-bold text-[11px] w-full ${theme.titleColor}`}
                            placeholder="Marco 3"
                          />
                          <textarea
                            value={getPoint(4)}
                            onChange={(e) => setPoint(4, e.target.value)}
                            rows={2}
                            className={`bg-transparent border-0 focus:outline-none focus:ring-0 p-0 text-center text-[10px] leading-normal resize-none w-full ${theme.textColor}`}
                            placeholder="Data/descrição..."
                          />
                        </div>
                        {/* Milestone 4 */}
                        <div className="flex-1 flex flex-col items-center text-center relative z-10">
                          <div className="w-7 h-7 rounded-full bg-primary-600 text-white font-bold text-xs flex items-center justify-center shadow-md mb-2">4</div>
                          <input
                            type="text"
                            value={getPoint(5)}
                            onChange={(e) => setPoint(5, e.target.value)}
                            className={`bg-transparent border-0 focus:outline-none focus:ring-0 p-0 text-center font-bold text-[11px] w-full ${theme.titleColor}`}
                            placeholder="Marco 4"
                          />
                          <textarea
                            value={getPoint(6)}
                            onChange={(e) => setPoint(6, e.target.value)}
                            rows={2}
                            className={`bg-transparent border-0 focus:outline-none focus:ring-0 p-0 text-center text-[10px] leading-normal resize-none w-full ${theme.textColor}`}
                            placeholder="Data/descrição..."
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 10. Split Columns (split_columns) */}
                  {currentSlide.layout === "split_columns" && (
                    <div className="w-full max-w-3xl space-y-3">
                      <textarea
                        value={currentSlide.titulo}
                        onChange={(e) => updateActiveSlide({ titulo: e.target.value })}
                        rows={1}
                        className={`w-full bg-transparent border-b border-transparent hover:border-current/10 focus:border-current/30 focus:outline-none focus:ring-0 p-0 font-black leading-tight resize-none ${theme.titleColor} ${currentSlide.titulo.length > 50 ? 'text-xl md:text-2xl' : 'text-2xl md:text-3xl'}`}
                        placeholder="Colunas de Conteúdo"
                      />
                      <div className="grid grid-cols-2 gap-4 flex-1">
                        {/* Coluna 1 */}
                        <div className={`p-3 rounded-xl border flex flex-col gap-2 ${theme.cardBgClass}`}>
                          <div className="w-full h-24 rounded-lg overflow-hidden relative group shrink-0">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={getSlideImages(currentSlide).img1}
                              alt="Col 1"
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all">
                              <button
                                onClick={() => {
                                  setActiveImageSearchIndex(0);
                                  setImageSearchQuery(currentSlide.palavras_chave_imagem || currentSlide.titulo || "");
                                  // Open modal and bind selection to image 0 (split)
                                  setIsModalSearchOpen(true);
                                }}
                                className="bg-white/95 text-[9px] font-bold uppercase py-1 px-2 rounded"
                              >
                                Trocar Foto
                              </button>
                            </div>
                          </div>
                          <input
                            type="text"
                            value={currentSlide.subtitulo || ""}
                            onChange={(e) => updateActiveSlide({ subtitulo: e.target.value })}
                            className={`bg-transparent border-b border-transparent hover:border-current/10 focus:border-current/30 focus:outline-none focus:ring-0 p-0 text-xs font-bold w-full ${theme.titleColor}`}
                            placeholder="Título Tópico A"
                          />
                          <textarea
                            value={getPoint(0)}
                            onChange={(e) => setPoint(0, e.target.value)}
                            rows={2}
                            className={`bg-transparent border-0 focus:outline-none focus:ring-0 p-0 text-[10px] leading-normal resize-none w-full ${theme.textColor}`}
                            placeholder="Descrição complementar..."
                          />
                        </div>
                        {/* Coluna 2 */}
                        <div className={`p-3 rounded-xl border flex flex-col gap-2 ${theme.cardBgClass}`}>
                          <div className="w-full h-24 rounded-lg overflow-hidden relative group shrink-0">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={getSlideImages(currentSlide).img2}
                              alt="Col 2"
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all">
                              <button
                                onClick={() => {
                                  setActiveImageSearchIndex(1);
                                  setImageSearchQuery(getPoint(1) || currentSlide.titulo || "");
                                  // Open modal and bind selection to image 1
                                  setIsModalSearchOpen(true);
                                }}
                                className="bg-white/95 text-[9px] font-bold uppercase py-1 px-2 rounded"
                              >
                                Trocar Foto
                              </button>
                            </div>
                          </div>
                          <input
                            type="text"
                            value={getPoint(1)}
                            onChange={(e) => setPoint(1, e.target.value)}
                            className={`bg-transparent border-b border-transparent hover:border-current/10 focus:border-current/30 focus:outline-none focus:ring-0 p-0 text-xs font-bold w-full ${theme.titleColor}`}
                            placeholder="Título Tópico B"
                          />
                          <textarea
                            value={getPoint(2)}
                            onChange={(e) => setPoint(2, e.target.value)}
                            rows={2}
                            className={`bg-transparent border-0 focus:outline-none focus:ring-0 p-0 text-[10px] leading-normal resize-none w-full ${theme.textColor}`}
                            placeholder="Descrição complementar..."
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 11. Grid Cards (grid_cards) */}
                  {currentSlide.layout === "grid_cards" && (
                    <div className="w-full max-w-3xl space-y-4">
                      <textarea
                        value={currentSlide.titulo}
                        onChange={(e) => updateActiveSlide({ titulo: e.target.value })}
                        rows={1}
                        className={`w-full bg-transparent border-b border-transparent hover:border-current/10 focus:border-current/30 focus:outline-none focus:ring-0 p-0 font-black leading-tight resize-none mb-1 ${theme.titleColor} ${currentSlide.titulo.length > 50 ? 'text-xl md:text-2xl' : 'text-2xl md:text-3xl'}`}
                        placeholder="Grade de Informações"
                      />
                      <div className="grid grid-cols-3 gap-3">
                        {/* Card 1 */}
                        <div className={`p-4 rounded-xl border flex flex-col justify-between ${theme.cardBgClass}`}>
                          <div className="w-7 h-7 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-xs font-bold mb-2">A</div>
                          <input
                            type="text"
                            value={currentSlide.subtitulo || ""}
                            onChange={(e) => updateActiveSlide({ subtitulo: e.target.value })}
                            className={`bg-transparent border-b border-transparent hover:border-current/10 focus:border-current/30 focus:outline-none focus:ring-0 p-0 text-xs font-bold w-full ${theme.titleColor}`}
                            placeholder="Recurso 1"
                          />
                          <textarea
                            value={getPoint(0)}
                            onChange={(e) => setPoint(0, e.target.value)}
                            rows={2}
                            className={`bg-transparent border-0 focus:outline-none focus:ring-0 p-0 text-[10px] leading-relaxed resize-none w-full mt-1.5 ${theme.textColor}`}
                            placeholder="Descrição..."
                          />
                        </div>
                        {/* Card 2 */}
                        <div className={`p-4 rounded-xl border flex flex-col justify-between ${theme.cardBgClass}`}>
                          <div className="w-7 h-7 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-xs font-bold mb-2">B</div>
                          <input
                            type="text"
                            value={getPoint(1)}
                            onChange={(e) => setPoint(1, e.target.value)}
                            className={`bg-transparent border-b border-transparent hover:border-current/10 focus:border-current/30 focus:outline-none focus:ring-0 p-0 text-xs font-bold w-full ${theme.titleColor}`}
                            placeholder="Recurso 2"
                          />
                          <textarea
                            value={getPoint(2)}
                            onChange={(e) => setPoint(2, e.target.value)}
                            rows={2}
                            className={`bg-transparent border-0 focus:outline-none focus:ring-0 p-0 text-[10px] leading-relaxed resize-none w-full mt-1.5 ${theme.textColor}`}
                            placeholder="Descrição..."
                          />
                        </div>
                        {/* Card 3 */}
                        <div className={`p-4 rounded-xl border flex flex-col justify-between ${theme.cardBgClass}`}>
                          <div className="w-7 h-7 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-xs font-bold mb-2">C</div>
                          <input
                            type="text"
                            value={getPoint(3)}
                            onChange={(e) => setPoint(3, e.target.value)}
                            className={`bg-transparent border-b border-transparent hover:border-current/10 focus:border-current/30 focus:outline-none focus:ring-0 p-0 text-xs font-bold w-full ${theme.titleColor}`}
                            placeholder="Recurso 3"
                          />
                          <textarea
                            value={getPoint(4)}
                            onChange={(e) => setPoint(4, e.target.value)}
                            rows={2}
                            className={`bg-transparent border-0 focus:outline-none focus:ring-0 p-0 text-[10px] leading-relaxed resize-none w-full mt-1.5 ${theme.textColor}`}
                            placeholder="Descrição..."
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 12. Highlight Quote (highlight_quote) */}
                  {currentSlide.layout === "highlight_quote" && (
                    <div className={`w-full grid gap-8 items-center h-full ${customTheme ? compositionGridClasses[customTheme.composition] || "grid-cols-2" : "grid-cols-2"}`}>
                      {currentSlide.imageUrl && (
                        <div className={`h-full overflow-hidden shadow-xl border border-white/20 shrink-0 relative group ${customTheme?.composition === 'organic' ? 'rounded-[38%_12%_28%_16%]' : 'rounded-xl'}`}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={getSlideImages(currentSlide).img1}
                            alt="Highlight quote illustration"
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setImageSearchQuery(currentSlide.palavras_chave_imagem || currentSlide.titulo || "");
                                setIsModalSearchOpen(true);
                              }}
                              className="text-xs font-bold"
                            >
                              Trocar Imagem
                            </Button>
                          </div>
                        </div>
                      )}
                      <div className="flex-1 flex flex-col justify-center space-y-3">
                        <textarea
                          value={currentSlide.titulo}
                          onChange={(e) => updateActiveSlide({ titulo: e.target.value })}
                          rows={1}
                          className={`w-full bg-transparent border-b border-transparent hover:border-current/10 focus:border-current/30 focus:outline-none focus:ring-0 p-0 font-black leading-tight resize-none ${theme.titleColor} ${currentSlide.titulo.length > 50 ? 'text-xl md:text-2xl' : 'text-2xl md:text-3xl'}`}
                          placeholder="Fato Relevante"
                        />
                        <textarea
                          value={currentSlide.subtitulo || ""}
                          onChange={(e) => updateActiveSlide({ subtitulo: e.target.value })}
                          rows={2}
                          className={`w-full bg-transparent border-b border-transparent hover:border-current/10 focus:border-current/30 focus:outline-none focus:ring-0 p-0 text-xs md:text-sm leading-normal resize-none ${theme.textColor}`}
                          placeholder="Introdução..."
                        />
                        <div className={`p-4 rounded-xl border-l-4 border-primary-500 bg-primary-500/5 ${theme.cardBgClass}`}>
                          <textarea
                            value={getPoint(0)}
                            onChange={(e) => setPoint(0, e.target.value)}
                            rows={3}
                            className={`w-full bg-transparent border-0 focus:outline-none focus:ring-0 p-0 text-xs md:text-sm leading-relaxed resize-none font-semibold ${theme.textColor}`}
                            placeholder="Escreva a citação de destaque ou nota reflexiva aqui..."
                          />
                        </div>
                      </div>
                    </div>
                  )}

                </div>

                {/* Footer (Hidden during export) */}
                <div className="flex justify-between items-center text-[9px] opacity-60 z-10 shrink-0 border-t border-current/10 pt-3 select-none export-hidden">
                  <span>Tema: {presentation.topic}</span>
                  <span>{activeIndex + 1} / {slides.length}</span>
                </div>

              </div>

              {/* CONTROLES ABAIXO DO CANVAS */}
              <div className="w-full max-w-4xl flex items-center justify-between bg-white border border-surface-200 rounded-xl p-3 shadow-sm select-none shrink-0">
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={activeIndex === 0}
                    onClick={() => setActiveIndex(prev => Math.max(0, prev - 1))}
                    leftIcon={<ChevronLeft className="w-4 h-4" />}
                  >
                    Anterior
                  </Button>
                  <span className="text-xs text-text-500 font-semibold">
                    Slide {activeIndex + 1} de {slides.length}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={activeIndex === slides.length - 1}
                    onClick={() => setActiveIndex(prev => Math.min(slides.length - 1, prev + 1))}
                    rightIcon={<ChevronRight className="w-4 h-4" />}
                  >
                    Próximo
                  </Button>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsSpeakerNotesOpen(!isSpeakerNotesOpen)}
                    leftIcon={<MessageSquare className="w-4 h-4" />}
                  >
                    {isSpeakerNotesOpen ? "Ocultar Notas" : "Mostrar Notas Pedagógicas"}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={addSlide}
                    leftIcon={<Plus className="w-4 h-4" />}
                  >
                    Novo Slide
                  </Button>
                </div>
              </div>

              {/* SPEAKER NOTES COLLAPSIBLE DRAWER */}
              {isSpeakerNotesOpen && (
                <div className="w-full max-w-4xl bg-white border border-surface-200 rounded-xl p-5 shadow-sm space-y-3 shrink-0">
                  <div className="flex items-center gap-2 text-primary-600">
                    <MessageSquare className="w-4 h-4" />
                    <span className="text-xs font-bold uppercase tracking-wider">Notas Pedagógicas & Roteiro do Professor</span>
                  </div>
                  <Textarea
                    value={currentSlide.notas_professor}
                    onChange={(e) => updateActiveSlide({ notas_professor: e.target.value })}
                    className="min-h-[100px] text-xs leading-relaxed"
                    placeholder="Escreva notas, roteiro de aula ou orientações BNCC para este slide..."
                  />
                </div>
              )}
            </>
          ) : (
            <div className="text-text-400">Nenhum slide selecionado.</div>
          )}
        </div>

        {/* LADO C: EDITOR E AJUSTES DE SLIDE (DIREITO) */}
        {currentSlide && (
          <div className="w-80 border-l border-surface-200 bg-white flex flex-col shrink-0">
            {/* Tabs Header */}
            <div className="flex border-b border-surface-200 select-none shrink-0">
              <button
                onClick={() => setRightTab("edit")}
                className={`flex-1 py-3 text-center text-xs font-bold transition-all border-b-2 cursor-pointer ${
                  rightTab === "edit"
                    ? "border-primary-500 text-primary-600"
                    : "border-transparent text-text-500 hover:text-text-800"
                }`}
              >
                Editar Conteúdo
              </button>
              <button
                onClick={() => setRightTab("ai")}
                className={`flex-1 py-3 text-center text-xs font-bold transition-all border-b-2 cursor-pointer ${
                  rightTab === "ai"
                    ? "border-primary-500 text-primary-600"
                    : "border-transparent text-text-500 hover:text-text-800"
                }`}
              >
                Assistente IA ✨
              </button>
            </div>

            {/* Tab Contents */}
            <div className="flex-1 p-5 flex flex-col gap-5 overflow-y-auto">
              {rightTab === "edit" ? (
                <>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-text-400 block mb-2">
                      Layout do Slide
                    </span>
                    <select
                      value={currentSlide.layout}
                      onChange={(e) => updateActiveSlide({ layout: e.target.value as SlideLayout })}
                      className="w-full h-10 px-3 bg-surface-0 border border-surface-200 rounded-lg text-xs text-text-800 focus:outline-none focus:ring-1 focus:ring-primary-500 font-semibold"
                    >
                      {(Object.keys(LAYOUT_LABELS) as SlideLayout[]).map((lay) => (
                        <option key={lay} value={lay}>{LAYOUT_LABELS[lay]}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-4">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-text-400 block">
                      Conteúdo do Slide
                    </span>
                    
                    <div>
                      <label className="block text-[10px] font-bold text-text-500 uppercase mb-1">Título</label>
                      <Input
                        value={currentSlide.titulo}
                        onChange={(e) => updateActiveSlide({ titulo: e.target.value })}
                        className="h-10 text-xs bg-white"
                      />
                    </div>

                    {(currentSlide.layout === "title_slide" || currentSlide.layout === "quote") && (
                      <div>
                        <label className="block text-[10px] font-bold text-text-500 uppercase mb-1">Subtítulo / Autor</label>
                        <Input
                          value={currentSlide.subtitulo || ""}
                          onChange={(e) => updateActiveSlide({ subtitulo: e.target.value })}
                          className="h-10 text-xs bg-white"
                        />
                      </div>
                    )}

                    {currentSlide.layout !== "title_slide" && currentSlide.layout !== "quote" && (
                      <div>
                        <label className="block text-[10px] font-bold text-text-500 uppercase mb-1 flex items-center justify-between">
                          <span>Pontos / Parágrafos</span>
                          <button
                            onClick={() => {
                              const newPoints = [...currentSlide.pontos, "Novo marcador"];
                              updateActiveSlide({ pontos: newPoints });
                            }}
                            className="p-1 hover:bg-surface-100 rounded text-primary-600 transition-colors"
                            title="Adicionar ponto"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </label>
                        
                        <div className="space-y-2 mt-1">
                          {currentSlide.pontos.map((pt, index) => (
                            <div key={index} className="flex items-center gap-1">
                              <Input
                                value={pt}
                                onChange={(e) => {
                                  const copy = [...currentSlide.pontos];
                                  copy[index] = e.target.value;
                                  updateActiveSlide({ pontos: copy });
                                }}
                                className="h-9 text-xs bg-white"
                              />
                              <button
                                onClick={() => {
                                  const copy = currentSlide.pontos.filter((_, i) => i !== index);
                                  updateActiveSlide({ pontos: copy });
                                }}
                                className="p-1 text-text-400 hover:text-error-500 rounded"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-text-400 block mb-2 flex items-center gap-1">
                      <Info className="w-3.5 h-3.5 text-primary-500" />
                      Notas do Professor (Roteiro)
                    </span>
                    <Textarea
                      value={currentSlide.notas_professor}
                      onChange={(e) => updateActiveSlide({ notas_professor: e.target.value })}
                      className="min-h-[100px] text-xs bg-white leading-relaxed resize-none"
                      placeholder="Roteiro de fala e notas para o professor utilizar em sala de aula..."
                    />
                  </div>

                  {/* FOTOS DE BANCO AUTOMATICAS / SUBSTITUICAO */}
                  <div className="border-t border-surface-200 pt-5 space-y-4">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-text-400 block flex items-center gap-1.5">
                      <ImageIcon className="w-4 h-4 text-primary-500" />
                      Imagem do Slide (Unsplash)
                    </span>

                    {currentSlide.imageUrl && (
                      <div className="w-full aspect-[16/10] rounded-lg overflow-hidden border border-surface-200 relative group">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={currentSlide.imageUrl}
                          alt={currentSlide.titulo}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all">
                          <span className="text-[10px] font-extrabold text-white uppercase tracking-wider">Foto em uso</span>
                        </div>
                      </div>
                    )}

                    {/* Buscar nova foto */}
                    <div className="space-y-2">
                      <label className="block text-[9px] font-bold text-text-500 uppercase">Pesquisar fotos alternativas</label>
                      <div className="flex gap-1.5">
                        <Input
                          value={imageSearchQuery}
                          onChange={(e) => setImageSearchQuery(e.target.value)}
                          placeholder="Ex: 'cell structure lab' (em inglês)"
                          className="h-8.5 text-xs bg-white"
                        />
                        <Button
                          size="sm"
                          onClick={handleImageSearch}
                          isLoading={isSearchingImages}
                          className="px-2.5 h-8.5"
                        >
                          <Search className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>

                    {/* Resultados da busca */}
                    {searchResults.length > 0 && (
                      <div className="grid grid-cols-3 gap-1.5 max-h-[140px] overflow-y-auto p-1 bg-surface-50 rounded-lg border border-surface-200">
                        {searchResults.map((url, idx) => (
                          <button
                            key={idx}
                            onClick={() => selectImage(url)}
                            className="w-full aspect-square rounded overflow-hidden border hover:border-primary-500 hover:ring-2 hover:ring-primary-500/20 transition-all cursor-pointer"
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={url} alt="resultado" className="w-full h-full object-cover" />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <>
                  {/* AI Assistant tab content */}
                  <div className="space-y-3">
                    <label className="block text-[10px] font-bold text-text-700 uppercase">
                      Como deseja alterar este slide com IA?
                    </label>
                    <Textarea
                      value={aiInstruction}
                      onChange={(e) => setAiInstruction(e.target.value)}
                      placeholder="Ex: Simplifique a linguagem para o 4º ano, crie um desafio prático de múltipla escolha..."
                      className="min-h-[100px] text-xs bg-white resize-none rounded-xl"
                    />
                    <Button
                      onClick={() => handleAIRefine(aiInstruction)}
                      disabled={!aiInstruction.trim() || isRefining}
                      variant="primary"
                      size="sm"
                      className="w-full text-xs font-bold justify-center rounded-xl h-10 shadow-sm"
                      leftIcon={<Sparkles className="w-4 h-4 animate-pulse" />}
                    >
                      Refinar com IA
                    </Button>
                  </div>

                  <div className="space-y-2 select-none pt-4 border-t border-surface-150">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-text-400 block">
                      Ações Sugeridas (IA)
                    </span>
                    <div className="flex flex-col gap-2">
                      {[
                        {
                          label: "🪄 Simplificar Conteúdo",
                          text: "Simplifique o texto deste slide, tornando os tópicos mais concisos e fáceis de ler para esta série.",
                        },
                        {
                          label: "💡 Criar Desafio Prático",
                          text: "Adicione um desafio interativo ou pergunta prática baseada no conteúdo atual deste slide.",
                        },
                        {
                          label: "📝 Expandir Explicação",
                          text: "Aprofunde a explicação deste conceito adicionando mais detalhes pedagógicos nos pontos.",
                        },
                        {
                          label: "🎯 Vincular à BNCC",
                          text: "Adicione sugestões explícitas de habilidades BNCC correlacionadas nas notas do professor.",
                        },
                        {
                          label: "🎨 Focar no Visual",
                          text: "Reestruture este slide para focar em termos mais visuais, sugerindo termos de imagem mais descritivos.",
                        },
                      ].map((chip, idx) => (
                        <button
                          key={idx}
                          onClick={() => {
                            setAiInstruction(chip.text);
                            handleAIRefine(chip.text);
                          }}
                          className="w-full text-left p-3 rounded-xl border border-surface-200 hover:border-primary-300 hover:bg-primary-50/20 text-xs font-bold text-text-700 transition-all cursor-pointer flex items-center justify-between group"
                        >
                          <span>{chip.label}</span>
                          <Sparkles className="w-3.5 h-3.5 text-primary-500 opacity-60 group-hover:opacity-100 group-hover:scale-110 transition-all" />
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 3. PRESENTER MODE (TELA CHEIA INTERATIVA) */}
      <AnimatePresence>
        {isPresenterMode && (
          <motion.div
            className={`fixed inset-0 z-50 flex flex-col justify-between p-12 transition-all duration-300 ${theme.bgClass} ${theme.fontFamily}`}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
          >
            {/* Background theme decorative elements */}
            <ThemeBackground theme={activeTheme} />
            <ThemeAtmosphere theme={customTheme} />
            {/* Header Presenter */}
            <div className="flex justify-between items-center shrink-0">
              <div className="flex items-center gap-3">
                <span className={`text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full border ${theme.badgeClass}`}>
                  Slide {activeIndex + 1} de {slides.length}
                </span>
                <span className="text-xs font-bold opacity-60">{presentation.title}</span>
              </div>
              <button
                onClick={() => setIsPresenterMode(false)}
                className="p-2 hover:bg-black/10 rounded-full transition-colors cursor-pointer text-current"
                title="Sair da apresentação"
              >
                <Minimize2 className="w-6 h-6" />
              </button>
            </div>

            {/* Presenter Canvas Content */}
            <div className="flex-1 flex items-center justify-center py-10">
              {currentSlide && (
                <motion.div
                  key={activeIndex}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="w-full max-w-5xl"
                >
                  {/* Capa Split (title_slide) */}
                  {currentSlide.layout === "title_slide" && (
                    <div className="w-full">
                      {currentSlide.imageUrl ? (
                        <div className={`grid gap-12 items-center justify-between ${customTheme ? compositionGridClasses[customTheme.composition] || "grid-cols-2" : "grid-cols-2"}`}>
                          <div className="flex-1 space-y-6">
                            <h1 className={`text-5xl md:text-6xl font-black leading-tight ${theme.titleColor}`}>
                              {currentSlide.titulo}
                            </h1>
                            {currentSlide.subtitulo && (
                              <p className={`text-lg md:text-xl leading-relaxed ${theme.textColor}`}>
                                {currentSlide.subtitulo}
                              </p>
                            )}
                          </div>
                          <div className="w-72 md:w-96 aspect-[3/4] rounded-2xl overflow-hidden shadow-2xl border border-white/20 shrink-0">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={getSlideImages(currentSlide).img1}
                              alt="Capa"
                              className="w-full h-full object-cover"
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="text-center max-w-4xl space-y-6 mx-auto">
                          <h1 className={`text-5xl md:text-7xl font-black leading-tight ${theme.titleColor}`}>
                            {currentSlide.titulo}
                          </h1>
                          {currentSlide.subtitulo && (
                            <p className={`text-xl md:text-2xl leading-relaxed ${theme.textColor}`}>
                              {currentSlide.subtitulo}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Lista de Tópicos (bullet_points) */}
                  {currentSlide.layout === "bullet_points" && (
                    <div className="w-full max-w-4xl space-y-6 mx-auto">
                      <h2 className={`text-4xl md:text-5xl font-black leading-tight mb-8 border-b pb-4 ${theme.titleColor} border-current/10`}>
                        {currentSlide.titulo}
                      </h2>
                      <ul className="space-y-6 pl-4">
                        {currentSlide.pontos.map((pt, idx) => (
                          <li key={idx} className="flex items-start gap-4">
                            <CheckCircle2 className="w-7 h-7 text-primary-500 shrink-0 mt-1" />
                            <span className={`text-xl md:text-2xl leading-relaxed ${theme.textColor}`}>
                              {pt}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Citação (quote) */}
                  {currentSlide.layout === "quote" && (
                    <div className="text-center max-w-3xl space-y-8 mx-auto">
                      <span className="text-7xl leading-none font-serif block opacity-30 select-none">“</span>
                      <blockquote className={`text-2xl md:text-3xl font-semibold italic leading-relaxed ${theme.textColor}`}>
                        {currentSlide.titulo}
                      </blockquote>
                      {currentSlide.subtitulo && (
                        <cite className={`text-lg md:text-xl font-bold uppercase tracking-wider block not-italic ${theme.titleColor}`}>
                          — {currentSlide.subtitulo}
                        </cite>
                      )}
                    </div>
                  )}

                  {/* Exercício (exercise) */}
                  {currentSlide.layout === "exercise" && (
                    <div className="w-full max-w-4xl mx-auto space-y-6">
                      <h2 className={`text-4xl md:text-5xl font-black leading-tight mb-8 border-b pb-4 ${theme.titleColor} border-current/10`}>
                        {currentSlide.titulo}
                      </h2>
                      <div className={`p-8 rounded-2xl border shadow-xl ${theme.cardBgClass}`}>
                        <span className="text-xs font-bold uppercase tracking-widest text-primary-600 block mb-3">Atividade de Sala</span>
                        <p className={`text-xl md:text-2xl font-bold leading-relaxed ${theme.titleColor} mb-6`}>
                          {currentSlide.pontos[0] || "Responda à questão sugerida pelo professor."}
                        </p>
                        <div className="space-y-3 pl-4">
                          {currentSlide.pontos.slice(1).map((p, idx) => (
                            <div key={idx} className={`text-base md:text-lg leading-relaxed ${theme.textColor} flex items-center gap-3`}>
                              <span className="w-2 h-2 rounded-full bg-primary-500 shrink-0" />
                              <span>{p}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Texto e Imagem (text_and_image) */}
                  {currentSlide.layout === "text_and_image" && (
                    <div className="w-full flex flex-col md:flex-row gap-12 items-center justify-between">
                      <div className="flex-1 space-y-6">
                        <h2 className={`text-3xl md:text-4xl font-black leading-tight border-b pb-4 ${theme.titleColor} border-current/10`}>
                          {currentSlide.titulo}
                        </h2>
                        <div className="space-y-4">
                          {currentSlide.pontos.map((p, idx) => (
                            <p key={idx} className={`text-lg md:text-xl leading-relaxed ${theme.textColor}`}>
                              {p}
                            </p>
                          ))}
                        </div>
                      </div>
                      {currentSlide.imageUrl && (
                        <div className={`aspect-square overflow-hidden shadow-2xl border border-white/20 shrink-0 ${customTheme?.composition === 'organic' ? 'rounded-[38%_12%_28%_16%]' : 'rounded-2xl'}`}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={getSlideImages(currentSlide).img1}
                            alt={currentSlide.titulo}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                    </div>
                  )}

                  {/* Summary (summary) */}
                  {currentSlide.layout === "summary" && (
                    <div className="w-full max-w-4xl mx-auto space-y-6">
                      <h2 className={`text-4xl md:text-5xl font-black leading-tight mb-8 border-b pb-4 ${theme.titleColor} border-current/10`}>
                        {currentSlide.titulo}
                      </h2>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {currentSlide.pontos.map((pt, idx) => (
                          <div key={idx} className={`p-6 rounded-2xl border flex items-start gap-4 shadow-md ${theme.cardBgClass}`}>
                            <CheckCircle2 className="w-6 h-6 text-primary-500 shrink-0 mt-0.5" />
                            <span className={`text-base leading-normal font-semibold ${theme.textColor}`}>
                              {pt}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Comparison (comparison) */}
                  {currentSlide.layout === "comparison" && (
                    <div className="w-full max-w-4xl space-y-6 mx-auto">
                      <h2 className={`text-4xl md:text-5xl font-black leading-tight mb-8 border-b pb-4 ${theme.titleColor} border-current/10`}>
                        {currentSlide.titulo}
                      </h2>
                      <div className="grid grid-cols-2 gap-6">
	                        {/* Coluna 1 (Suavizada conforme diagnóstico) */}
	                        <div className={`p-6 rounded-2xl border-2 border-primary-500/20 flex flex-col min-h-[220px] justify-between shadow-lg ${theme.cardBgClass}`}>
	                          <div>
	                            <h3 className={`text-xl font-bold border-b border-current/10 pb-2 mb-3 ${theme.titleColor}`}>
	                              {currentSlide.subtitulo ? currentSlide.subtitulo.split("|")[0] || "" : ""}
	                            </h3>
	                            <p className={`text-base leading-relaxed whitespace-pre-line ${theme.textColor}`}>
	                              {getPoint(0)}
	                            </p>
	                          </div>
	                        </div>
                        {/* Coluna 2 (Neutro) */}
                        <div className={`p-6 rounded-2xl border flex flex-col min-h-[220px] justify-between shadow-md ${theme.cardBgClass}`}>
                          <div>
                            <h3 className={`text-xl font-bold border-b border-current/10 pb-2 mb-3 ${theme.titleColor}`}>
                              {currentSlide.subtitulo ? currentSlide.subtitulo.split("|")[1] || "" : ""}
                            </h3>
                            <p className={`text-base leading-relaxed whitespace-pre-line ${theme.textColor}`}>
                              {getPoint(1)}
                            </p>
                          </div>
                        </div>
                      </div>
                      {getPoint(2) && (
                        <p className={`text-center text-sm md:text-base font-medium mt-4 ${theme.textColor}`}>
                          {getPoint(2)}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Numbered Steps (numbered_steps) */}
                  {currentSlide.layout === "numbered_steps" && (
                    <div className="w-full max-w-5xl mx-auto flex flex-col md:flex-row gap-12 items-center justify-between">
                      <div className="flex-1 space-y-6">
                        <h2 className={`text-3xl md:text-4xl font-black leading-tight border-b pb-4 ${theme.titleColor} border-current/10`}>
                          {currentSlide.titulo}
                        </h2>
                        <div className="space-y-5">
                          {/* Step 1 */}
                          <div className="flex gap-4">
                            <div className="w-8 h-8 rounded-lg bg-primary-600 text-white font-bold text-sm flex items-center justify-center shrink-0 mt-1">1</div>
                            <div>
                              <h3 className={`text-lg font-bold ${theme.titleColor}`}>{currentSlide.subtitulo || ""}</h3>
                              <p className={`text-sm md:text-base leading-relaxed ${theme.textColor}`}>{getPoint(0)}</p>
                            </div>
                          </div>
                          {/* Step 2 */}
                          {(getPoint(1) || getPoint(2)) && (
                            <div className="flex gap-4">
                              <div className="w-8 h-8 rounded-lg bg-primary-600/80 text-white font-bold text-sm flex items-center justify-center shrink-0 mt-1">2</div>
                              <div>
                                <h3 className={`text-lg font-bold ${theme.titleColor}`}>{getPoint(1)}</h3>
                                <p className={`text-sm md:text-base leading-relaxed ${theme.textColor}`}>{getPoint(2)}</p>
                              </div>
                            </div>
                          )}
                          {/* Step 3 */}
                          {(getPoint(3) || getPoint(4)) && (
                            <div className="flex gap-4">
                              <div className="w-8 h-8 rounded-lg bg-primary-600/60 text-white font-bold text-sm flex items-center justify-center shrink-0 mt-1">3</div>
                              <div>
                                <h3 className={`text-lg font-bold ${theme.titleColor}`}>{getPoint(3)}</h3>
                                <p className={`text-sm md:text-base leading-relaxed ${theme.textColor}`}>{getPoint(4)}</p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                      {currentSlide.imageUrl && (
                        <div className="w-72 md:w-96 aspect-[3/4] rounded-2xl overflow-hidden shadow-2xl border border-white/20 shrink-0">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={getSlideImages(currentSlide).img1}
                            alt={currentSlide.titulo}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                    </div>
                  )}

                  {/* Timeline (timeline) */}
                  {currentSlide.layout === "timeline" && (
                    <div className="w-full max-w-4xl mx-auto space-y-8">
                      <h2 className={`text-4xl md:text-5xl font-black leading-tight mb-8 border-b pb-4 ${theme.titleColor} border-current/10`}>
                        {currentSlide.titulo}
                      </h2>
                      <div className="relative flex items-start justify-between gap-4 pt-8">
                        {/* Connector Line */}
                        <div className="absolute top-[44px] left-[8%] right-[8%] h-[2px] border-t-2 border-dashed border-primary-500/30 z-0" />
                        
                        {/* Milestone 1 */}
                        <div className="flex-1 flex flex-col items-center text-center relative z-10">
                          <div className="w-9 h-9 rounded-full bg-primary-600 text-white font-bold text-sm flex items-center justify-center shadow-md mb-3">1</div>
                          <h3 className={`font-bold text-sm md:text-base ${theme.titleColor}`}>{currentSlide.subtitulo || ""}</h3>
                          <p className={`text-xs md:text-sm leading-relaxed ${theme.textColor}`}>{getPoint(0)}</p>
                        </div>
                        
                        {/* Milestone 2 */}
                        <div className="flex-1 flex flex-col items-center text-center relative z-10">
                          <div className="w-9 h-9 rounded-full bg-primary-600 text-white font-bold text-sm flex items-center justify-center shadow-md mb-3">2</div>
                          <h3 className={`font-bold text-sm md:text-base ${theme.titleColor}`}>{getPoint(1)}</h3>
                          <p className={`text-xs md:text-sm leading-relaxed ${theme.textColor}`}>{getPoint(2)}</p>
                        </div>

                        {/* Milestone 3 */}
                        <div className="flex-1 flex flex-col items-center text-center relative z-10">
                          <div className="w-9 h-9 rounded-full bg-primary-600 text-white font-bold text-sm flex items-center justify-center shadow-md mb-3">3</div>
                          <h3 className={`font-bold text-sm md:text-base ${theme.titleColor}`}>{getPoint(3)}</h3>
                          <p className={`text-xs md:text-sm leading-relaxed ${theme.textColor}`}>{getPoint(4)}</p>
                        </div>

                        {/* Milestone 4 */}
                        <div className="flex-1 flex flex-col items-center text-center relative z-10">
                          <div className="w-9 h-9 rounded-full bg-primary-600 text-white font-bold text-sm flex items-center justify-center shadow-md mb-3">4</div>
                          <h3 className={`font-bold text-sm md:text-base ${theme.titleColor}`}>{getPoint(5)}</h3>
                          <p className={`text-xs md:text-sm leading-relaxed ${theme.textColor}`}>{getPoint(6)}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Split Columns (split_columns) */}
                  {currentSlide.layout === "split_columns" && (
                    <div className="w-full max-w-4xl mx-auto space-y-6">
                      <h2 className={`text-3xl md:text-4xl font-black leading-tight border-b pb-4 ${theme.titleColor} border-current/10`}>
                        {currentSlide.titulo}
                      </h2>
                      <div className="grid grid-cols-2 gap-8">
                        {/* Col 1 */}
                        <div className={`p-4 rounded-2xl border flex flex-col gap-4 shadow-md ${theme.cardBgClass}`}>
                          <div className="w-full h-40 md:h-48 rounded-xl overflow-hidden shrink-0">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={getSlideImages(currentSlide).img1}
                              alt="Col 1"
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div>
                            <h3 className={`text-lg font-bold mb-2 ${theme.titleColor}`}>{currentSlide.subtitulo || ""}</h3>
                            <p className={`text-sm leading-relaxed ${theme.textColor}`}>{getPoint(0)}</p>
                          </div>
                        </div>
                        {/* Col 2 */}
                        <div className={`p-4 rounded-2xl border flex flex-col gap-4 shadow-md ${theme.cardBgClass}`}>
                          <div className="w-full h-40 md:h-48 rounded-xl overflow-hidden shrink-0">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={getSlideImages(currentSlide).img2}
                              alt="Col 2"
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div>
                            <h3 className={`text-lg font-bold mb-2 ${theme.titleColor}`}>{getPoint(1)}</h3>
                            <p className={`text-sm leading-relaxed ${theme.textColor}`}>{getPoint(2)}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Grid Cards (grid_cards) */}
                  {currentSlide.layout === "grid_cards" && (
                    <div className="w-full max-w-4xl mx-auto space-y-6">
                      <h2 className={`text-4xl md:text-5xl font-black leading-tight mb-8 border-b pb-4 ${theme.titleColor} border-current/10`}>
                        {currentSlide.titulo}
                      </h2>
                      <div className="grid grid-cols-3 gap-6">
                        {/* Card 1 */}
                        <div className={`p-6 rounded-2xl border flex flex-col justify-between shadow-md min-h-[220px] ${theme.cardBgClass}`}>
                          <div>
                            <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-sm font-bold mb-3">A</div>
                            <h3 className={`text-base font-bold mb-2 ${theme.titleColor}`}>{currentSlide.subtitulo || ""}</h3>
                            <p className={`text-xs md:text-sm leading-relaxed ${theme.textColor}`}>{getPoint(0)}</p>
                          </div>
                        </div>
                        {/* Card 2 */}
                        <div className={`p-6 rounded-2xl border flex flex-col justify-between shadow-md min-h-[220px] ${theme.cardBgClass}`}>
                          <div>
                            <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-sm font-bold mb-3">B</div>
                            <h3 className={`text-base font-bold mb-2 ${theme.titleColor}`}>{getPoint(1)}</h3>
                            <p className={`text-xs md:text-sm leading-relaxed ${theme.textColor}`}>{getPoint(2)}</p>
                          </div>
                        </div>
                        {/* Card 3 */}
                        <div className={`p-6 rounded-2xl border flex flex-col justify-between shadow-md min-h-[220px] ${theme.cardBgClass}`}>
                          <div>
                            <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-sm font-bold mb-3">C</div>
                            <h3 className={`text-base font-bold mb-2 ${theme.titleColor}`}>{getPoint(3)}</h3>
                            <p className={`text-xs md:text-sm leading-relaxed ${theme.textColor}`}>{getPoint(4)}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Highlight Quote (highlight_quote) */}
                  {currentSlide.layout === "highlight_quote" && (
                    <div className={`w-full grid gap-12 items-center justify-between max-w-5xl mx-auto ${customTheme ? compositionGridClasses[customTheme.composition] || "grid-cols-2" : "grid-cols-2"}`}>
                      {currentSlide.imageUrl && (
                        <div className={`aspect-square overflow-hidden shadow-2xl border border-white/20 shrink-0 ${customTheme?.composition === 'organic' ? 'rounded-[38%_12%_28%_16%]' : 'rounded-2xl'}`}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={getSlideImages(currentSlide).img1}
                            alt={currentSlide.titulo}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      <div className="flex-1 space-y-6">
                        <h2 className={`text-3xl md:text-4xl font-black leading-tight border-b pb-4 ${theme.titleColor} border-current/10`}>
                          {currentSlide.titulo}
                        </h2>
                        <p className={`text-base md:text-lg leading-relaxed ${theme.textColor}`}>
                          {currentSlide.subtitulo || ""}
                        </p>
                        <div className={`p-6 rounded-2xl border-l-4 border-primary-500 bg-primary-500/5 shadow-md ${theme.cardBgClass}`}>
                          <p className={`text-sm md:text-base leading-relaxed font-semibold ${theme.textColor} whitespace-pre-line`}>
                            {getPoint(0)}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </div>

            {/* Footer Presenter */}
            <div className="flex justify-between items-center shrink-0 border-t border-current/10 pt-6">
              <span className="text-xs opacity-60">Pressione as setas ← ou → no teclado para navegar</span>
              
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setActiveIndex(prev => Math.max(prev - 1, 0))}
                  disabled={activeIndex === 0}
                  className="p-2 hover:bg-black/10 rounded-full transition-colors cursor-pointer disabled:opacity-40 disabled:hover:bg-transparent"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <span className="text-sm font-bold">{activeIndex + 1} / {slides.length}</span>
                <button
                  onClick={() => setActiveIndex(prev => Math.min(prev + 1, slides.length - 1))}
                  disabled={activeIndex === slides.length - 1}
                  className="p-2 hover:bg-black/10 rounded-full transition-colors cursor-pointer disabled:opacity-40 disabled:hover:bg-transparent"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </div>
            </div>

          </motion.div>
        )}
      </AnimatePresence>

      {/* 4. MODAL UNSPASH PESQUISA CANVAS */}
      {isModalSearchOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 select-none">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-surface-200">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-bold text-text-900 flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-primary-500" />
                Pesquisar Imagens no Unsplash
              </h3>
              <button
                onClick={() => setIsModalSearchOpen(false)}
                className="text-text-400 hover:text-text-600 font-bold text-lg cursor-pointer"
              >
                &times;
              </button>
            </div>
            
            <div className="flex gap-2 mb-4">
              <Input
                value={imageSearchQuery}
                onChange={(e) => setImageSearchQuery(e.target.value)}
                placeholder="Pesquisar termo em inglês..."
                className="h-10 text-sm"
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleImageSearch();
                }}
              />
              <Button
                onClick={handleImageSearch}
                isLoading={isSearchingImages}
                className="h-10 px-4 cursor-pointer"
              >
                Buscar
              </Button>
            </div>

            {isSearchingImages ? (
              <div className="h-48 flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
              </div>
            ) : searchResults.length > 0 ? (
              <div className="grid grid-cols-3 gap-2 max-h-60 overflow-y-auto p-1 bg-surface-50 rounded-xl border border-surface-150">
                {searchResults.map((url, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      selectImage(url);
                      setIsModalSearchOpen(false);
                    }}
                    className="w-full aspect-[4/3] rounded-lg overflow-hidden border hover:border-primary-500 hover:ring-2 hover:ring-primary-500/20 transition-all cursor-pointer"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt="resultado" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            ) : (
              <div className="h-48 flex items-center justify-center text-text-400 text-sm text-center">
                Nenhuma imagem encontrada.<br />Tente buscar em inglês (ex: "history lesson", "math").
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
