import assert from "node:assert/strict";

import {
  EDUCATION_STAGE_OPTIONS,
  filterSkillsForSelection,
  getBnccRecommendationParams,
  getGradeOptionsForStage,
  getSubjectOptionsForSelection,
} from "../src/lib/bncc-taxonomy.ts";

const skills = [
  {
    id: 1,
    code: "EI03TS03",
    description: "Expressar-se por meio de linguagens artísticas.",
    grade: "Crianças pequenas (4a a 5a11m)",
    subject: "Traços, sons, cores e formas",
  },
  {
    id: 2,
    code: "EF06HI01",
    description: "Identificar diferentes formas de compreensão da noção de tempo.",
    grade: "6º ano",
    subject: "História",
  },
  {
    id: 3,
    code: "EF69HI01",
    description: "Reconhecer processos históricos em diferentes tempos.",
    grade: "6º ao 9º ano",
    subject: "História",
  },
  {
    id: 4,
    code: "EF05LP01",
    description: "Grafar palavras utilizando regras de correspondência.",
    grade: "5º ano",
    subject: "Língua Portuguesa",
  },
  {
    id: 5,
    code: "EM13LP01",
    description: "Relacionar o texto a seus contextos de produção.",
    grade: "Ensino Médio",
    subject: "Língua Portuguesa",
  },
  {
    id: 6,
    code: "EM13CHS605",
    description: "Analisar os princípios da declaração dos Direitos Humanos.",
    grade: "Ensino Médio",
    subject: "Ciências Humanas e Sociais Aplicadas",
  },
];

assert.deepEqual(
  EDUCATION_STAGE_OPTIONS.map((option) => option.label),
  ["Educação Infantil", "Ensino Fundamental I", "Ensino Fundamental II", "Ensino Médio"]
);

assert.deepEqual(
  getGradeOptionsForStage("FUNDAMENTAL_II").map((option) => option.label),
  ["6º ano", "7º ano", "8º ano", "9º ano"]
);

assert.equal(
  getGradeOptionsForStage("FUNDAMENTAL_II").some((option) => option.label.includes("ao")),
  false
);

assert.deepEqual(
  getSubjectOptionsForSelection(skills, "FUNDAMENTAL_II", "6").map(({ label, value }) => ({ label, value })),
  [{ label: "História", value: "HISTORIA" }]
);

assert.deepEqual(
  filterSkillsForSelection(skills, "FUNDAMENTAL_II", "6", "HISTORIA").map((skill) => skill.code),
  ["EF06HI01", "EF69HI01"]
);

assert.deepEqual(
  getSubjectOptionsForSelection(skills, "ENSINO_MEDIO", "EM_1").map((option) => option.label),
  ["Linguagens e suas Tecnologias", "Ciências Humanas e Sociais Aplicadas"]
);

assert.deepEqual(
  filterSkillsForSelection(skills, "ENSINO_MEDIO", "EM_1", "LINGUAGENS").map((skill) => skill.code),
  ["EM13LP01"]
);

assert.deepEqual(
  filterSkillsForSelection(skills, "EDUCACAO_INFANTIL", "CRIANCAS_PEQUENAS", "TRACOS_SONS_CORES_FORMAS").map(
    (skill) => skill.code
  ),
  ["EI03TS03"]
);

assert.deepEqual(getBnccRecommendationParams("FUNDAMENTAL_I", "1", "PORTUGUES"), {
  grade: "1º ano",
  subject: "Língua Portuguesa",
});

assert.deepEqual(getBnccRecommendationParams("ENSINO_MEDIO", "EM_1", "LINGUAGENS"), {
  grade: "Ensino Médio",
  subject: "Linguagens e suas Tecnologias",
});
