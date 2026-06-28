import assert from "node:assert/strict";

import { buildPrintableDocument } from "../src/lib/document-rendering.ts";

const lessonPlan = buildPrintableDocument({
  id: 1,
  userId: 7,
  type: "LESSON_PLAN",
  title: "Plano de aula - Fracoes equivalentes",
  grade: "5 ano",
  subject: "Matematica",
  createdAt: "2026-06-21T19:00:00Z",
  content: JSON.stringify({
    tema: "Fracoes equivalentes",
    disciplina: "Matematica",
    ano: "5 ano",
    habilidadesBncc: [{ codigo: "EF05MA03", descricao: "Identificar fracoes equivalentes" }],
    objetivosDeAprendizagem: [
      "Identificar fracoes equivalentes",
      "Comparar representacoes fracionarias",
      "Resolver problemas com fracoes",
    ],
    conteudo: ["Representacao de fracoes", "Equivalencia entre fracoes", "Resolucao de problemas"],
    metodologia: {
      introducao: { tempoMinutos: 10, descricao: "Ativar conhecimentos previos" },
      desenvolvimento: { tempoMinutos: 30, descricao: "Resolver atividade em duplas" },
      fechamento: { tempoMinutos: 10, descricao: "Sistematizar aprendizagens" },
    },
    recursosDidaticos: ["Quadro branco", "Cartoes de fracoes", "Caderno"],
    avaliacao: {
      criteriosObservaveis: [
        "Identifica fracoes equivalentes",
        "Compara representacoes",
        "Registra estrategias",
      ],
    },
    tempoEstimado: { introducao: 10, desenvolvimento: 30, fechamento: 10, total: 50 },
  }),
});

assert.equal(lessonPlan?.title, "PLANO DE AULA");
assert.deepEqual(
  lessonPlan?.sections.map((section) => section.title),
  [
    "1. Tema",
    "2. Objetivos de Aprendizagem",
    "3. Conteudo",
    "4. Metodologia",
    "5. Recursos Didaticos",
    "6. Avaliacao",
    "7. Tempo Estimado",
  ]
);

const methodology = lessonPlan?.sections.find((section) => section.title === "4. Metodologia")?.block;
assert.equal(methodology?.type, "stages");
assert.deepEqual(methodology?.values, [
  { title: "Introducao", duration: "10 min", description: "Ativar conhecimentos previos" },
  { title: "Desenvolvimento", duration: "30 min", description: "Resolver atividade em duplas" },
  { title: "Fechamento", duration: "10 min", description: "Sistematizar aprendizagens" },
]);

const estimatedTime = lessonPlan?.sections.find((section) => section.title === "7. Tempo Estimado")?.block;
assert.equal(estimatedTime?.type, "list");
assert.deepEqual(estimatedTime?.values, [
  "Introducao: 10 min",
  "Desenvolvimento: 30 min",
  "Fechamento: 10 min",
  "Total: 50 min",
]);

const renderedText = JSON.stringify(lessonPlan);
assert.equal(renderedText.includes("Representacao de fracoes"), true);
assert.equal(renderedText.includes("Identifica fracoes equivalentes"), true);
assert.equal(renderedText.includes("codigo"), false);
assert.equal(renderedText.includes("EF05MA03"), false);

const completeKitPlan = buildPrintableDocument({
  id: 2,
  userId: 7,
  type: "LESSON_PLAN",
  title: "Plano de aula - Fracoes equivalentes",
  grade: "5 ano",
  subject: "Matematica",
  createdAt: "2026-06-21T19:00:00Z",
  content: JSON.stringify({
    tema: "Fracoes equivalentes",
    disciplina: "Matematica",
    ano: "5 ano",
    habilidadesBncc: [{ codigo: "EF05MA03", descricao: "Identificar fracoes equivalentes" }],
    objetivosDeAprendizagem: ["Identificar fracoes equivalentes"],
    conteudo: ["Representacao de fracoes"],
    metodologia: {
      introducao: { tempoMinutos: 10, descricao: "Ativar conhecimentos previos" },
      desenvolvimento: { tempoMinutos: 30, descricao: "Resolver atividade em duplas" },
      fechamento: { tempoMinutos: 10, descricao: "Sistematizar aprendizagens" },
    },
    recursosDidaticos: ["Quadro branco", "Cartoes de fracoes", "Caderno"],
    avaliacao: { criteriosObservaveis: ["Identifica fracoes equivalentes"] },
    tempoEstimado: { introducao: 10, desenvolvimento: 30, fechamento: 10, total: 50 },
    kitAulaCompleta: {
      atividadeAluno: {
        titulo: "Linha do tempo das fracoes",
        contexto: "Organizar representacoes de fracoes para explicar equivalencias.",
        orientacoes: ["Leia cada cartao", "Agrupe representacoes", "Explique uma equivalencia"],
        questoes: ["Quais fracoes sao equivalentes?", "Como voce comparou?", "Que estrategia ajudou?"],
        produtoEsperado: "Registro com grupos de fracoes equivalentes",
      },
      gabaritoProfessor: {
        respostasEsperadas: ["Fracoes equivalentes representam a mesma quantidade", "A comparacao pode usar desenho", "A justificativa deve explicar a relacao"],
        orientacoesProfessor: ["Valorizar estrategias visuais", "Pedir justificativas orais"],
      },
      instrumentoAvaliativo: {
        criterios: ["Identifica fracoes equivalentes", "Compara representacoes", "Registra justificativas"],
        coletaEvidencias: ["Recolher registros", "Anotar falas"],
      },
      evidenciasPedagogicas: {
        evidenciasObservaveis: ["Agrupamento correto", "Justificativas matematicas", "Discussao em grupo"],
        registrosParaCoordenacao: ["Foto dos agrupamentos", "Amostra dos registros"],
      },
      adaptacoesInclusivas: {
        apoioLeitura: ["Fonte ampliada", "Leitura compartilhada"],
        apoioParticipacao: ["Resposta oral", "Papeis simples"],
        alternativasSimplificadas: ["Menos cartoes", "Desenhos de apoio"],
      },
    },
  }),
});

