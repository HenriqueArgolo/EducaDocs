import type { GeneratedDocument } from "./types";

export interface PrintableQuestion {
  number: number;
  statement: string;
  type: string;
  alternatives: string[];
  correctAnswer?: string;
  bnccSkill?: string;
  difficulty?: string;
}

export interface PrintableCriterionLevel {
  level: string;
  description: string;
  score: number;
}

export interface PrintableCriterion {
  name: string;
  description: string;
  levels: PrintableCriterionLevel[];
}

export interface PrintableEarlyLiteracyItem {
  word: string;
  figure: string;
  boxes: number;
  options: string[];
  imagemUrl?: string;
  response?: string;
}

export interface PrintableWordSearchData {
  grid: string[][];
  words: string[];
}

export interface PrintableCrosswordClue {
  number: number;
  direction: string;
  figure: string;
  word: string;
  row: number;
  col: number;
}

export interface PrintableSceneQuestion {
  text: string;
  answer: string;
}

export interface PrintableColumnMatchData {
  leftColumn: Array<{ figure: string; imagemUrl?: string }>;
  rightColumn: string[];
}

export interface PrintableEarlyLiteracyActivity {
  number: number;
  type: string;
  command: string;
  items: PrintableEarlyLiteracyItem[];
  // Word search
  wordSearch?: PrintableWordSearchData;
  // Crossword
  crosswordClues?: PrintableCrosswordClue[];
  // Scene
  scene?: string;
  sceneFigures?: string[];
  sceneQuestions?: PrintableSceneQuestion[];
  // Column match
  columnMatch?: PrintableColumnMatchData;
}

export type PrintableBlock =
  | { type: "text"; value: string }
  | { type: "list"; values: string[] }
  | { type: "stages"; values: PrintableStage[] }
  | { type: "questions"; values: PrintableQuestion[] }
  | { type: "criteria"; values: PrintableCriterion[] }
  | { type: "earlyLiteracyActivities"; values: PrintableEarlyLiteracyActivity[] };

export interface PrintableStage {
  title: string;
  duration?: string;
  description: string;
}

export interface PrintableSection {
  title: string;
  block: PrintableBlock;
}

export interface PrintableGroup {
  title: string;
  sections: PrintableSection[];
}

export interface PrintableDocument {
  title: string;
  sections: PrintableSection[];
  groups: PrintableGroup[];
}

type JsonObject = Record<string, unknown>;

