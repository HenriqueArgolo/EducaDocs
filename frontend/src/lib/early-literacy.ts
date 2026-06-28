export type EarlyLiteracyType =
  | "SEPARAR_SILABAS"
  | "LETRA_INICIAL"
  | "LIGAR_FIGURA_PALAVRA"
  | "COMPLETAR_PALAVRA"
  | "CIRCULAR_LETRA"
  | "CONTAR_LETRAS"
  | "CACA_LETRA";

export type EarlyLiteracyItem = {
  palavra?: string;
  figura?: string;
  imagemUrl?: string;
  imageUrl?: string;
  silabas?: string[];
  opcoes?: string[];
  letras?: string[];
  resposta?: string | number;
  letraAlvo?: string;
  caixasResposta?: number;
  lacunaIndice?: number;
};

const DEFAULT_TYPE: EarlyLiteracyType = "SEPARAR_SILABAS";

type EarlyLiteracyContent = {
  layout?: unknown;
  tipoAvaliacao?: unknown;
  atividadesVisuais?: unknown;
};

export function isEarlyLiteracyWorksheetContent(content: EarlyLiteracyContent): boolean {
  const layout = String(content.layout || "").trim().toUpperCase();
  return layout.startsWith("ALFABETIZACAO_VISUAL")
    || String(content.tipoAvaliacao || "").trim().toUpperCase() === "ALFABETIZACAO_INICIAL"
    || Array.isArray(content.atividadesVisuais);
}

const KNOWN_SYLLABLES: Record<string, string[]> = {
  ABELHA: ["A", "BE", "LHA"],
  BANANA: ["BA", "NA", "NA"],
  BARCO: ["BAR", "CO"],
  BOLA: ["BO", "LA"],
  BOLO: ["BO", "LO"],
  CARRO: ["CAR", "RO"],
  CASA: ["CA", "SA"],
  CAVALO: ["CA", "VA", "LO"],
  COLA: ["CO", "LA"],
  DADO: ["DA", "DO"],
  FLOR: ["FLOR"],
  GALO: ["GA", "LO"],
  GATO: ["GA", "TO"],
  LAPIS: ["LA", "PIS"],
  LIMAO: ["LI", "MAO"],
  LIVRO: ["LI", "VRO"],
  LUA: ["LU", "A"],
  MALA: ["MA", "LA"],
  MELAO: ["ME", "LAO"],
  MOTO: ["MO", "TO"],
  OVELHA: ["O", "VE", "LHA"],
  PATO: ["PA", "TO"],
  PERA: ["PE", "RA"],
  PORCO: ["POR", "CO"],
  SAPO: ["SA", "PO"],
  SOL: ["SOL"],
  TREM: ["TREM"],
  UVA: ["U", "VA"],
  VACA: ["VA", "CA"],
};

export const FIGURE_ICON_NAMES: Record<string, string> = {
  abelha: "Bug",
  banana: "Banana",
  barco: "Ship",
  bola: "Circle",
  bolo: "Cake",
  carro: "Car",
  casa: "House",
  cavalo: "Horse",
  cola: "Package",
  dado: "Dices",
  flor: "Flower2",
  galo: "Bird",
  gato: "Cat",
  lapis: "Pencil",
  limao: "Circle",
  livro: "BookOpen",
  lua: "Moon",
  mala: "Briefcase",
  melao: "Circle",
  moto: "Bike",
  ovelha: "Cloud",
  pato: "Bird",
  pera: "Circle",
  porco: "PiggyBank",
  sapo: "Frog",
  sol: "Sun",
  trem: "Train",
  uva: "Grape",
  vaca: "Milk",
};

export function normalizeFigureKey(value: string | undefined | null): string {
  return (value || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

export function getFigureIconName(value: string | undefined | null): string {
  return FIGURE_ICON_NAMES[normalizeFigureKey(value)] || "Image";
}

export function normalizeEarlyLiteracyType(value: string | undefined | null): EarlyLiteracyType {
  const normalized = (value || "").trim().toUpperCase();
  if (normalized === "COMPLETAR_SILABA") {
    return "COMPLETAR_PALAVRA";
  }

  if (
    normalized === "SEPARAR_SILABAS" ||
    normalized === "LETRA_INICIAL" ||
    normalized === "LIGAR_FIGURA_PALAVRA" ||
    normalized === "COMPLETAR_PALAVRA" ||
    normalized === "CIRCULAR_LETRA" ||
    normalized === "CONTAR_LETRAS" ||
    normalized === "CACA_LETRA"
  ) {
    return normalized;
  }

  return DEFAULT_TYPE;
}

export function getSyllables(item: EarlyLiteracyItem): string[] {
  if (Array.isArray(item.silabas) && item.silabas.length > 0) {
    return item.silabas.map(String).filter(Boolean);
  }

  const word = normalizeWord(item.palavra);
  if (KNOWN_SYLLABLES[word]) {
    return KNOWN_SYLLABLES[word];
  }

  return word.match(/.{1,2}/g) || [];
}

export function getLetters(item: EarlyLiteracyItem): string[] {
  if (Array.isArray(item.letras) && item.letras.length > 0) {
    return item.letras.map(String).filter(Boolean);
  }

  return normalizeWord(item.palavra).split("");
}

export function getCompletionOptions(item: EarlyLiteracyItem): string[] {
  if (Array.isArray(item.opcoes) && item.opcoes.length > 0) {
    return item.opcoes.map(String).filter(Boolean);
  }

  const syllables = getSyllables(item);
  return [syllables[0], "BA", "LA"].filter(Boolean).slice(0, 3);
}

export function getInitialLetter(item: EarlyLiteracyItem): string {
  return normalizeWord(item.palavra).charAt(0);
}

export function getResponseBoxCount(item: EarlyLiteracyItem): number {
  const boxes = Number(item.caixasResposta ?? 0);
  if (Number.isFinite(boxes) && boxes > 0) {
    return Math.min(boxes, 8);
  }

  return Math.max(1, getSyllables(item).length);
}

function normalizeWord(value: string | undefined): string {
  return (value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase();
}
