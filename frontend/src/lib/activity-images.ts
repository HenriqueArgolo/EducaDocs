export type ActivityImageSource = {
  imagemUrl?: unknown;
  imageUrl?: unknown;
};

export function getActivityImagePath(source: ActivityImageSource | null | undefined): string | null {
  if (!source) return null;
  for (const value of [source.imagemUrl, source.imageUrl]) {
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }
  return null;
}

export function toActivityImageUrl(path: string | null | undefined, apiBaseUrl: string): string | null {
  if (!path?.trim()) return null;
  const normalized = path.trim();
  if (/^(https?:|data:|blob:)/i.test(normalized)) {
    return normalized;
  }
  const base = apiBaseUrl.replace(/\/$/, "");
  return `${base}${normalized.startsWith("/") ? normalized : `/${normalized}`}`;
}

export function isGeneratedActivityImage(path: string | null | undefined): boolean {
  return typeof path === "string" && path.includes("/images/generated/");
}

