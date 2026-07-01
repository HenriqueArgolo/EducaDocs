export type UserRole = "ADMIN" | "TEACHER";

export type DocumentType = "LESSON_PLAN" | "EXAM" | "RUBRIC" | "REPORT";

export type PlanningPeriod = "SINGLE" | "WEEKLY" | "MONTHLY";

export type TemplateStyle = "INSTITUTIONAL" | "MODERN" | "MINIMALIST" | "TABLE";

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  createdAt: string;
}

export interface AuthResponse {
  tokenType: string;
  accessToken: string;
  expiresInMinutes: number;
  user: AuthUser;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface BNCCSkill {
  id: number;
  code: string;
  description: string;
  subject: string;
  grade: string;
}

export interface DocumentFormData {
  documentType: DocumentType | null;
  templateStyle: TemplateStyle;
  stage: string | null;
  grade: string | null;
  subject: string | null;
  bnccSkillIds: number[];
  topic: string;
  duration: string;
  additionalInstructions: string;
  numberOfQuestions: number;
  includeHeader: boolean;
  planningPeriod: PlanningPeriod;
  lessonsPerWeek?: number;
  activitySettings: ActivityGenerationSettings;
}

export interface ActivityGenerationSettings {
  activityCount: number;
  exercisesPerActivity: number;
  format: "ESCREVER" | "MARCAR" | "ASSOCIAR" | "COMPLETAR" | "VERDADEIRO_FALSO" | "MISTA";
  purpose: "PRATICA" | "REVISAO" | "DIAGNOSTICA" | "AVALIATIVA";
  difficulty: "APOIO" | "REGULAR" | "DESAFIO";
  modality: "INDIVIDUAL" | "DUPLA" | "GRUPO";
}

export interface GenerateDocumentRequest {
  documentType: DocumentType;
  templateStyle: TemplateStyle;
  bnccSkillIds: number[];
  topic: string;
  grade?: string;
  subject?: string;
  duration?: string;
  additionalInstructions?: string;
  numberOfQuestions?: number;
  includeHeader?: boolean;
  classroomId?: number;
  timelineItemId?: number;
  planningPeriod?: PlanningPeriod;
  lessonsPerWeek?: number;
  activitySettings?: ActivityGenerationSettings;
}

export interface GeneratedDocument {
  id: number;
  userId: number;
  type: DocumentType;
  templateStyle: TemplateStyle;
  title: string;
  grade?: string | null;
  subject?: string | null;
  content: string;
  createdAt: string;
  kitId?: number | null;
  kitStatus?: "GENERATING" | "PARTIAL" | "READY" | null;
  readyMaterialCount?: number | null;
}

export type DocumentHistoryItem = GeneratedDocument;

export interface UserStats {
  totalDocuments: number;
  monthlyDocuments: number;
  lessonPlans: number;
  latestDocuments: number;
}

export interface StructuredDocumentContent {
  title?: string;
  objective?: string;
  bncc_alignment?: string[];
  methodology?: string;
  activities?: string[];
  resources?: string[];
  assessment?: string;
  detailed_content?: string;
  teacher_notes?: string;
  [key: string]: unknown;
}

export const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  LESSON_PLAN: "Plano de aula",
  EXAM: "Prova",
  RUBRIC: "Rubrica",
  REPORT: "Relatorio",
};

export const DOCUMENT_TYPE_SLUGS: Record<DocumentType, string> = {
  LESSON_PLAN: "plano-de-aula",
  EXAM: "prova",
  RUBRIC: "rubrica",
  REPORT: "relatorio",
};

export function documentTypeFromSlug(value: string | null): DocumentType | null {
  if (!value) {
    return null;
  }

  const found = Object.entries(DOCUMENT_TYPE_SLUGS).find(
    ([, slug]) => slug === value
  );

  return found ? (found[0] as DocumentType) : null;
}

export type ActivityType = "COLORING_BOOK" | "WORKSHEET" | "FLASHCARD" | "GAME";

export interface ActivityMaterial {
  id: number;
  title: string;
  description: string;
  type: ActivityType;
  grade: string;
  subject: string;
  content: string; // JSON string
  thumbnailUrl?: string | null;
  isPublic: boolean;
  userId?: number | null;
  createdAt: string;
}

