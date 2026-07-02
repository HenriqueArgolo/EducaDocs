export type ThemeCategoryKind = "pedagogy" | "inclusion";
export type ThemeDensity = "airy" | "balanced" | "compact";

export interface ThemeAccessibilityProfile {
  certifiedFor: string;
  rules: string[];
  reducedMotion: boolean;
  minContrast: number;
}

export interface ThemeCategory {
  id: string;
  label: string;
  kind: ThemeCategoryKind;
  description: string;
}

export interface CompositionSystem {
  id: string;
  label: string;
  description: string;
  imageTreatment: string;
  titleTreatment: string;
  signatureElement: string;
  density: ThemeDensity;
}

export interface PresentationThemeDefinition {
  id: string;
  name: string;
  description: string;
  categoryId: string;
  categoryKind: ThemeCategoryKind;
  composition: string;
  artDirection: string;
  imageTreatment: string;
  titleTreatment: string;
  signatureElement: string;
  fontFamily: string;
  density: ThemeDensity;
  colors: {
    canvas: string;
    surface: string;
    ink: string;
    muted: string;
    accent: string;
    onAccent: string;
  };
  accessibilityProfile?: ThemeAccessibilityProfile;
}

export const COMPOSITION_SYSTEMS: CompositionSystem[] = [
  { id: "organic", label: "Orgânico", description: "recortes assimétricos com respiro", imageTreatment: "imagem em moldura orgânica sobreposta", titleTreatment: "título amplo alinhado ao recorte", signatureElement: "formas suaves nos cantos", density: "airy" },
  { id: "editorial", label: "Editorial", description: "hierarquia de revista e ritmo tipográfico", imageTreatment: "fotografia editorial com legenda", titleTreatment: "manchete com linha de apoio", signatureElement: "filetes e numeração editorial", density: "balanced" },
  { id: "archive", label: "Arquivo", description: "documentos, etiquetas e camadas de evidência", imageTreatment: "imagem documental com borda de papel", titleTreatment: "título de catálogo ou dossiê", signatureElement: "carimbos, etiquetas e notas marginais", density: "balanced" },
  { id: "laboratory", label: "Laboratório", description: "zonas técnicas e foco na observação", imageTreatment: "imagem recortada como amostra científica", titleTreatment: "título técnico com marcador de seção", signatureElement: "grade, escala e linha de medição", density: "balanced" },
  { id: "geometric", label: "Geométrico", description: "blocos modulares que mostram relações", imageTreatment: "imagem encaixada em forma geométrica", titleTreatment: "título compacto com contraste estrutural", signatureElement: "formas, eixos e módulos", density: "compact" },
  { id: "cinematic", label: "Cinematográfico", description: "uma cena dominante conduz a narrativa", imageTreatment: "imagem panorâmica com crop dramático", titleTreatment: "título curto sobre faixa de contraste", signatureElement: "faixa narrativa e enquadramento amplo", density: "airy" },
  { id: "collage", label: "Colagem", description: "múltiplas fontes visuais em tensão controlada", imageTreatment: "recortes sobrepostos com profundidade", titleTreatment: "título em etiqueta independente", signatureElement: "papéis, fitas e recortes", density: "balanced" },
  { id: "notebook", label: "Caderno", description: "aprendizagem processual e anotações guiadas", imageTreatment: "imagem anotada ou presa à página", titleTreatment: "título de capítulo com sublinhado", signatureElement: "margem, pauta e anotação", density: "balanced" },
  { id: "gallery", label: "Galeria", description: "obra ou evidência visual como protagonista", imageTreatment: "imagem com margem museológica generosa", titleTreatment: "título discreto e legenda precisa", signatureElement: "marco curatorial e placa", density: "airy" },
  { id: "focus", label: "Foco", description: "uma ideia, uma direção e mínimo ruído", imageTreatment: "imagem única com contorno claro", titleTreatment: "título direto em posição previsível", signatureElement: "marcador de progresso estável", density: "airy" },
];

interface CategorySource extends ThemeCategory {
  direction: string;
  fontFamily: string;
  palette: [string, string, string, string, string, string];
  names: string[];
  accessibilityRules?: string[];
  minContrast?: number;
}

