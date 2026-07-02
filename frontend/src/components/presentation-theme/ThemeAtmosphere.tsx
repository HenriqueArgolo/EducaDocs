import type { CSSProperties } from "react";
import type { PresentationThemeDefinition } from "@/lib/presentation-themes";

export function ThemeAtmosphere({ theme }: { theme?: PresentationThemeDefinition }) {
  if (!theme) return null;
  const style = { "--atmosphere-accent": theme.colors.accent } as CSSProperties;
  return (
    <div style={style} data-theme-composition={theme.composition} className="pointer-events-none absolute inset-0 z-0 overflow-hidden" aria-hidden="true">
      {theme.composition === "organic" && <><span className="absolute -left-12 top-10 h-40 w-52 rotate-[-8deg] rounded-[42%_22%_38%_18%] bg-[var(--atmosphere-accent)]/16"/><span className="absolute -bottom-20 right-10 h-36 w-64 rounded-[50%] bg-[var(--atmosphere-accent)]/10"/></>}
      {theme.composition === "editorial" && <><span className="absolute left-8 top-7 h-1 w-20 bg-[var(--atmosphere-accent)]"/><span className="absolute bottom-7 left-8 right-8 h-px bg-[var(--atmosphere-accent)]/40"/><span className="absolute bottom-3 right-8 text-[9px] font-black tracking-[.2em] text-[var(--atmosphere-accent)]">EDU</span></>}
      {theme.composition === "archive" && <><span className="absolute left-5 top-5 h-16 w-24 -rotate-3 border border-[var(--atmosphere-accent)]/30 bg-white/25 shadow-sm"/><span className="absolute bottom-8 right-8 rotate-[-8deg] border-2 border-[var(--atmosphere-accent)]/35 px-3 py-1 text-[9px] font-black uppercase text-[var(--atmosphere-accent)]">arquivo</span></>}
      {theme.composition === "laboratory" && <><span className="absolute inset-0 opacity-[.08] [background-image:linear-gradient(var(--atmosphere-accent)_1px,transparent_1px),linear-gradient(90deg,var(--atmosphere-accent)_1px,transparent_1px)] [background-size:28px_28px]"/><span className="absolute right-8 top-8 h-16 w-16 rounded-full border-4 border-[var(--atmosphere-accent)]/25"/></>}
      {theme.composition === "geometric" && <><span className="absolute -right-10 -top-10 h-40 w-40 rotate-12 border-[28px] border-[var(--atmosphere-accent)]/12"/><span className="absolute bottom-0 left-0 h-3 w-1/3 bg-[var(--atmosphere-accent)]"/></>}
      {theme.composition === "cinematic" && <><span className="absolute inset-x-0 top-0 h-3 bg-black/10"/><span className="absolute inset-x-0 bottom-0 h-3 bg-[var(--atmosphere-accent)]"/></>}
      {theme.composition === "collage" && <><span className="absolute -left-5 bottom-8 h-28 w-36 rotate-6 bg-[var(--atmosphere-accent)]/12 shadow-sm"/><span className="absolute right-10 top-4 h-4 w-24 -rotate-3 bg-[var(--atmosphere-accent)]/25"/></>}
      {theme.composition === "notebook" && <><span className="absolute bottom-0 left-14 top-0 w-px bg-[var(--atmosphere-accent)]/35"/><span className="absolute inset-0 opacity-[.09] [background-image:linear-gradient(transparent_27px,var(--atmosphere-accent)_28px)] [background-size:100%_28px]"/></>}
      {theme.composition === "gallery" && <><span className="absolute inset-5 border border-[var(--atmosphere-accent)]/25"/><span className="absolute bottom-4 left-1/2 h-1 w-16 -translate-x-1/2 bg-[var(--atmosphere-accent)]"/></>}
      {theme.composition === "focus" && <><span className="absolute right-6 top-6 grid h-9 w-9 place-items-center rounded-full bg-[var(--atmosphere-accent)] text-xs font-black text-white">1</span><span className="absolute bottom-6 left-6 right-6 h-1 overflow-hidden rounded-full bg-black/10"><span className="block h-full w-1/3 bg-[var(--atmosphere-accent)]"/></span></>}
    </div>
  );
}
