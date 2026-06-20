# EduDocs AI API Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a functional Spring Boot API for EduDocs AI with JWT auth, BNCC-backed document generation, AI provider fallback, DOCX export, usage limits, tests, and OpenAPI docs.

**Architecture:** Use a pragmatic layered Spring Boot architecture. Controllers stay thin, services own business rules, repositories own persistence, and infrastructure concerns live in config/security/exception packages.

**Tech Stack:** Java 21, Spring Boot 3, Maven, PostgreSQL, Flyway, Spring Security JWT, Spring Data JPA, WebClient, Apache POI, Caffeine, springdoc-openapi, Lombok, JUnit 5, Mockito, Testcontainers, JaCoCo.

---

## File Structure

- Create `pom.xml` with all runtime/test dependencies and JaCoCo 70% verification.
- Create `.env`, `.env.example`, `docker-compose.yml`, `README.md`.
- Create `src/main/resources/application.yml`.
- Create `src/main/resources/db/migration/V1__init.sql` and `V2__seed_bncc.sql`.
- Create main app under `src/main/java/br/com/edudocsai`.
- Create packages: `config`, `controller`, `dto`, `entity`, `exception`, `repository`, `security`, `service`.
- Create tests under `src/test/java/br/com/edudocsai`.

## Tasks

### Task 1: Project Foundation

- [ ] Create Maven build with Spring Boot dependencies.
- [ ] Add environment-driven configuration.
- [ ] Add Docker Compose for PostgreSQL.
- [ ] Add README payload examples.
- [ ] Run `mvn -version` and `mvn test` after foundation files exist.

### Task 2: Domain And Database

- [ ] Write repository/integration tests for BNCC and user persistence.
- [ ] Add JPA entities and enums.
- [ ] Add repositories.
- [ ] Add Flyway migrations and seed data.
- [ ] Run repository tests with Testcontainers.

### Task 3: Security And Auth

- [ ] Write auth flow integration test for register/login.
- [ ] Add JWT service, filter, security config, user details adapter.
- [ ] Add auth DTOs, controller, and service.
- [ ] Verify BCrypt password storage and JWT login response.

### Task 4: BNCC API And Validation

- [ ] Write BNCC validation unit test that rejects missing IDs.
- [ ] Add cached BNCC service.
- [ ] Add BNCC controller for query, get by ID, and admin create/import.
- [ ] Verify frontend can only pass valid IDs to generation flow.

### Task 5: AI And Prompt Services

- [ ] Write AI service unit tests for primary provider success and fallback provider success.
- [ ] Add provider properties and WebClient clients.
- [ ] Add prompt templates by document type.
- [ ] Add JSON extraction and provider failure handling.

### Task 6: Documents And Usage Limits

- [ ] Write DocumentService unit tests for successful generation and daily limit rejection.
- [ ] Add usage limit service.
- [ ] Add document orchestration service.
- [ ] Add document controller with generation, get by ID, user history, and DOCX export endpoints.

### Task 7: DOCX Export

- [ ] Add Apache POI document generator.
- [ ] Add templates for lesson plan, exam, rubric, and report.
- [ ] Verify generated DOCX returns the correct content type.

### Task 8: Global Errors And OpenAPI

- [ ] Add global exception handler.
- [ ] Add OpenAPI configuration and endpoint examples.
- [ ] Verify Swagger paths remain public.

### Task 9: Verification

- [ ] Run `mvn test`.
- [ ] Run `mvn verify`.
- [ ] Fix compilation, test, or coverage failures.
- [ ] Commit the completed project excluding `.env`.
