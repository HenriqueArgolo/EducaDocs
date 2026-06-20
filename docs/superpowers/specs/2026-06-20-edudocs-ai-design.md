# EduDocs AI API Design

## Goal

Build a production-ready Spring Boot API for EduDocs AI, a SaaS that helps Brazilian teachers generate pedagogical documents with AI while enforcing that BNCC skills always come from the database.

## Architecture

The project uses Java 21, Spring Boot 3, Maven, PostgreSQL, Flyway, Spring Security with JWT, Spring Data JPA, WebClient, Apache POI, Caffeine, OpenAPI, JUnit 5, Mockito, Testcontainers, and JaCoCo.

The codebase follows a pragmatic layered architecture:

- `controller`: HTTP endpoints, request validation, no business logic.
- `service`: business rules for auth, BNCC validation, document generation, usage limits, AI calls, and DOCX export.
- `repository`: Spring Data JPA persistence.
- `dto`: request and response contracts.
- `security`: JWT, password encoding, authenticated principal handling, authorization.
- `config`: OpenAPI, WebClient, cache, CORS/application configuration.
- `exception`: global error mapping through `@ControllerAdvice`.

## Domain Model

Core entities:

- `User`: `id`, `name`, `email`, `password`, `role`, `createdAt`.
- `Document`: `id`, `user`, `type`, `title`, `content`, `createdAt`.
- `BNCCSkill`: `id`, `code`, `description`, `subject`, `grade`.
- `GenerationRequest`: `id`, `user`, `documentType`, `bnccSkillIds`, `topic`, `additionalInstructions`, `createdAt`.
- `DailyUsage`: `id`, `user`, `usageDate`, `generationCount`.

Enums:

- `Role`: `ADMIN`, `TEACHER`.
- `DocumentType`: `LESSON_PLAN`, `EXAM`, `RUBRIC`, `REPORT`.

`DailyUsage` supports a simple free-plan rate limit of 20 generations per user per day.

## BNCC Rule

The AI must never invent BNCC data.

The frontend sends only BNCC IDs. The backend loads every requested ID from PostgreSQL and rejects the request when any ID is missing. The prompt receives only validated BNCC fields from the database: code, description, subject, and grade.

BNCC lookups support filtering by grade, subject, and optional code. Repository methods and indexes are created for these filters. Caffeine caches query results and individual BNCC entries.

## AI Integration

`AIService` uses `WebClient` and reads provider settings from environment variables.

Default provider:

- Gemini Flash.

Fallback provider:

- DeepSeek through OpenRouter.

`PromptTemplateService` builds fixed prompts by document type. Required prompt rules:

- Use only BNCC skills provided by the backend.
- Do not invent competencies, codes, grades, or descriptions.
- Use formal Brazilian pedagogical Portuguese.
- Follow a fixed structure per document type.
- Return structured JSON that can be persisted and exported.

If Gemini fails or returns an invalid response, the service calls the fallback provider. If both fail, the API returns a clear upstream AI error without creating a document.

## Document Generation And Export

`DocumentService` coordinates:

1. Authenticated user lookup.
2. Usage limit validation.
3. BNCC ID validation.
4. Generation request persistence.
5. Prompt creation.
6. AI call.
7. Document persistence.

`DocumentGeneratorService` uses Apache POI to export DOCX documents with logical templates for lesson plans, exams, rubrics, and reports.

The API includes `GET /documents/{id}/export.docx` for DOCX export in addition to the required minimum endpoints.

## Security

The API uses JWT stateless authentication.

Public endpoints:

- `POST /auth/register`
- `POST /auth/login`
- Swagger/OpenAPI paths

Protected endpoints:

- BNCC reads require authentication.
- Document generation/history/export require authentication.
- Admin BNCC import/create requires `ADMIN`.

Teachers can read only their own documents. Admins can read any user history.

Passwords are hashed with BCrypt. Secrets such as JWT secret, PostgreSQL password, Gemini key, and OpenRouter key live in `.env`. `.env.example` contains only placeholders.

## Endpoints

Auth:

- `POST /auth/register`
- `POST /auth/login`

BNCC:

- `GET /bncc?grade=&subject=&code=`
- `GET /bncc/{id}`
- `POST /bncc` for admins

Documents:

- `POST /documents/generate`
- `GET /documents/{id}`
- `GET /documents/user/{userId}`
- `GET /documents/{id}/export.docx`

## Error Handling

Global exceptions return consistent JSON:

- `timestamp`
- `status`
- `error`
- `message`
- `path`
- `details`

Validation failures include field-level errors. Authorization failures return 401 or 403. Missing BNCC IDs return 400.

## Tests

Unit tests cover:

- BNCC validation logic.
- `DocumentService` orchestration and usage limit handling.
- `AIService` primary/fallback behavior with mocked WebClient exchange.

Integration tests cover:

- PostgreSQL repositories through Testcontainers.
- Auth registration/login flow.

JaCoCo enforces at least 70% line coverage.

## Delivery

The repository includes:

- Complete Spring Boot Maven project.
- Flyway migrations and minimal BNCC seed data.
- Docker Compose for PostgreSQL.
- `.env` for local sensitive values.
- `.env.example` for safe sharing.
- Swagger/OpenAPI annotations and generated UI.
- Basic payload examples in `README.md`.