const CATEGORY_SOURCES: CategorySource[] = [
  { id: "early-years", label: "Anos iniciais", kind: "pedagogy", description: "Narrativas visuais acolhedoras para crianças", direction: "ilustração pedagógica, escala generosa e pistas visuais amigáveis", fontFamily: "Fredoka, Quicksand, sans-serif", palette: ["#FFF8F5", "#FFFFFF", "#17202A", "#667085", "#2F9FA3", "#FFFFFF"], names: ["Chalkie Studio", "Jardim de Histórias", "Brinquedoteca 3D", "Safari de Papel", "Sala das Descobertas", "Pequenos Exploradores", "Formas Amigas", "Museu Brincante", "Caderno Mágico", "Mundo Curioso"] },
  { id: "science", label: "Ciências", kind: "pedagogy", description: "Observação, hipótese e descoberta", direction: "diagramas claros, amostras e evidência científica", fontFamily: "Inter, Arial, sans-serif", palette: ["#F2FBFC", "#FFFFFF", "#102A43", "#526777", "#0F8B8D", "#FFFFFF"], names: ["Atlas de Laboratório", "Vidro Molecular", "Notas de Campo", "Cosmos Vivo", "Microscópio", "Bioformas", "Estação Climática", "Anatomia Clara", "Química Visual", "Observatório"] },
  { id: "history", label: "História", kind: "pedagogy", description: "Fontes, tempo e interpretação", direction: "fotografia documental, mapas e materiais de arquivo", fontFamily: "Source Serif 4, Georgia, serif", palette: ["#FAF5EC", "#FFFDF8", "#2F241F", "#74645A", "#9A4F2F", "#FFFFFF"], names: ["Arquivo Vivo", "Gazeta do Tempo", "Cartas da História", "Museu de Bolso", "Linha do Século", "Dossiê Histórico", "Memória Popular", "Atlas das Eras", "Crônica Visual", "Documento Aberto"] },
  { id: "geography-nature", label: "Geografia e natureza", kind: "pedagogy", description: "Território, escala e sistemas naturais", direction: "mapas, texturas topográficas e fotografia de paisagem", fontFamily: "Manrope, Arial, sans-serif", palette: ["#F3F8F1", "#FFFFFF", "#18352A", "#5E7168", "#397A58", "#FFFFFF"], names: ["Atlas Terrestre", "Horizonte", "Mapa Vivo", "Biomas", "Cartografia Solar", "Planeta Azul", "Relevo", "Rotas do Mundo", "Terra em Camadas", "Paisagem Humana"] },
  { id: "math-data", label: "Matemática e dados", kind: "pedagogy", description: "Relações, processos e visualização", direction: "geometria funcional, passos e dados legíveis", fontFamily: "IBM Plex Sans, Arial, sans-serif", palette: ["#F7F7FF", "#FFFFFF", "#1E1B4B", "#64627A", "#5B55D6", "#FFFFFF"], names: ["Numerika", "Geometria em Jogo", "Dados Claros", "Passo a Passo", "Plano Cartesiano", "Padrões", "Equação Visual", "Métrica", "Lógica Modular", "Estatística Viva"] },
  { id: "language-literature", label: "Línguas e literatura", kind: "pedagogy", description: "Leitura, voz e construção de sentido", direction: "tipografia expressiva, margens literárias e imagens narrativas", fontFamily: "Literata, Georgia, serif", palette: ["#FFF9F1", "#FFFFFF", "#31251E", "#78695F", "#B4516A", "#FFFFFF"], names: ["Margem Literária", "Clube do Livro", "Palavra Viva", "Conto Ilustrado", "Oficina de Texto", "Vozes", "Poesia Visual", "Gramática em Cena", "Biblioteca", "Narrativa"] },
  { id: "arts-creativity", label: "Artes e criatividade", kind: "pedagogy", description: "Obra, processo e expressão", direction: "composição de galeria, cor autoral e materialidade", fontFamily: "Avenir Next, Arial, sans-serif", palette: ["#FFF7F3", "#FFFFFF", "#261B2D", "#716678", "#D94C72", "#FFFFFF"], names: ["Ateliê", "Galeria Aberta", "Cor e Forma", "Bauhaus Escolar", "Colagem Criativa", "Palco", "Cinema em Aula", "Museu Contemporâneo", "Processo Artístico", "Caderno de Artista"] },
  { id: "technology-steam", label: "Tecnologia e STEAM", kind: "pedagogy", description: "Sistemas, invenção e prototipagem", direction: "interfaces técnicas, esquemas e protótipos visuais", fontFamily: "Space Grotesk, Arial, sans-serif", palette: ["#F2F7FA", "#FFFFFF", "#10212B", "#60717A", "#087EA4", "#FFFFFF"], names: ["Oficina STEAM", "Circuito", "Código Visual", "Robótica", "Futuro Próximo", "Blueprint", "Maker Lab", "Sistema", "Engenharia Criativa", "Protótipo"] },
  { id: "teen-academic", label: "Adolescente e acadêmico", kind: "pedagogy", description: "Argumentação, evidência e autonomia", direction: "editorial contemporâneo, dados e fotografia real", fontFamily: "Inter, Arial, sans-serif", palette: ["#F5F6F8", "#FFFFFF", "#171B24", "#69707D", "#3B5CCC", "#FFFFFF"], names: ["Seminário", "Caderno Acadêmico", "Pesquisa", "Tese Visual", "Campus", "Debate", "Ensaio", "Painel de Evidências", "Síntese", "Contemporâneo"] },
  { id: "institutional", label: "Institucional e profissional", kind: "pedagogy", description: "Clareza formal e credibilidade", direction: "grid rigoroso, fotografia sóbria e hierarquia executiva", fontFamily: "Aptos, Arial, sans-serif", palette: ["#F7F8FA", "#FFFFFF", "#14213D", "#657087", "#1F4E79", "#FFFFFF"], names: ["Institucional", "Conselho", "Relatório Visual", "Escola em Dados", "Formação Docente", "Projeto Pedagógico", "Reunião", "Coordenação", "Plano Estratégico", "Comunidade Escolar"] },
  { id: "adhd", label: "TDAH", kind: "inclusion", description: "Foco explícito e progressão curta", direction: "um ponto focal, progressão visível e estímulos controlados", fontFamily: "Atkinson Hyperlegible, Arial, sans-serif", palette: ["#F7FAFC", "#FFFFFF", "#132238", "#53657A", "#2563EB", "#FFFFFF"], names: ["Foco Agora", "Próximo Passo", "Ritmo Claro", "Missão Única", "Trilha Curta", "Sinal Verde", "Janela de Foco", "Ponto Central", "Sequência", "Objetivo Visível"], accessibilityRules: ["um foco principal por slide", "progresso sempre visível", "máximo de dois acentos", "sem movimento ambiente"], minContrast: 4.5 },
  { id: "dyslexia", label: "Dislexia", kind: "inclusion", description: "Leitura fluida e previsível", direction: "texto curto alinhado à esquerda e formas de letra abertas", fontFamily: "Atkinson Hyperlegible, Arial, sans-serif", palette: ["#FFFDF2", "#FFFFFF", "#1F2937", "#5D6673", "#A34F00", "#FFFFFF"], names: ["Leitura Serena", "Linha Aberta", "Texto Amigo", "Margem Clara", "Palavra Segura", "Ritmo de Leitura", "Página Calma", "Frase Curta", "Letras Abertas", "Leitura Guiada"], accessibilityRules: ["alinhamento à esquerda", "linhas entre 45 e 70 caracteres", "sem itálico em blocos", "espaçamento ampliado"], minContrast: 4.5 },
  { id: "low-vision", label: "Baixa visão", kind: "inclusion", description: "Contraste forte e contornos claros", direction: "elementos grandes, contraste alto e separação por contorno", fontFamily: "Atkinson Hyperlegible, Arial, sans-serif", palette: ["#07111F", "#102033", "#FFFFFF", "#D7E4F0", "#FFD400", "#07111F"], names: ["Contraste Solar", "Visão Forte", "Contorno", "Luz Direta", "Escala Ampla", "Noite Legível", "Amarelo Guia", "Branco Total", "Zoom Visual", "Sinal Alto"], accessibilityRules: ["contraste mínimo 7:1", "texto e ícones ampliados", "contornos de 2px", "nenhuma informação só por cor"], minContrast: 7 },
  { id: "color-vision", label: "Daltonismo", kind: "inclusion", description: "Codificação redundante além da cor", direction: "padrões, rótulos e formas distinguem toda categoria", fontFamily: "Atkinson Hyperlegible, Arial, sans-serif", palette: ["#F8FAFC", "#FFFFFF", "#17202A", "#5F6B76", "#006D77", "#FFFFFF"], names: ["Forma e Padrão", "Código Duplo", "Mapa Seguro", "Símbolo", "Trama", "Rótulo Claro", "Contraste Azul", "Padrão Visível", "Categorias", "Sinal Redundante"], accessibilityRules: ["rótulos acompanham cores", "padrões distinguem séries", "pares seguros para daltonismo", "estados usam forma e texto"], minContrast: 4.5 },
  { id: "low-stimulation", label: "Baixa estimulação", kind: "inclusion", description: "Ambiente calmo e sem competição", direction: "poucos elementos, superfícies estáveis e silêncio visual", fontFamily: "Atkinson Hyperlegible, Arial, sans-serif", palette: ["#F6F7F5", "#FFFFFF", "#24302B", "#68736E", "#557A67", "#FFFFFF"], names: ["Silêncio Visual", "Calma", "Espaço", "Pausa", "Sereno", "Horizonte Suave", "Uma Coisa", "Respirar", "Essencial", "Quietude"], accessibilityRules: ["sem animação decorativa", "máximo de quatro elementos", "cores de baixa saturação", "transições instantâneas ou suaves"], minContrast: 4.5 },
  { id: "autism-predictability", label: "Autismo e previsibilidade", kind: "inclusion", description: "Estrutura consistente e antecipação", direction: "posições fixas, sequência explícita e linguagem literal", fontFamily: "Atkinson Hyperlegible, Arial, sans-serif", palette: ["#F5F8FA", "#FFFFFF", "#182A36", "#5C6D78", "#287C8E", "#FFFFFF"], names: ["Rotina Visual", "Sempre Aqui", "Sequência Segura", "Mapa da Aula", "Agora e Depois", "Estrutura", "Passos Fixos", "Previsível", "Agenda Visual", "Caminho Claro"], accessibilityRules: ["elementos recorrentes mantêm posição", "agenda visual presente", "linguagem literal", "mudanças são antecipadas"], minContrast: 4.5 },
  { id: "easy-reading", label: "Leitura fácil", kind: "inclusion", description: "Compreensão com baixa densidade", direction: "frases simples, imagem concreta e uma ação por vez", fontFamily: "Atkinson Hyperlegible, Arial, sans-serif", palette: ["#FFFDF7", "#FFFFFF", "#202A35", "#626E79", "#2E7D5B", "#FFFFFF"], names: ["Leitura Fácil", "Ideia Única", "Imagem e Palavra", "Passo Simples", "Compreender", "Exemplo Concreto", "Frase Direta", "Aprender Juntos", "Resumo Visual", "Ação Clara"], accessibilityRules: ["uma ideia por slide", "frases em ordem direta", "imagem concreta apoia o texto", "sem linguagem figurada ambígua"], minContrast: 4.5 },
  { id: "hearing-multimodal", label: "Deficiência auditiva", kind: "inclusion", description: "Conteúdo visual independente de áudio", direction: "legendas, transcrição e sinais visuais equivalentes ao som", fontFamily: "Atkinson Hyperlegible, Arial, sans-serif", palette: ["#F5F8FF", "#FFFFFF", "#17213A", "#606B82", "#5546C7", "#FFFFFF"], names: ["Legenda Viva", "Visual Completo", "Sem Perder Nada", "Transcrição", "Sinal Visual", "Fala Escrita", "Ritmo Legendado", "Conteúdo Equivalente", "Voz Visível", "Multimodal"], accessibilityRules: ["áudio sempre tem transcrição", "legendas reservam zona estável", "alertas sonoros têm equivalente visual", "vídeo não inicia automaticamente"], minContrast: 4.5 },
];

