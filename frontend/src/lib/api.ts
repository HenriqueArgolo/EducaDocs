import type {
  AuthResponse,
  AuthUser,
  BNCCSkill,
  GenerateDocumentRequest,
  GeneratedDocument,
  LoginRequest,
  RegisterRequest,
  UserStats,
  ActivityMaterial,
  GenerateActivityRequest,
  ActivityType,
  Presentation,
  GeneratePresentationRequest,
  CreatePresentationRequest,
  AdaptRequest,
  AdaptResponse,
  CreateDocumentRequest,
  CreateActivityRequest,
  Classroom,
  ClassroomStats,
  ClassroomTimelineItem,
  CreateClassroomRequest,
  CreateTimelineItemRequest,
  ReorderTimelineItemsRequest,
  TimelineItemStatus,
  Student,
  CreateStudentRequest,
  GenerateRoadmapRequest,
} from "@/lib/types";
import {
  extractDocumentHistoryItems,
  type DocumentHistoryResponse,
} from "@/lib/document-history";
import type { DocumentHistoryItem } from "@/lib/types";

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") || "/backend";

const TOKEN_KEY = "edudocs.token";
const USER_KEY = "edudocs.user";

// Client-side cache store for GET requests
const apiCache = new Map<string, { data: any; expiresAt: number }>();

export function getCachedData<T>(key: string): T | null {
  const cached = apiCache.get(key);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.data as T;
  }
  apiCache.delete(key);
  return null;
}

export function setCachedData(key: string, data: any, ttl = 2 * 60 * 1000) {
  apiCache.set(key, { data, expiresAt: Date.now() + ttl });
}

export function invalidateCache() {
  apiCache.clear();
}

interface ApiErrorPayload {
  message?: string;
  detail?: string;
  errors?: Record<string, string>;
}

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly payload?: ApiErrorPayload
  ) {
    super(message);
    this.name = "ApiError";
  }
}

function isBrowser() {
  return typeof window !== "undefined";
}

function redirectToLogin() {
  if (!isBrowser() || window.location.pathname === "/login") {
    return;
  }

  window.location.replace("/login");
}

function isJwtExpired(token: string) {
  try {
    const payload = JSON.parse(atob(token.split(".")[1] ?? "")) as {
      exp?: number;
    };

    return typeof payload.exp === "number" && payload.exp * 1000 <= Date.now();
  } catch {
    return true;
  }
}

export function saveSession(auth: AuthResponse) {
  if (!isBrowser()) {
    return;
  }

  localStorage.setItem(TOKEN_KEY, auth.accessToken);
  localStorage.setItem(USER_KEY, JSON.stringify(auth.user));
}

export function clearSession() {
  if (!isBrowser()) {
    return;
  }

  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function getToken() {
  return isBrowser() ? localStorage.getItem(TOKEN_KEY) : null;
}

export function getCurrentUser(): AuthUser | null {
  if (!isBrowser()) {
    return null;
  }

  const token = getToken();
  if (!token || isJwtExpired(token)) {
    clearSession();
    return null;
  }

  const rawUser = localStorage.getItem(USER_KEY);
  if (!rawUser) {
    return null;
  }

  try {
    return JSON.parse(rawUser) as AuthUser;
  } catch {
    clearSession();
    return null;
  }
}

async function readPayload(response: Response) {
  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return response.json();
  }

  return response.text();
}

export async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers = new Headers(options.headers);

  if (!headers.has("Content-Type") && options.body) {
    headers.set("Content-Type", "application/json");
  }

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    clearSession();
    redirectToLogin();
  }

  if (!response.ok) {
    const payload = await readPayload(response).catch(() => undefined);
    const message =
      typeof payload === "object" && payload
        ? (payload as ApiErrorPayload).message ||
          (payload as ApiErrorPayload).detail ||
          "A API retornou um erro."
        : "A API retornou um erro.";

    throw new ApiError(message, response.status, payload as ApiErrorPayload);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return readPayload(response) as Promise<T>;
}