assert.deepEqual(
  completeKitPlan?.groups.map((group) => group.title),
  ["Plano", "Atividade", "Gabarito", "Avaliacao", "Evidencias", "Adaptacoes"]
);
assert.equal(JSON.stringify(completeKitPlan).includes("Linha do tempo das fracoes"), true);
assert.equal(JSON.stringify(completeKitPlan).includes("kitAulaCompleta"), false);

const earlyChildhoodObservation = buildPrintableDocument({
  id: 3,
  userId: 7,
  type: "EXAM",
  title: "Explorando as Cores da Natureza",
  grade: "Criancas pequenas",
  subject: "Tracos, sons, cores e formas",
  createdAt: "2026-06-25T19:00:00Z",
  content: JSON.stringify({
    titulo: "Explorando as Cores da Natureza",
    tipoAvaliacao: "OBSERVACAO_INFANTIL",
    orientacoesGerais: ["Disponha elementos naturais coloridos para livre exploracao."],
    contextoObservacao: "Observe as criancas durante uma proposta de exploracao de cores no jardim.",
    indicadoresObservaveis: [
      {
        indicador: "Exploracao de cores",
        oQueObservar: "A crianca observa, aponta, escolhe ou nomeia cores presentes em elementos naturais.",
        possiveisRegistros: ["Apontou uma flor vermelha", "Separou folhas verdes"],
        perguntasMediadoras: ["Que cor voce encontrou?", "Onde mais vemos essa cor?"],
      },
    ],
    registrosProfessor: [
      {
        campo: "Falas e gestos observados",
        orientacao: "Registre palavras, gestos, escolhas e interacoes sem exigir resposta escrita.",
      },
    ],
    sugestoesIntervencao: ["Ofereca objetos reais e tempo para exploracao sensorial."],
    adaptacoesInclusivas: {
      participacao: "Permita respostas por gesto, olhar, escolha de objeto ou fala espontanea.",
    },
  }),
});

assert.equal(earlyChildhoodObservation?.title, "Explorando as Cores da Natureza");
assert.deepEqual(
  earlyChildhoodObservation?.groups.map((group) => group.title),
  ["Roteiro de Observacao", "Registros e Intervencoes"]
);
assert.equal(JSON.stringify(earlyChildhoodObservation).includes("Questoes"), false);
assert.equal(JSON.stringify(earlyChildhoodObservation).includes("Exploracao de cores"), true);
assert.equal(JSON.stringify(earlyChildhoodObservation).includes("sem exigir resposta escrita"), true);

const initialLiteracyActivity = buildPrintableDocument({
  id: 4,
  userId: 7,
  type: "EXAM",
  title: "Separando Silabas",
  grade: "1 ano",
  subject: "Lingua Portuguesa",
  createdAt: "2026-06-25T19:00:00Z",
  content: JSON.stringify({
    titulo: "Separando Silabas",
    tipoAvaliacao: "ALFABETIZACAO_INICIAL",
    orientacoesGerais: ["Professor(a), leia cada comando em voz alta."],
    atividadesVisuais: [
      {
        numero: 1,
        tipo: "SEPARAR_SILABAS",
        comando: "Separe as silabas.",
        itens: [
          { palavra: "BOLO", figura: "bolo", caixasResposta: 2 },
          { palavra: "MALA", figura: "mala", caixasResposta: 2 },
        ],
        gabarito: "BO-LO; MA-LA",
      },
      {
        numero: 2,
        tipo: "LETRA_INICIAL",
        comando: "Pinte a letra inicial.",
        itens: [
          { palavra: "SAPO", figura: "sapo", opcoes: ["S", "P", "O"], resposta: "S" },
        ],
        gabarito: "S",
      },
    ],
    gabaritoProfessor: [
      { numeroAtividade: 1, resposta: "BO-LO; MA-LA" },
      { numeroAtividade: 2, resposta: "S" },
    ],
  }),
});