export interface GenerateActivityRequest {
  topic: string;
  type: ActivityType;
  grade: string;
  subject: string;
  additionalInstructions?: string;
  questionFormat?: "MARCAR" | "ESCREVER" | "MISTA";
}

export const ACTIVITY_TYPE_LABELS: Record<ActivityType, string> = {
  COLORING_BOOK: "Livro de colorir",
  WORKSHEET: "Ficha de atividades",
  FLASHCARD: "Fichas de estudo",
  GAME: "Dinâmica e jogos",
};

export const ACTIVITY_TYPE_SLUGS: Record<ActivityType, string> = {
  COLORING_BOOK: "livro-de-colorir",
  WORKSHEET: "ficha-de-atividades",
  FLASHCARD: "fichas-de-estudo",
  GAME: "dinamica-e-jogos",
};

// --- FASE 2: APRESENTAÇÕES E INCLUSÃO (PDI) ---

export type InclusionType = "TDAH" | "AUTISMO" | "DISLEXIA";

export interface AdaptRequest {
  content: string;
  type: InclusionType;
  title: string;
  targetType: "DOCUMENT" | "ACTIVITY";
}

export interface AdaptResponse {
  adaptedTitle: string;
  adaptedContent: string;
}

export type SlideLayout = "title_slide" | "bullet_points" | "text_and_image" | "quote" | "exercise" | "summary" | "comparison" | "numbered_steps" | "timeline" | "grid_cards" | "split_columns" | "highlight_quote";

export interface Slide {
  slide_number: number;
  layout: SlideLayout;
  titulo: string;
  subtitulo?: string;
  pontos: string[];
  notas_professor: string;
  palavras_chave_imagem: string;
  imageUrl?: string; // Loaded dynamically on the client
}

export interface Presentation {
  id: number;
  title: string;
  topic: string;
  grade: string;
  subject: string;
  slidesJson: string; // Serialized list of slides
  createdAt: string;
}

export interface GeneratePresentationRequest {
  topic: string;
  grade: string;
  subject: string;
  additionalInstructions?: string;
}

export interface CreatePresentationRequest {
  title: string;
  topic: string;
  grade: string;
  subject: string;
  slidesJson: string;
}

export interface CreateDocumentRequest {
  title: string;
  type: DocumentType;
  content: string;
  generationRequestId?: number;
}

export interface CreateActivityRequest {
  title: string;
  description?: string;
  type: ActivityType;
  grade: string;
  subject: string;
  content: string;
  thumbnailUrl?: string | null;
  isPublic: boolean;
}

// --- FASE 5: GESTÃO DE TURMAS E ROADMAP ---

export interface Classroom {
  id: number;
  name: string;
  subject: string;
  grade: string;
  createdAt: string;
}

export interface ClassroomStats {
  totalResourcesLinked: number;
  completedResources: number;
  pendingResources: number;
  bnccSkillsAddressed: string[];
}

export type TimelineItemStatus = "PLANNED" | "IN_PROGRESS" | "COMPLETED";

export type TimelineItemType = "PLAN" | "SLIDES" | "ACTIVITY" | "EXAM" | "CUSTOM_EVENT";

export interface ClassroomTimelineItem {
  id: number;
  title: string;
  description?: string;
  orderIndex: number;
  status: TimelineItemStatus;
  type: TimelineItemType;
  documentId?: number;
  kitId?: number;
  activityId?: number;
  presentationId?: number;
  createdAt: string;
  targetDate: string;
}

export interface CreateClassroomRequest {
  name: string;
  subject: string;
  grade: string;
}

export interface CreateTimelineItemRequest {
  title: string;
  description?: string;
  type: TimelineItemType;
  documentId?: number;
  activityId?: number;
  presentationId?: number;
}

export interface ReorderTimelineItemsRequest {
  orderedItemIds: number[];
}

export interface Student {
  id: number;
  classroomId: number;
  name: string;
  needs?: string;
  createdAt: string;
}

export interface CreateStudentRequest {
  name: string;
  needs?: string;
}

export interface GenerateRoadmapRequest {
  theme: string;
  numberOfLessons: number;
  additionalInstructions?: string;
}
