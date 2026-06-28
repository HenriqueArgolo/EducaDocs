import type { BNCCSkill } from "./types";

export type EducationStageValue =
  | "EDUCACAO_INFANTIL"
  | "FUNDAMENTAL_I"
  | "FUNDAMENTAL_II"
  | "ENSINO_MEDIO";

export interface EducationStageOption {
  label: string;
  value: EducationStageValue;
}

export interface GradeOption {
  label: string;
  value: string;
  stage: EducationStageValue;
  years?: number[];
  sourceGrades?: string[];
}

export interface SubjectOption {
  label: string;
  value: string;
  sourceSubjects: string[];
}

export const EDUCATION_STAGE_OPTIONS: EducationStageOption[] = [
  { label: "Educação Infantil", value: "EDUCACAO_INFANTIL" },
  { label: "Ensino Fundamental I", value: "FUNDAMENTAL_I" },
  { label: "Ensino Fundamental II", value: "FUNDAMENTAL_II" },
  { label: "Ensino Médio", value: "ENSINO_MEDIO" },
];

const GRADE_OPTIONS: GradeOption[] = [
  {
    label: "Bebês",
    value: "BEBES",
    stage: "EDUCACAO_INFANTIL",
    sourceGrades: ["Bebês (0 a 1a6m)"],
  },
  {
    label: "Crianças bem pequenas",
    value: "CRIANCAS_BEM_PEQUENAS",
    stage: "EDUCACAO_INFANTIL",
    sourceGrades: ["Crianças bem pequenas (1a7m a 3a11m)"],
  },
  {
    label: "Crianças pequenas",
    value: "CRIANCAS_PEQUENAS",
    stage: "EDUCACAO_INFANTIL",
    sourceGrades: ["Crianças pequenas (4a a 5a11m)"],
  },
  { label: "1º ano", value: "1", stage: "FUNDAMENTAL_I", years: [1] },
  { label: "2º ano", value: "2", stage: "FUNDAMENTAL_I", years: [2] },
  { label: "3º ano", value: "3", stage: "FUNDAMENTAL_I", years: [3] },
  { label: "4º ano", value: "4", stage: "FUNDAMENTAL_I", years: [4] },
  { label: "5º ano", value: "5", stage: "FUNDAMENTAL_I", years: [5] },
  { label: "6º ano", value: "6", stage: "FUNDAMENTAL_II", years: [6] },
  { label: "7º ano", value: "7", stage: "FUNDAMENTAL_II", years: [7] },
  { label: "8º ano", value: "8", stage: "FUNDAMENTAL_II", years: [8] },
  { label: "9º ano", value: "9", stage: "FUNDAMENTAL_II", years: [9] },
  {
    label: "1º ano EM",
    value: "EM_1",
    stage: "ENSINO_MEDIO",
    sourceGrades: ["Ensino Médio"],
  },
  {
    label: "2º ano EM",
    value: "EM_2",
    stage: "ENSINO_MEDIO",
    sourceGrades: ["Ensino Médio"],
  },
  {
    label: "3º ano EM",
    value: "EM_3",
    stage: "ENSINO_MEDIO",
    sourceGrades: ["Ensino Médio"],
  },
];

const SUBJECT_OPTIONS_BY_STAGE: Record<EducationStageValue, SubjectOption[]> = {
  EDUCACAO_INFANTIL: [
    {
      label: "O eu, o outro e o nós",
      value: "O_EU_O_OUTRO_E_O_NOS",
      sourceSubjects: ["O eu, o outro e o nós"],
    },
    {
      label: "Corpo, gestos e movimentos",
      value: "CORPO_GESTOS_MOVIMENTOS",
      sourceSubjects: ["Corpo, gestos e movimentos"],
    },
    {
      label: "Traços, sons, cores e formas",
      value: "TRACOS_SONS_CORES_FORMAS",
      sourceSubjects: ["Traços, sons, cores e formas"],
    },
    {
      label: "Escuta, fala, pensamento e imaginação",
      value: "ESCUTA_FALA_PENSAMENTO_IMAGINACAO",
      sourceSubjects: ["Escuta, fala, pensamento e imaginação"],
    },
    {
      label: "Espaços, tempos, quantidades, relações e transformações",
      value: "ESPACOS_TEMPOS_QUANTIDADES_RELACOES_TRANSFORMACOES",
      sourceSubjects: ["Espaços, tempos, quantidades, relações e transformações"],
    },
  ],
  FUNDAMENTAL_I: [
    { label: "Português", value: "PORTUGUES", sourceSubjects: ["Língua Portuguesa"] },
    { label: "Matemática", value: "MATEMATICA", sourceSubjects: ["Matemática"] },
    { label: "Ciências", value: "CIENCIAS", sourceSubjects: ["Ciências"] },
    { label: "História", value: "HISTORIA", sourceSubjects: ["História"] },
    { label: "Geografia", value: "GEOGRAFIA", sourceSubjects: ["Geografia"] },
    { label: "Arte", value: "ARTE", sourceSubjects: ["Arte"] },
    {
      label: "Educação Física",
      value: "EDUCACAO_FISICA",
      sourceSubjects: ["Educação Física"],
    },
    {
      label: "Ensino Religioso",
      value: "ENSINO_RELIGIOSO",
      sourceSubjects: ["Ensino Religioso"],
    },
  ],
  FUNDAMENTAL_II: [
    { label: "História", value: "HISTORIA", sourceSubjects: ["História"] },
    { label: "Geografia", value: "GEOGRAFIA", sourceSubjects: ["Geografia"] },
    { label: "Matemática", value: "MATEMATICA", sourceSubjects: ["Matemática"] },
    { label: "Ciências", value: "CIENCIAS", sourceSubjects: ["Ciências"] },
    { label: "Português", value: "PORTUGUES", sourceSubjects: ["Língua Portuguesa"] },
    { label: "Inglês", value: "INGLES", sourceSubjects: ["Língua Inglesa"] },
    { label: "Arte", value: "ARTE", sourceSubjects: ["Arte"] },
    {
      label: "Educação Física",
      value: "EDUCACAO_FISICA",
      sourceSubjects: ["Educação Física"],
    },
    {
      label: "Ensino Religioso",
      value: "ENSINO_RELIGIOSO",
      sourceSubjects: ["Ensino Religioso"],
    },
  ],
  ENSINO_MEDIO: [
    {
      label: "Linguagens e suas Tecnologias",
      value: "LINGUAGENS",
      sourceSubjects: ["Linguagens e suas Tecnologias", "Língua Portuguesa"],
    },
    {
      label: "Matemática e suas Tecnologias",
      value: "MATEMATICA_TECNOLOGIAS",
      sourceSubjects: ["Matemática e suas Tecnologias"],
    },
    {
      label: "Ciências da Natureza e suas Tecnologias",
      value: "CIENCIAS_NATUREZA",
      sourceSubjects: ["Ciências da Natureza e suas Tecnologias"],
    },
    {
      label: "Ciências Humanas e Sociais Aplicadas",
      value: "CIENCIAS_HUMANAS",
      sourceSubjects: ["Ciências Humanas e Sociais Aplicadas"],
    },
  ],
};