assert.equal(initialLiteracyActivity?.title, "Separando Silabas");
assert.deepEqual(
  initialLiteracyActivity?.groups.map((group) => group.title),
  ["Atividade do Aluno"]
);

const initialLiteracyBlock = initialLiteracyActivity?.groups[0]?.sections.find(
  (section) => section.title === "Atividades"
)?.block;
assert.equal(initialLiteracyBlock?.type, "earlyLiteracyActivities");
assert.equal(initialLiteracyBlock?.values[0]?.command, "Separe as silabas.");
assert.equal(initialLiteracyBlock?.values[0]?.items[0]?.word, "BOLO");
assert.equal(initialLiteracyBlock?.values[0]?.items[0]?.boxes, 2);
assert.equal(initialLiteracyBlock?.values[1]?.items[0]?.options[0], "S");
assert.equal(JSON.stringify(initialLiteracyActivity).includes("Gabarito"), false);
assert.equal(JSON.stringify(initialLiteracyActivity).includes("BO-LO; MA-LA"), false);

const initialLiteracyActivityV2 = buildPrintableDocument({
  id: 5,
  userId: 7,
  type: "EXAM",
  title: "Animais da Fazenda",
  grade: "1 ano",
  subject: "Lingua Portuguesa",
  createdAt: "2026-06-26T19:00:00Z",
  content: JSON.stringify({
    titulo: "Animais da Fazenda",
    layout: "ALFABETIZACAO_VISUAL_V2",
    schemaVersion: 2,
    instrucoes_alunos: "Professor(a), leia os comandos em voz alta.",
    exercicios: [
      {
        numero: 1,
        tipo: "SEPARAR_SILABAS",
        comando: "Separe as silabas.",
        itens: [{ palavra: "VACA", figura: "vaca", silabas: ["VA", "CA"], caixasResposta: 2 }],
        gabarito: "VA-CA",
      },
      {
        numero: 2,
        tipo: "LETRA_INICIAL",
        comando: "Pinte a letra inicial.",
        itens: [{ palavra: "PATO", figura: "pato", opcoes: ["P", "B", "T"], resposta: "P" }],
        gabarito: "P",
      },
    ],
  }),
});

assert.equal(initialLiteracyActivityV2?.title, "Animais da Fazenda");
assert.deepEqual(
  initialLiteracyActivityV2?.groups.map((group) => group.title),
  ["Atividade do Aluno"]
);

const v2Block = initialLiteracyActivityV2?.groups[0]?.sections.find(
  (section) => section.title === "Atividades"
)?.block;
assert.equal(v2Block?.type, "earlyLiteracyActivities");
assert.equal(v2Block?.values[0]?.items[0]?.word, "VACA");
assert.equal(v2Block?.values[0]?.items[0]?.boxes, 2);
assert.equal(v2Block?.values[1]?.items[0]?.options[0], "P");
assert.equal(JSON.stringify(initialLiteracyActivityV2).includes("VA-CA"), false);

const initialLiteracyWorksheetV2 = buildPrintableDocument({
  id: 6,
  userId: 7,
  type: "WORKSHEET",
  title: "Animais da Fazenda",
  grade: "1 ano",
  subject: "Lingua Portuguesa",
  createdAt: "2026-06-26T19:00:00Z",
  content: JSON.stringify({
    titulo: "Animais da Fazenda",
    layout: "ALFABETIZACAO_VISUAL_V2",
    schemaVersion: 2,
    exercicios: [
      {
        numero: 1,
        tipo: "SEPARAR_SILABAS",
        comando: "Separe as silabas.",
        itens: [{ palavra: "VACA", figura: "vaca", caixasResposta: 2 }],
        gabarito: "VA-CA",
      },
    ],
  }),
});

assert.deepEqual(
  initialLiteracyWorksheetV2?.groups.map((group) => group.title),
  ["Atividade do Aluno"]
);
assert.equal(JSON.stringify(initialLiteracyWorksheetV2).includes("VACA"), true);
assert.equal(JSON.stringify(initialLiteracyWorksheetV2).includes("VA-CA"), false);
