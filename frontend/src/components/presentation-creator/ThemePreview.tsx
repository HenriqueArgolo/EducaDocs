import type { CSSProperties } from "react";
import type { PresentationThemeDefinition } from "@/lib/presentation-themes";

const layoutByComposition: Record<string, string> = {
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

export function ThemePreview({ theme }: { theme: PresentationThemeDefinition }) {
  const style = {
    "--theme-canvas": theme.colors.canvas,
    "--theme-surface": theme.colors.surface,
    "--theme-ink": theme.colors.ink,
    "--theme-muted": theme.colors.muted,
    "--theme-accent": theme.colors.accent,
  } as CSSProperties;

  return (
    <span
      style={style}
      data-composition={theme.composition}
      className={`relative grid aspect-[16/9] overflow-hidden bg-[var(--theme-canvas)] ${layoutByComposition[theme.composition]}`}
    >
      <span
        data-preview-region="media"
        className="relative m-3 overflow-hidden border border-black/10 bg-[var(--theme-accent)]/15 shadow-sm"
        style={{ borderRadius: theme.composition === "organic" ? "38% 12% 28% 16%" : theme.composition === "archive" ? "2px" : "12px" }}
      >
        <span className="absolute inset-0 opacity-60" style={{ background: `linear-gradient(135deg, ${theme.colors.accent}, ${theme.colors.surface})` }} />
        <span className="absolute bottom-2 left-2 right-2 h-2 rounded-full bg-white/70" />
        {theme.composition === "collage" && <span className="absolute -right-2 top-2 h-10 w-12 rotate-6 bg-white/75 shadow" />}
        {theme.composition === "laboratory" && <span className="absolute left-1/2 top-1/2 h-12 w-12 -translate-x-1/2 -translate-y-1/2 rounded-full border-4 border-white/70" />}
      </span>

      <span data-preview-region="title" className="relative flex flex-col justify-center px-3 py-4" style={{ color: theme.colors.ink, fontFamily: theme.fontFamily }}>
        <span className="mb-2 h-1 w-8 rounded-full bg-[var(--theme-accent)]" />
        <strong className="text-[12px] leading-tight">{theme.name}</strong>
        <span className="mt-1 line-clamp-2 text-[8px] leading-snug" style={{ color: theme.colors.muted }}>{theme.description}</span>
      </span>

      <span data-preview-region="signature" className="pointer-events-none absolute inset-0">
        {theme.composition === "editorial" && <span className="absolute bottom-2 left-3 right-3 h-px bg-[var(--theme-accent)]" />}
        {theme.composition === "notebook" && <span className="absolute bottom-0 left-5 top-0 w-px bg-[var(--theme-accent)]/40" />}
        {theme.composition === "geometric" && <span className="absolute -right-5 -top-5 h-14 w-14 rotate-12 border-[10px] border-[var(--theme-accent)]/25" />}
        {theme.composition === "cinematic" && <span className="absolute inset-x-0 bottom-0 h-2 bg-[var(--theme-accent)]" />}
        {theme.composition === "focus" && <span className="absolute right-2 top-2 grid h-5 w-5 place-items-center rounded-full bg-[var(--theme-accent)] text-[8px] font-black text-white">1</span>}
        {theme.composition === "organic" && <span className="absolute -bottom-6 -right-5 h-14 w-20 rounded-[50%] bg-[var(--theme-accent)]/15" />}
      </span>
    </span>
  );
}
