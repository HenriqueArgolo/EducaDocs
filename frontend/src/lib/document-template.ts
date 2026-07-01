import type { TemplateStyle } from "./types";

export interface DocumentTemplateDefinition {
  id: TemplateStyle;
  label: string;
  rootClass: string;
  signature: string;
}

const DOCUMENT_TEMPLATES: Record<TemplateStyle, DocumentTemplateDefinition> = {
  INSTITUTIONAL: {
    id: "INSTITUTIONAL",
    label: "Institucional",
    rootClass: "document-template--institutional",
    signature: "formal-double-rule",
  },
  MODERN: {
    id: "MODERN",
    label: "Moderno",
    rootClass: "document-template--modern",
    signature: "gradient-rail-cards",
  },
  MINIMALIST: {
    id: "MINIMALIST",
    label: "Minimalista",
    rootClass: "document-template--minimalist",
    signature: "quiet-monochrome-grid",
  },
  TABLE: {
    id: "TABLE",
    label: "Tabela",
    rootClass: "document-template--table",
    signature: "grid-table-layout",
  },
};

export function normalizeTemplateStyle(style?: string | null): TemplateStyle {
  return style === "MODERN" || style === "MINIMALIST" || style === "INSTITUTIONAL" || style === "TABLE"
    ? style
    : "INSTITUTIONAL";
}

export function getDocumentTemplate(style?: string | null): DocumentTemplateDefinition {
  return DOCUMENT_TEMPLATES[normalizeTemplateStyle(style)];
}

export function getTemplateSectionIndex(style: TemplateStyle, index: number): string {
  if (style === "MINIMALIST") {
    return "";
  }
  if (style === "MODERN") {
    return String(index).padStart(2, "0");
  }
  return toRoman(index);
}

export function stripSectionNumber(title: string): string {
  return title.replace(/^\d+\.\s*/, "");
}

function toRoman(value: number): string {
  const pairs: Array<[number, string]> = [
    [1000, "M"], [900, "CM"], [500, "D"], [400, "CD"],
    [100, "C"], [90, "XC"], [50, "L"], [40, "XL"],
    [10, "X"], [9, "IX"], [5, "V"], [4, "IV"], [1, "I"],
  ];
  let remaining = Math.max(1, Math.floor(value));
  let roman = "";
  for (const [amount, symbol] of pairs) {
    while (remaining >= amount) {
      roman += symbol;
      remaining -= amount;
    }
  }
  return roman;
}