export function normalizeDocumentJson(content: string) {
  return content
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```$/i, "")
    .trim();
}

export function buildPrintableDocument(document: GeneratedDocument): PrintableDocument | null {
  const structured = parseDocumentContent(document.content);
  if (!structured) {
    return null;
  }

  if (isInitialLiteracyAssessment(structured)) {
    return buildInitialLiteracyDocument(document, structured);
  }

  if (document.type === "EXAM") {
    return buildExamDocument(document, structured);
  }

  if (document.type === "RUBRIC") {
    return buildRubricDocument(document, structured);
  }

  if (document.type === "REPORT") {
    return buildReportDocument(document, structured);
  }

  if (isCanonicalLessonPlan(structured)) {
    return buildLessonPlanDocument(document, structured);
  }

  return buildGenericDocument(document, structured);
}

export function parseDocumentContent(content: string): JsonObject | null {
  try {
    const parsed = JSON.parse(normalizeDocumentJson(content)) as unknown;
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? (parsed as JsonObject)
      : null;
  } catch {
    return null;
  }
}

function buildLessonPlanDocument(
  document: GeneratedDocument,
  structured: JsonObject
): PrintableDocument {
  const planSections = compactSections([
    textSection("1. Tema", structured.tema),
    listSection("2. Objetivos de Aprendizagem", structured.objetivosDeAprendizagem),
    listSection("3. Conteudo", structured.conteudo),
    methodologySection("4. Metodologia", structured.metodologia),
    listSection("5. Recursos Didaticos", structured.recursosDidaticos),
    evaluationSection("6. Avaliacao", structured.avaliacao),
    estimatedTimeSection("7. Tempo Estimado", structured.tempoEstimado),
  ]);
  const groups = kitGroups(structured.kitAulaCompleta);
  groups.unshift({ title: "Plano", sections: planSections });

  return {
    title: "PLANO DE AULA",
    sections: planSections,
    groups,
  };
}

function buildExamDocument(
  document: GeneratedDocument,
  structured: JsonObject
): PrintableDocument {
  if (isEarlyChildhoodObservation(structured)) {
    return buildEarlyChildhoodObservationDocument(document, structured);
  }
  if (isInitialLiteracyAssessment(structured)) {
    return buildInitialLiteracyDocument(document, structured);
  }

  const sections: PrintableSection[] = [];

  // Orientações Gerais
  const orientacoes = listValues(structured.orientacoesGerais);
  if (orientacoes.length > 0) {
    sections.push({
      title: "Orientações Gerais",
      block: { type: "list", values: orientacoes }
    });
  }

  // Questões
  const rawQuestions = Array.isArray(structured.questoes) ? structured.questoes : [];
  const questions: PrintableQuestion[] = rawQuestions.map((item) => {
    const q = objectValue(item);

    return {
      number: Number(q.numero || q.numeroQuestao || 0),
      statement: String(q.enunciado || ""),
      type: String(q.tipo || "OBJETIVA"),
      alternatives: Array.isArray(q.alternativas) ? q.alternativas.map(String) : [],
      correctAnswer: q.respostaCorreta ? String(q.respostaCorreta) : undefined,
      bnccSkill: q.habilidadeBnccAvaliador ? String(q.habilidadeBnccAvaliador) : undefined,
      difficulty: q.nivelDificuldade ? String(q.nivelDificuldade) : undefined,
    };
  });

  if (questions.length > 0) {
    sections.push({
      title: "Questões",
      block: { type: "questions", values: questions }
    });
  }

  const groups: PrintableGroup[] = [
    { title: "Avaliação", sections }
  ];

  // Gabarito e Orientações
  const teacherSections: PrintableSection[] = [];

  const rawGabarito = Array.isArray(structured.gabaritoProfessor) ? structured.gabaritoProfessor : [];
  const gabaritoLines = rawGabarito.map((item) => {
    const g = objectValue(item);
    const qNum = g.numeroQuestao || g.numero || "";
    const resp = g.resposta || "";
    const just = g.justificativaPedagogica || "";
    return `Questão ${qNum}: Resposta correta: ${resp}${just ? `\nJustificativa: ${just}` : ""}`;
  });

  if (gabaritoLines.length > 0) {
    teacherSections.push({
      title: "Gabarito de Respostas",
      block: { type: "list", values: gabaritoLines }
    });
  }

  const criterios = listValues(structured.criteriosCorrecao);
  if (criterios.length > 0) {
    teacherSections.push({
      title: "Critérios de Correção",
      block: { type: "list", values: criterios }
    });
  }

  const adapt = structured.adaptacoesInclusivas;
  if (adapt && typeof adapt === "object" && !Array.isArray(adapt)) {
    const adaptObj = adapt as JsonObject;
    const adaptLines: string[] = [];
    if (adaptObj.leitura) adaptLines.push(`Leitura: ${textValue(adaptObj.leitura)}`);
    if (adaptObj.execucao) adaptLines.push(`Execução: ${textValue(adaptObj.execucao)}`);

    if (adaptLines.length > 0) {
      teacherSections.push({
        title: "Adaptações Inclusivas Sugeridas",
        block: { type: "list", values: adaptLines }
      });
    }
  }

  if (teacherSections.length > 0) {
    groups.push({
      title: "Gabarito e Orientações do Professor",
      sections: teacherSections
    });
  }

  return {
    title: textValue(structured.titulo) || document.title,
    sections,
    groups
  };
}

function isEarlyChildhoodObservation(structured: JsonObject) {
  return textValue(structured.tipoAvaliacao).toUpperCase() === "OBSERVACAO_INFANTIL"
    || (Array.isArray(structured.indicadoresObservaveis) && !Array.isArray(structured.questoes));
}

function isInitialLiteracyAssessment(structured: JsonObject) {
  const layout = textValue(structured.layout).toUpperCase();
  return textValue(structured.tipoAvaliacao).toUpperCase() === "ALFABETIZACAO_INICIAL"
    || layout === "ALFABETIZACAO_VISUAL"
    || layout === "ALFABETIZACAO_VISUAL_V2"
    || (Array.isArray(structured.atividadesVisuais) && !Array.isArray(structured.questoes))
    || (Array.isArray(structured.exercicios) && layout.startsWith("ALFABETIZACAO_VISUAL"));
}

function buildInitialLiteracyDocument(
  document: GeneratedDocument,
  structured: JsonObject
): PrintableDocument {
  const activities = normalizeEarlyLiteracyActivities(structured.atividadesVisuais || structured.exercicios);
  const sections = compactSections([
    listSection("Orientacoes", structured.orientacoesGerais) || textSection("Orientacoes", structured.instrucoes_alunos),
    activities.length > 0
      ? {
          title: "Atividades",
          block: { type: "earlyLiteracyActivities", values: activities },
        }
      : null,
  ]);

  return {
    title: textValue(structured.titulo) || document.title,
    sections,
    groups: [{ title: "Atividade do Aluno", sections }],
  };
}

function normalizeEarlyLiteracyActivities(value: unknown): PrintableEarlyLiteracyActivity[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((activity, index) => {
      const item = objectValue(activity);
      const rawItems = Array.isArray(item.itens) ? item.itens : [];

      return {
        number: Number(item.numero || index + 1),
        type: textValue(item.tipo),
        command: textValue(item.comando || item.enunciado),
        items: rawItems.map((rawItem) => {
          const normalizedItem = objectValue(rawItem);
          const imgUrl = textValue(normalizedItem.imagemUrl || normalizedItem.imageUrl);
          return {
            word: textValue(normalizedItem.palavra || normalizedItem.word),
            figure: textValue(normalizedItem.figura || normalizedItem.figure),
            boxes: Number(normalizedItem.caixasResposta || normalizedItem.caixas || 0),
            options: listValues(normalizedItem.opcoes || normalizedItem.options),
            ...(imgUrl ? { imagemUrl: imgUrl } : {}),
          };
        }),
      };
    })
    .filter((activity) => activity.command || activity.items.length > 0);
}

function buildEarlyChildhoodObservationDocument(
  document: GeneratedDocument,
  structured: JsonObject
): PrintableDocument {
  const observationSections = compactSections([
    listSection("Orientacoes Gerais", structured.orientacoesGerais),
    textSection("Contexto da Observacao", structured.contextoObservacao),
    observationIndicatorsSection(structured.indicadoresObservaveis),
  ]);

  const teacherSections = compactSections([
    teacherRecordsSection(structured.registrosProfessor),
    listSection("Sugestoes de Intervencao", structured.sugestoesIntervencao),
    listSection("Adaptacoes Inclusivas", structured.adaptacoesInclusivas),
  ]);

  const groups = [
    kitGroup("Roteiro de Observacao", observationSections),
    kitGroup("Registros e Intervencoes", teacherSections),
  ].filter((group): group is PrintableGroup => group !== null);

  return {
    title: textValue(structured.titulo) || document.title,
    sections: [...observationSections, ...teacherSections],
    groups,
  };
}

function observationIndicatorsSection(value: unknown): PrintableSection | null {
  if (!Array.isArray(value)) {
    return listSection("Indicadores Observaveis", value);
  }

  const values = value
    .map((item) => {
      if (!item || typeof item !== "object" || Array.isArray(item)) {
        return textValue(item);
      }

      const indicator = item as JsonObject;
      const lines = [
        textValue(indicator.indicador),
        labeledValue("O que observar", indicator.oQueObservar),
        labeledList("Possiveis registros", indicator.possiveisRegistros),
        labeledList("Perguntas mediadoras", indicator.perguntasMediadoras),
      ].filter(Boolean);

      return lines.join("\n");
    })
    .filter(Boolean);

  return values.length > 0
    ? { title: "Indicadores Observaveis", block: { type: "list", values } }
    : null;
}

function teacherRecordsSection(value: unknown): PrintableSection | null {
  if (!Array.isArray(value)) {
    return listSection("Registros do Professor", value);
  }

  const values = value
    .map((item) => {
      if (!item || typeof item !== "object" || Array.isArray(item)) {
        return textValue(item);
      }

      const record = item as JsonObject;
      const field = textValue(record.campo);
      const guidance = textValue(record.orientacao);
      return [field, guidance].filter(Boolean).join(": ");
    })
    .filter(Boolean);

  return values.length > 0
    ? { title: "Registros do Professor", block: { type: "list", values } }
    : null;
}

function labeledValue(label: string, value: unknown) {
  const text = textValue(value);
  return text ? `${label}: ${text}` : "";
}

function labeledList(label: string, value: unknown) {
  const values = listValues(value);
  return values.length > 0 ? `${label}: ${values.join("; ")}` : "";
}

function buildRubricDocument(
  document: GeneratedDocument,
  structured: JsonObject
): PrintableDocument {
  const sections: PrintableSection[] = [];

  const contexto = textValue(structured.contextoAvaliacao);
  if (contexto) {
    sections.push({
      title: "Contexto da Avaliação",
      block: { type: "text", value: contexto }
    });
  }

  const rawCriteria = Array.isArray(structured.criterios) ? structured.criterios : [];
  const criteria: PrintableCriterion[] = rawCriteria.map((item) => {
    const c = objectValue(item);
    const rawLevels = Array.isArray(c.niveisDesempenho) ? c.niveisDesempenho : [];
    return {
      name: String(c.nomeCriterio || c.nome || ""),
      description: String(c.descricao || ""),
      levels: rawLevels.map((level) => {
        const l = objectValue(level);

        return {
          level: String(l.nivel || ""),
          description: String(l.descricao || ""),
          score: Number(l.pontuacao ?? l.pontos ?? 0),
        };
      }),
    };
  });

  if (criteria.length > 0) {
    sections.push({
      title: "Critérios de Desempenho",
      block: { type: "criteria", values: criteria }
    });
  }

  const orientacoes = listValues(structured.orientacoesUso);
  if (orientacoes.length > 0) {
    sections.push({
      title: "Orientações de Uso",
      block: { type: "list", values: orientacoes }
    });
  }

  const adaptacoes = listValues(structured.adaptacoesInclusivas);
  if (adaptacoes.length > 0) {
    sections.push({
      title: "Adaptações Inclusivas",
      block: { type: "list", values: adaptacoes }
    });
  }

  return {
    title: textValue(structured.titulo) || document.title,
    sections,
    groups: [{ title: "Rubrica", sections }]
  };
}

function buildReportDocument(
  document: GeneratedDocument,
  structured: JsonObject
): PrintableDocument {
  const sections = compactSections([
    textSection("1. Contexto da Turma", structured.contextoTurma),
    listSection("2. Análise de Desenvolvimento", structured.analiseDesenvolvimento),
    listSection("3. Habilidades Trabalhadas", structured.habilidadesTrabalhadas),
    listSection("4. Desafios Identificados", structured.desafiosIdentificados),
    listSection("5. Recomendações e Próximos Passos", structured.recomendacoesProximosPassos),
    textSection("6. Observações Finais", structured.observacoesFinais),
  ]);

  return {
    title: textValue(structured.titulo) || document.title,
    sections,
    groups: [{ title: "Relatório", sections }]
  };
}

function buildGenericDocument(
  document: GeneratedDocument,
  structured: JsonObject
): PrintableDocument {
  const sections = compactSections([
    textSection("1. Objetivo", structured.objective),
    listSection("2. Habilidades BNCC", structured.bncc_alignment),
    textSection("3. Metodologia", structured.methodology),
    listSection("4. Atividades detalhadas", structured.activities),
    listSection("5. Recursos didaticos", structured.resources),
    textSection("6. Avaliacao", structured.assessment),
    textSection("7. Conteudo detalhado", structured.detailed_content),
    textSection("8. Observacoes do professor", structured.teacher_notes),
  ]);

  return {
    title: textValue(structured.title) || document.title,
    sections,
    groups: [{ title: "Documento", sections }],
  };
}

function kitGroups(value: unknown): PrintableGroup[] {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return [];
  }

  const kit = value as JsonObject;
  return [
    kitGroup("Atividade", studentActivitySections(kit.atividadeAluno)),
    kitGroup("Gabarito", teacherAnswerKeySections(kit.gabaritoProfessor)),
    kitGroup("Avaliacao", assessmentInstrumentSections(kit.instrumentoAvaliativo)),
    kitGroup("Evidencias", pedagogicalEvidenceSections(kit.evidenciasPedagogicas)),
    kitGroup("Adaptacoes", inclusiveAdaptationSections(kit.adaptacoesInclusivas)),
  ].filter((group): group is PrintableGroup => group !== null);
}

function kitGroup(title: string, sections: PrintableSection[]): PrintableGroup | null {
  return sections.length > 0 ? { title, sections } : null;
}

function studentActivitySections(value: unknown): PrintableSection[] {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return [];
  }

  const activity = value as JsonObject;
  return compactSections([
    textSection("Atividade do Aluno", activity.titulo),
    textSection("Contexto", activity.contexto),
    listSection("Orientacoes", activity.orientacoes),
    listSection("Questoes", activity.questoes),
    textSection("Produto Esperado", activity.produtoEsperado),
  ]);
}

function teacherAnswerKeySections(value: unknown): PrintableSection[] {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return [];
  }

  const answerKey = value as JsonObject;
  return compactSections([
    listSection("Respostas Esperadas", answerKey.respostasEsperadas),
    listSection("Orientacoes do Professor", answerKey.orientacoesProfessor),
  ]);
}

function assessmentInstrumentSections(value: unknown): PrintableSection[] {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return [];
  }

  const instrument = value as JsonObject;
  return compactSections([
    listSection("Criterios", instrument.criterios),
    listSection("Coleta de Evidencias", instrument.coletaEvidencias),
  ]);
}

function pedagogicalEvidenceSections(value: unknown): PrintableSection[] {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return [];
  }

  const evidence = value as JsonObject;
  return compactSections([
    listSection("Evidencias Observaveis", evidence.evidenciasObservaveis),
    listSection("Registros para Coordenacao", evidence.registrosParaCoordenacao),
  ]);
}

function inclusiveAdaptationSections(value: unknown): PrintableSection[] {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return [];
  }

  const adaptations = value as JsonObject;
  return compactSections([
    listSection("Apoio de Leitura", adaptations.apoioLeitura),
    listSection("Apoio de Participacao", adaptations.apoioParticipacao),
    listSection("Alternativas Simplificadas", adaptations.alternativasSimplificadas),
  ]);
}

function isCanonicalLessonPlan(structured: JsonObject) {
  return Array.isArray(structured.objetivosDeAprendizagem);
}

function compactSections(sections: Array<PrintableSection | null>) {
  return sections.filter((section): section is PrintableSection => section !== null);
}

function textSection(title: string, value: unknown): PrintableSection | null {
  const text = textValue(value);
  return text ? { title, block: { type: "text", value: text } } : null;
}

function listSection(title: string, value: unknown): PrintableSection | null {
  const values = listValues(value);
  return values.length > 0 ? { title, block: { type: "list", values } } : null;
}

function methodologySection(title: string, value: unknown): PrintableSection | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return textSection(title, value);
  }

  const methodology = value as JsonObject;
  const stages = [
    stageValue("Introducao", methodology.introducao),
    stageValue("Desenvolvimento", methodology.desenvolvimento),
    stageValue("Fechamento", methodology.fechamento),
  ].filter((stage): stage is PrintableStage => stage !== null);

  return stages.length > 0 ? { title, block: { type: "stages", values: stages } } : null;
}

function evaluationSection(title: string, value: unknown): PrintableSection | null {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    const criteria = listValues((value as JsonObject).criteriosObservaveis);
    if (criteria.length > 0) {
      return { title, block: { type: "list", values: criteria } };
    }
  }

  return listSection(title, value) || textSection(title, value);
}

function estimatedTimeSection(title: string, value: unknown): PrintableSection | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return textSection(title, value);
  }

  const time = value as JsonObject;
  const values = [
    timeLine("Introducao", time.introducao),
    timeLine("Desenvolvimento", time.desenvolvimento),
    timeLine("Fechamento", time.fechamento),
    timeLine("Total", time.total),
  ].filter((line): line is string => Boolean(line));

  return values.length > 0 ? { title, block: { type: "list", values } } : null;
}

function stageValue(title: string, value: unknown): PrintableStage | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    const description = textValue(value);
    return description ? { title, description } : null;
  }

  const stage = value as JsonObject;
  const description = textValue(stage.descricao);
  const duration = minutesValue(stage.tempoMinutos);

  if (!description && !duration) {
    return null;
  }

  return {
    title,
    duration,
    description,
  };
}

function timeLine(label: string, value: unknown) {
  const minutes = minutesValue(value);
  return minutes ? `${label}: ${minutes}` : "";
}

function minutesValue(value: unknown) {
  const text = textValue(value);
  return text ? `${text} min` : "";
}

function listValues(value: unknown): string[] {
  if (!Array.isArray(value)) {
    const text = textValue(value);
    return text ? [text] : [];
  }

  return value.map(textValue).filter(Boolean);
}

function textValue(value: unknown): string {
  if (typeof value === "string") {
    return value.trim();
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  if (value && typeof value === "object" && !Array.isArray(value)) {
    return Object.entries(value)
      .map(([key, item]) => `${key}: ${textValue(item)}`)
      .join(" | ")
      .trim();
  }

  return "";
}

function objectValue(value: unknown): JsonObject {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as JsonObject
    : {};
}