export function register(data: RegisterRequest) {
  return request<AuthResponse>("/auth/register", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function login(data: LoginRequest) {
  return request<AuthResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function fetchBnccSkills(
  params: {
    grade?: string | null;
    subject?: string | null;
    code?: string | null;
  } = {}
) {
  const search = new URLSearchParams();
  if (params.grade) {
    search.set("grade", params.grade);
  }
  if (params.subject) {
    search.set("subject", params.subject);
  }
  if (params.code) {
    search.set("code", params.code);
  }

  const query = search.toString();
  return request<BNCCSkill[]>(`/bncc${query ? `?${query}` : ""}`);
}

export function recommendBnccSkills(data: { grade: string; subject: string; topic: string }) {
  return request<{ recommendedIds: number[] }>("/bncc/recommend", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function generateDocument(data: GenerateDocumentRequest) {
  invalidateCache();
  return request<GeneratedDocument>("/documents/generate", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function saveDocument(data: CreateDocumentRequest) {
  invalidateCache();
  return request<GeneratedDocument>("/documents", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function fetchDocument(id: string | number) {
  const cacheKey = `/documents/${id}`;
  const cached = getCachedData<GeneratedDocument>(cacheKey);
  if (cached) {
    return Promise.resolve(cached);
  }
  return request<GeneratedDocument>(`/documents/${id}`).then((data) => {
    setCachedData(cacheKey, data);
    return data;
  });
}

export function updateDocument(id: string | number, data: { title: string; content: string }) {
  invalidateCache();
  apiCache.delete(`/documents/${id}`);
  return request<GeneratedDocument>(`/documents/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function fetchUserDocuments(userId: number) {
  const cacheKey = `/documents/user/${userId}`;
  const cached = getCachedData<DocumentHistoryItem[]>(cacheKey);
  if (cached) {
    return Promise.resolve(cached);
  }
  const payload = await request<DocumentHistoryResponse>(`/documents/user/${userId}`);
  const items = extractDocumentHistoryItems(payload);
  setCachedData(cacheKey, items);
  return items;
}

export async function downloadDocumentDocx(id: string | number, title: string, style?: string) {
  const token = getToken();
  const headers = new Headers();
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const exportUrl = style
    ? `${API_BASE_URL}/documents/${id}/export.docx?style=${style}`
    : `${API_BASE_URL}/documents/${id}/export.docx`;

  const response = await fetch(exportUrl, {
    headers,
  });

  if (!response.ok) {
    throw new ApiError("Nao foi possivel exportar o documento.", response.status);
  }

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${title.replace(/[^\w\s-]/g, "").trim() || "documento"}.docx`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export function buildUserStats(documents: DocumentHistoryItem[]): UserStats {
  const now = new Date();

  return {
    totalDocuments: documents.length,
    monthlyDocuments: documents.filter((doc) => {
      const createdAt = new Date(doc.createdAt);
      return (
        createdAt.getMonth() === now.getMonth() &&
        createdAt.getFullYear() === now.getFullYear()
      );
    }).length,
    lessonPlans: documents.filter((doc) => doc.type === "LESSON_PLAN").length,
    latestDocuments: documents.slice(0, 5).length,
  };
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  empty: boolean;
}

export function fetchActivities(params: {
  type?: ActivityType | null;
  grade?: string | null;
  subject?: string | null;
  search?: string | null;
  page?: number;
  size?: number;
} = {}) {
  const search = new URLSearchParams();
  if (params.type) search.set("type", params.type);
  if (params.grade) search.set("grade", params.grade);
  if (params.subject) search.set("subject", params.subject);
  if (params.search) search.set("search", params.search);
  if (params.page !== undefined) search.set("page", String(params.page));
  if (params.size !== undefined) search.set("size", String(params.size));

  const query = search.toString();
  const cacheKey = `/activities?${query}`;
  const cached = getCachedData<PageResponse<ActivityMaterial>>(cacheKey);
  if (cached) {
    return Promise.resolve(cached);
  }

  return request<PageResponse<ActivityMaterial>>(`/activities${query ? `?${query}` : ""}`).then((data) => {
    setCachedData(cacheKey, data);
    return data;
  });
}

export function fetchActivity(id: string | number) {
  const cacheKey = `/activities/${id}`;
  const cached = getCachedData<ActivityMaterial>(cacheKey);
  if (cached) {
    return Promise.resolve(cached);
  }
  return request<ActivityMaterial>(`/activities/${id}`).then((data) => {
    setCachedData(cacheKey, data);
    return data;
  });
}

export function generateActivity(data: GenerateActivityRequest) {
  invalidateCache();
  return request<ActivityMaterial>("/activities/generate", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function deleteActivity(id: string | number) {
  invalidateCache();
  return request<void>(`/activities/${id}`, {
    method: "DELETE",
  });
}

// --- FASE 2: APRESENTAÇÕES (SLIDES) ---

export function fetchPresentations(params: {
  search?: string | null;
  page?: number;
  size?: number;
} = {}) {
  const search = new URLSearchParams();
  if (params.search) search.set("search", params.search);
  if (params.page !== undefined) search.set("page", String(params.page));
  if (params.size !== undefined) search.set("size", String(params.size));

  const query = search.toString();
  const cacheKey = `/presentations?${query}`;
  const cached = getCachedData<PageResponse<Presentation>>(cacheKey);
  if (cached) {
    return Promise.resolve(cached);
  }

  return request<PageResponse<Presentation>>(`/presentations${query ? `?${query}` : ""}`).then((data) => {
    setCachedData(cacheKey, data);
    return data;
  });
}

export function fetchPresentation(id: string | number) {
  const cacheKey = `/presentations/${id}`;
  const cached = getCachedData<Presentation>(cacheKey);
  if (cached) {
    return Promise.resolve(cached);
  }
  return request<Presentation>(`/presentations/${id}`).then((data) => {
    setCachedData(cacheKey, data);
    return data;
  });
}

export function generatePresentation(data: GeneratePresentationRequest) {
  invalidateCache();
  return request<Presentation>("/presentations/generate", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function savePresentation(data: CreatePresentationRequest) {
  invalidateCache();
  return request<Presentation>("/presentations", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function deletePresentation(id: string | number) {
  invalidateCache();
  return request<void>(`/presentations/${id}`, {
    method: "DELETE",
  });
}

// --- FASE 2: ADAPTADOR DE INCLUSÃO (PDI) ---

export function adaptForInclusion(data: AdaptRequest) {
  invalidateCache();
  return request<AdaptResponse>("/inclusion/adapt", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function saveActivity(data: CreateActivityRequest) {
  invalidateCache();
  return request<ActivityMaterial>("/activities", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function fetchActivityPdfBlobUrl(id: string | number): Promise<string> {
  const token = getToken();
  const headers = new Headers();
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE_URL}/activities/${id}/pdf`, {
    headers,
  });

  if (!response.ok) {
    throw new ApiError("Não foi possível carregar o PDF.", response.status);
  }

  const blob = await response.blob();
  return URL.createObjectURL(blob);
}

// --- FASE 5: GESTÃO DE TURMAS E ROADMAP ---

export function fetchClassrooms() {
  return request<Classroom[]>("/classrooms");
}

export function createClassroom(data: CreateClassroomRequest) {
  return request<Classroom>("/classrooms", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function fetchClassroomRoadmap(classroomId: number | string) {
  return request<ClassroomTimelineItem[]>(`/classrooms/${classroomId}/roadmap`);
}

export function fetchClassroomStats(classroomId: number | string) {
  return request<ClassroomStats>(`/classrooms/${classroomId}/stats`);
}

export function addTimelineItem(classroomId: number | string, data: CreateTimelineItemRequest) {
  return request<ClassroomTimelineItem>(`/classrooms/${classroomId}/roadmap/items`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function reorderTimelineItems(classroomId: number | string, data: ReorderTimelineItemsRequest) {
  return request<void>(`/classrooms/${classroomId}/roadmap/items/reorder`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export function changeTimelineItemStatus(
  classroomId: number | string,
  itemId: number | string,
  status: TimelineItemStatus
) {
  return request<ClassroomTimelineItem>(`/classrooms/${classroomId}/roadmap/items/${itemId}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

export function updateTimelineItemDate(
  classroomId: number | string,
  itemId: number | string,
  date: string
) {
  return request<ClassroomTimelineItem>(`/classrooms/${classroomId}/roadmap/items/${itemId}/date`, {
    method: "PATCH",
    body: JSON.stringify({ date }),
  });
}

export function updateTimelineItem(
  classroomId: number | string,
  itemId: number | string,
  data: CreateTimelineItemRequest
) {
  return request<ClassroomTimelineItem>(`/classrooms/${classroomId}/roadmap/items/${itemId}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export function deleteTimelineItem(
  classroomId: number | string,
  itemId: number | string
) {
  return request<void>(`/classrooms/${classroomId}/roadmap/items/${itemId}`, {
    method: "DELETE",
  });
}

export function generateClassroomRoadmap(
  classroomId: number | string,
  data: GenerateRoadmapRequest
) {
  return request<ClassroomTimelineItem[]>(`/classrooms/${classroomId}/roadmap/generate`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function fetchClassroomStudents(classroomId: number | string) {
  return request<Student[]>(`/classrooms/${classroomId}/students`);
}

export function addStudent(classroomId: number | string, data: CreateStudentRequest) {
  return request<Student>(`/classrooms/${classroomId}/students`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updateStudent(
  classroomId: number | string,
  studentId: number | string,
  data: CreateStudentRequest
) {
  return request<Student>(`/classrooms/${classroomId}/students/${studentId}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export function deleteStudent(classroomId: number | string, studentId: number | string) {
  return request<void>(`/classrooms/${classroomId}/students/${studentId}`, {
    method: "DELETE",
  });
}

export async function downloadClassroomPortfolio(classroomId: number | string, title: string) {
  const token = getToken();
  const headers = new Headers();
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE_URL}/classrooms/${classroomId}/export-portfolio`, {
    headers,
  });

  if (!response.ok) {
    throw new ApiError("Não foi possível exportar o portfólio da turma.", response.status);
  }

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `portfolio-pedagogico-${title.replace(/[^\w\s-]/g, "").trim() || "turma"}.docx`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