export const PRESENTATION_THEME_CATEGORIES: ThemeCategory[] = CATEGORY_SOURCES.map(
  ({ id, label, kind, description }) => ({ id, label, kind, description }),
);

function slugify(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export const PRESENTATION_THEME_LIBRARY: PresentationThemeDefinition[] = CATEGORY_SOURCES.flatMap(
  (category) => category.names.map((name, index) => {
    const composition = COMPOSITION_SYSTEMS[index];
    return {
      id: `${category.id}-${slugify(name)}`,
      name,
      description: `${category.description} em uma composição ${composition.label.toLowerCase()}.`,
      categoryId: category.id,
      categoryKind: category.kind,
      composition: composition.id,
      artDirection: `${category.direction}; ${composition.description}`,
      imageTreatment: composition.imageTreatment,
      titleTreatment: composition.titleTreatment,
      signatureElement: composition.signatureElement,
      fontFamily: category.fontFamily,
      density: composition.density,
      colors: {
        canvas: category.palette[0],
        surface: category.palette[1],
        ink: category.palette[2],
        muted: category.palette[3],
        accent: category.palette[4],
        onAccent: category.palette[5],
      },
      accessibilityProfile: category.kind === "inclusion" ? {
        certifiedFor: category.id,
        rules: category.accessibilityRules ?? [],
        reducedMotion: true,
        minContrast: category.minContrast ?? 4.5,
      } : undefined,
    } satisfies PresentationThemeDefinition;
  }),
);

const THEME_BY_ID = new Map(PRESENTATION_THEME_LIBRARY.map((theme) => [theme.id, theme]));

export function getPresentationTheme(id: string | null | undefined) {
  return id ? THEME_BY_ID.get(id) : undefined;
}

export function filterThemesByCategory(categoryId: string) {
  return PRESENTATION_THEME_LIBRARY.filter((theme) => theme.categoryId === categoryId);
}

export function searchPresentationThemes(query: string, categoryId?: string) {
  const normalized = query.trim().toLocaleLowerCase("pt-BR");
  return PRESENTATION_THEME_LIBRARY.filter((theme) => {
    if (categoryId && theme.categoryId !== categoryId) return false;
    if (!normalized) return true;
    return `${theme.name} ${theme.description} ${theme.artDirection}`.toLocaleLowerCase("pt-BR").includes(normalized);
  });
}
