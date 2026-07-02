"use client";

import * as React from "react";
import { Check, Search, ShieldCheck, Sparkles } from "lucide-react";
import { ThemePreview } from "./ThemePreview";
import {
  PRESENTATION_THEME_CATEGORIES,
  filterThemesByCategory,
  searchPresentationThemes,
} from "@/lib/presentation-themes";

interface ThemeGalleryProps {
  value: string;
  onChange: (themeId: string) => void;
}

export function ThemeGallery({ value, onChange }: ThemeGalleryProps) {
  const [group, setGroup] = React.useState<"pedagogy" | "inclusion">("pedagogy");
  const categories = PRESENTATION_THEME_CATEGORIES.filter((category) => category.kind === group);
  const [categoryId, setCategoryId] = React.useState("early-years");
  const [query, setQuery] = React.useState("");
  const activeCategory = categories.some((category) => category.id === categoryId) ? categoryId : categories[0]?.id;
  const themes = query ? searchPresentationThemes(query, activeCategory) : filterThemesByCategory(activeCategory);

  function changeGroup(nextGroup: "pedagogy" | "inclusion") {
    setGroup(nextGroup);
    const firstCategory = PRESENTATION_THEME_CATEGORIES.find((category) => category.kind === nextGroup);
    if (firstCategory) setCategoryId(firstCategory.id);
    setQuery("");
  }

  return (
    <div>
      <div className="grid grid-cols-2 gap-1 rounded-2xl bg-surface-100 p-1">
        <button type="button" onClick={() => changeGroup("pedagogy")} aria-pressed={group === "pedagogy"} className={`min-h-11 rounded-xl text-xs font-extrabold ${group === "pedagogy" ? "bg-white text-primary-800 shadow-sm" : "text-text-500"}`}>
          Temas pedagógicos · 100
        </button>
        <button type="button" onClick={() => changeGroup("inclusion")} aria-pressed={group === "inclusion"} className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-xl text-xs font-extrabold ${group === "inclusion" ? "bg-white text-primary-800 shadow-sm" : "text-text-500"}`}>
          <ShieldCheck className="h-4 w-4" aria-hidden="true" /> Inclusivos · 80
        </button>
      </div>

      <label className="relative mt-4 block">
        <span className="sr-only">Pesquisar temas</span>
        <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-text-400" aria-hidden="true" />
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Pesquisar temas nesta categoria" className="h-12 w-full rounded-2xl border border-surface-200 bg-white pl-11 pr-4 text-sm outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20" />
      </label>

      <div className="mt-3 flex gap-2 overflow-x-auto pb-2" aria-label="Categorias de temas">
        {categories.map((category) => (
          <button key={category.id} type="button" aria-pressed={activeCategory === category.id} onClick={() => { setCategoryId(category.id); setQuery(""); }} className={`min-h-11 shrink-0 rounded-full border px-3 text-xs font-bold ${activeCategory === category.id ? "border-primary-300 bg-primary-50 text-primary-800" : "border-surface-200 bg-surface-50 text-text-600"}`}>
            {category.label}
          </button>
        ))}
      </div>

      <div role="radiogroup" aria-label="Temas visuais" className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {themes.map((theme, index) => {
          const selected = value === theme.id;
          return (
            <button key={theme.id} type="button" role="radio" aria-checked={selected} onClick={() => onChange(theme.id)} className={`group overflow-hidden rounded-2xl border bg-white text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 motion-reduce:transform-none motion-reduce:transition-none ${selected ? "border-primary-500 ring-2 ring-primary-500/15" : "border-surface-200"}`}>
              <span className="relative block">
                <ThemePreview theme={theme} />
                {index === 0 && <span className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-full bg-white/95 px-2 py-1 text-[8px] font-black text-primary-700 shadow-sm"><Sparkles className="h-2.5 w-2.5" /> Destaque</span>}
                {selected && <span className="absolute bottom-2 right-2 grid h-6 w-6 place-items-center rounded-full bg-primary-600 text-white shadow-sm"><Check className="h-3.5 w-3.5" /></span>}
              </span>
              <span className="block px-3 py-2">
                <strong className="block text-xs text-text-900">{theme.name}</strong>
                <span className="mt-0.5 block text-[10px] text-text-500">{theme.signatureElement}</span>
              </span>
            </button>
          );
        })}
      </div>
      {themes.length === 0 && <div className="mt-4 rounded-2xl border border-dashed border-surface-300 bg-surface-50 p-8 text-center text-sm text-text-500">Nenhum tema encontrado nesta categoria.</div>}
    </div>
  );
}