export function getGradeOptionsForStage(stage: EducationStageValue) {
  return GRADE_OPTIONS.filter((option) => option.stage === stage);
}

export function getSubjectOptionsForSelection(
  skills: BNCCSkill[],
  stage: EducationStageValue,
  gradeValue: string | null
) {
  if (!gradeValue) {
    return [];
  }

  return SUBJECT_OPTIONS_BY_STAGE[stage].filter((subject) =>
    skills.some((skill) => skillMatchesSelection(skill, stage, gradeValue, subject.value))
  );
}

export function filterSkillsForSelection(
  skills: BNCCSkill[],
  stage: EducationStageValue | null,
  gradeValue: string | null,
  subjectValue: string | null
) {
  if (!stage || !gradeValue || !subjectValue) {
    return [];
  }

  return skills.filter((skill) => skillMatchesSelection(skill, stage, gradeValue, subjectValue));
}

export function getBnccRecommendationParams(
  stage: EducationStageValue | null,
  gradeValue: string | null,
  subjectValue: string | null
) {
  if (!stage || !gradeValue || !subjectValue) {
    return null;
  }

  const grade = GRADE_OPTIONS.find((option) => option.stage === stage && option.value === gradeValue);
  const subject = SUBJECT_OPTIONS_BY_STAGE[stage].find((option) => option.value === subjectValue);

  if (!grade || !subject) {
    return null;
  }

  return {
    grade: grade.sourceGrades?.[0] ?? grade.label,
    subject: subject.sourceSubjects[0] ?? subject.label,
  };
}

function skillMatchesSelection(
  skill: BNCCSkill,
  stage: EducationStageValue,
  gradeValue: string,
  subjectValue: string
) {
  const grade = GRADE_OPTIONS.find((option) => option.stage === stage && option.value === gradeValue);
  const subject = SUBJECT_OPTIONS_BY_STAGE[stage].find((option) => option.value === subjectValue);

  if (!grade || !subject) {
    return false;
  }

  return skillMatchesStage(skill, stage) && skillMatchesGrade(skill, grade) && subjectMatches(skill, subject);
}

function skillMatchesStage(skill: BNCCSkill, stage: EducationStageValue) {
  if (stage === "EDUCACAO_INFANTIL") {
    return skill.code.startsWith("EI");
  }

  if (stage === "ENSINO_MEDIO") {
    return skill.code.startsWith("EM");
  }

  return skill.code.startsWith("EF");
}

function skillMatchesGrade(skill: BNCCSkill, grade: GradeOption) {
  if (grade.sourceGrades) {
    return grade.sourceGrades.includes(skill.grade);
  }

  const selectedYear = grade.years?.[0];
  if (!selectedYear) {
    return false;
  }

  return extractYearsFromGrade(skill.grade).includes(selectedYear);
}

function subjectMatches(skill: BNCCSkill, subject: SubjectOption) {
  return subject.sourceSubjects.includes(skill.subject);
}

function extractYearsFromGrade(grade: string) {
  const years = grade.match(/\d+/g)?.map(Number) ?? [];
  if (years.length >= 2 && grade.includes("ao")) {
    const [start, end] = years;
    return Array.from({ length: end - start + 1 }, (_, index) => start + index);
  }

  return years.length > 0 ? [years[0]] : [];
}
