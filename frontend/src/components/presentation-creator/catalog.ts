export type ThemeFilterGroup = "all" | "pedagogy" | "accessibility";

export interface ThemeFilter {
  id: string;
  label: string;
  group: ThemeFilterGroup;
}

export interface PresentationTheme {
  id: string;
  name: string;
  description: string;
  tags: string[];
  previewClass: string;
  textClass: string;
  accentClass: string;
  editorThemeId: string;
  recommended?: boolean;
}

export const DEFAULT_THEME_ID = "CHALKIE";

export const THEME_FILTERS: ThemeFilter[] = [
  { id: "all", label: "Todos", group: "all" },
  { id: "early-years", label: "Anos iniciais", group: "pedagogy" },
  { id: "science", label: "Ciências", group: "pedagogy" },
  { id: "history", label: "História", group: "pedagogy" },
  { id: "math", label: "Matemática", group: "pedagogy" },
  { id: "teenagers", label: "Adolescentes", group: "pedagogy" },
  { id: "low-stimulation", label: "Baixa estimulação", group: "accessibility" },
  { id: "dyslexia", label: "Dislexia", group: "accessibility" },
  { id: "low-vision", label: "Baixa visão", group: "accessibility" },
  { id: "adhd", label: "TDAH", group: "accessibility" },
];

export const PRESENTATION_THEMES: PresentationTheme[] = [
  {
    id: "CHALKIE",
    name: "Chalkie",
    description: "Visual lúdico e pedagógico",
    tags: ["early-years", "science", "history", "math", "adhd"],
    previewClass: "bg-gradient-to-br from-sky-100 via-indigo-50 to-violet-100",
    textClass: "text-slate-900",
    accentClass: "bg-[#DDBB99]",
    editorThemeId: "LUDICO",
    recommended: true,
  },
  {
    id: "SCIENCE_CLEAR",
    name: "Ciência clara",
    description: "Diagramas e descobertas",
    tags: ["science", "low-stimulation"],
    previewClass: "bg-gradient-to-br from-cyan-50 to-sky-100",
    textClass: "text-cyan-950",
    accentClass: "bg-cyan-500",
    editorThemeId: "CEU_PASTEL",
  },
  {
    id: "HISTORY_ARCHIVE",
    name: "Arquivo histórico",
    description: "Mapas, fontes e tempo",
    tags: ["history", "teenagers", "dyslexia"],
    previewClass: "bg-gradient-to-br from-amber-50 to-stone-200",
    textClass: "text-stone-900",
    accentClass: "bg-amber-700",
    editorThemeId: "CAFE_VINTAGE",
  },
  {
    id: "MATH_VISUAL",
    name: "Matemática visual",
    description: "Passos sem distração",
    tags: ["math", "low-stimulation", "dyslexia"],
    previewClass: "bg-gradient-to-br from-orange-50 to-rose-100",
    textClass: "text-orange-950",
    accentClass: "bg-orange-500",
    editorThemeId: "TECH_ORANGE",
  },
  {
    id: "DEEP_BLUE",
    name: "Azul profundo",
    description: "Imersivo e sóbrio",
    tags: ["science", "teenagers", "low-vision"],
    previewClass: "bg-gradient-to-br from-slate-900 to-blue-950",
    textClass: "text-sky-50",
    accentClass: "bg-sky-400",
    editorThemeId: "OCEANO_PROFUNDO",
  },
  {
    id: "FOCUS",
    name: "Foco",
    description: "Baixa estimulação",
    tags: ["science", "math", "low-stimulation", "dyslexia"],
    previewClass: "bg-white",
    textClass: "text-slate-950",
    accentClass: "bg-slate-800",
    editorThemeId: "MIND_MINIMAL",
  },
  {
    id: "EDITORIAL",
    name: "Editorial",
    description: "Conteúdo para adolescentes",
    tags: ["history", "teenagers", "dyslexia"],
    previewClass: "bg-gradient-to-br from-violet-50 to-indigo-100",
    textClass: "text-indigo-950",
    accentClass: "bg-violet-600",
    editorThemeId: "LAVANDA_ZEPHYR",
  },
  {
    id: "HIGH_CONTRAST",
    name: "Alto contraste",
    description: "Otimizado para baixa visão",
    tags: ["science", "history", "math", "teenagers", "low-vision"],
    previewClass: "bg-slate-950",
    textClass: "text-white",
    accentClass: "bg-yellow-300",
    editorThemeId: "MODERNO_ESCURO",
  },
  {
    id: "NATURE",
    name: "Natureza",
    description: "Ciências e sustentabilidade",
    tags: ["science", "low-stimulation"],
    previewClass: "bg-gradient-to-br from-emerald-50 to-teal-100",
    textClass: "text-emerald-950",
    accentClass: "bg-emerald-600",
    editorThemeId: "FLORESTA_TROPICAL",
  },
  {
    id: "SOFT_GRADIENT",
    name: "Gradiente suave",
    description: "Leve e contemporâneo",
    tags: ["early-years", "teenagers", "dyslexia"],
    previewClass: "bg-gradient-to-br from-pink-100 via-violet-50 to-blue-100",
    textClass: "text-violet-950",
    accentClass: "bg-pink-400",
    editorThemeId: "ROSA_CREATIVO",
  },
  {
    id: "ENERGY",
    name: "Energia",
    description: "Ativo e vibrante",
    tags: ["early-years", "math", "adhd"],
    previewClass: "bg-gradient-to-br from-teal-400 to-cyan-500",
    textClass: "text-teal-950",
    accentClass: "bg-orange-300",
    editorThemeId: "MENTA_FRESCA",
  },
  {
    id: "EARTH",
    name: "Terra",
    description: "Geografia e cultura",
    tags: ["history", "teenagers", "adhd"],
    previewClass: "bg-gradient-to-br from-orange-700 to-rose-800",
    textClass: "text-orange-50",
    accentClass: "bg-orange-200",
    editorThemeId: "TERRA_COTTA",
  },
];

export const PEDAGOGICAL_FUNCTIONS = [
  "Capa · curiosidade",
  "Situação-problema",
  "Conhecimentos prévios",
  "Objetivos",
  "Conceito",
  "Exemplo",
  "Aplicação",
  "Verificação",
  "Síntese",
  "Conexão cotidiana",
] as const;

export function filterPresentationThemes(
  themes: PresentationTheme[],
  activeFilterIds: string[],
) {
  const selected = activeFilterIds.filter((id) => id !== "all");
  if (selected.length === 0) return themes;
  return themes.filter((theme) => selected.every((filter) => theme.tags.includes(filter)));
}
