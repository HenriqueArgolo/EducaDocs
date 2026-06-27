# Generated Activity Images Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Generate, validate, cache, persist, and render printable worksheet illustrations with `gemini-3.1-flash-image` inside the existing activity generation flow.

**Architecture:** The text model remains responsible for pedagogical JSON. A separate image pipeline extracts visual descriptors, resolves cached assets or generates 512px PNGs, validates them, stores accepted assets in PostgreSQL, and injects `imagemUrl` into the JSON before the activity is saved. The frontend renders generated URLs first and retains current icons and searches as fallbacks.

**Tech Stack:** Java 17, Spring Boot 3, WebClient, Jackson, JPA/PostgreSQL/Flyway, JUnit 5/Mockito, Next.js 16, React 19, TypeScript.

---

### Task 1: Image Provider Configuration And Client

**Files:**
- Create: `src/main/java/br/com/edudocsai/config/ImageGenerationProperties.java`
- Create: `src/main/java/br/com/edudocsai/service/GeminiImageClient.java`
- Create: `src/test/java/br/com/edudocsai/service/GeminiImageClientTest.java`
- Modify: `src/main/resources/application.yml`

- [ ] **Step 1: Write failing client tests**

Cover the exact request contract and response parser:

```java
assertThat(requestBody).contains("gemini-3.1-flash-image", "\"image_size\":\"512\"");
assertThat(result.mimeType()).isEqualTo("image/jpeg");
assertThat(result.bytes()).containsExactly(expectedBytes);
```

- [ ] **Step 2: Run the focused test and confirm failure**

Run: `./mvnw -Dtest=GeminiImageClientTest test`

Expected: compilation failure because `GeminiImageClient` does not exist.

- [ ] **Step 3: Implement configuration and REST client**

Configure these defaults:

```yaml
edudocs:
  ai:
    image:
      enabled: ${GEMINI_IMAGE_ENABLED:true}
      base-url: ${GEMINI_BASE_URL:https://generativelanguage.googleapis.com}
      api-key: ${GEMINI_API_KEY:}
      model: ${GEMINI_IMAGE_MODEL:gemini-3.1-flash-image}
      image-size: ${GEMINI_IMAGE_SIZE:512}
      max-attempts: ${GEMINI_IMAGE_MAX_ATTEMPTS:3}
      max-assets-per-activity: ${GEMINI_IMAGE_MAX_ASSETS:8}
      max-concurrency: ${GEMINI_IMAGE_MAX_CONCURRENCY:2}
```

POST `/v1beta/interactions` with `x-goog-api-key`, `response_format.type=image`, `mime_type=image/jpeg`, `aspect_ratio=1:1`, `image_size=512`, and `store=false`. Parse the last `steps[].content[]` block whose type is `image`.

- [ ] **Step 4: Run the focused test**

Run: `./mvnw -Dtest=GeminiImageClientTest test`

Expected: all client tests pass.

### Task 2: Persistent Cache And Binary Validation

**Files:**
- Create: `src/main/resources/db/migration/V14__create_generated_image_assets.sql`
- Create: `src/main/java/br/com/edudocsai/entity/GeneratedImageAsset.java`
- Create: `src/main/java/br/com/edudocsai/repository/GeneratedImageAssetRepository.java`
- Create: `src/main/java/br/com/edudocsai/service/ImageBinaryValidator.java`
- Create: `src/test/java/br/com/edudocsai/service/ImageBinaryValidatorTest.java`

- [ ] **Step 1: Write failing validator tests**

Generate in-memory PNGs and verify acceptance of a centered black outline on white, rejection of an all-white image, and rejection when dark pixels touch too much of the border.

- [ ] **Step 2: Run the validator test and confirm failure**

Run: `./mvnw -Dtest=ImageBinaryValidatorTest test`

Expected: compilation failure because the validator does not exist.

- [ ] **Step 3: Add the migration, entity, repository, and validator**

The table must include a unique 64-character SHA-256 cache key and `BYTEA` image data. Validation must use `ImageIO`, inspect brightness and edge occupancy, and return a typed result containing approval, reason, width, and height.

- [ ] **Step 4: Run focused tests**

Run: `./mvnw -Dtest=ImageBinaryValidatorTest test`

Expected: all validator tests pass.

### Task 3: Semantic Validation And Cached Resolution

**Files:**
- Create: `src/main/java/br/com/edudocsai/service/GeminiImageQualityValidator.java`
- Create: `src/main/java/br/com/edudocsai/service/GeneratedImageAssetService.java`
- Create: `src/test/java/br/com/edudocsai/service/GeminiImageQualityValidatorTest.java`
- Create: `src/test/java/br/com/edudocsai/service/GeneratedImageAssetServiceTest.java`

- [ ] **Step 1: Write failing cache, retry, and semantic parser tests**

Verify cache hits never call the image API, cache misses persist approved images, failed validation retries up to the configured limit, and provider failure returns an empty result instead of failing the activity.

- [ ] **Step 2: Run focused tests and confirm failure**

Run: `./mvnw -Dtest=GeminiImageQualityValidatorTest,GeneratedImageAssetServiceTest test`

Expected: compilation failure because the services do not exist.

- [ ] **Step 3: Implement semantic validation and cache resolution**

The semantic validator sends the image to the configured Gemini text model and requests strict JSON with `subjectMatch`, `noText`, `isolated`, `printable`, and `reason`. The asset service builds the canonical line-art prompt, hashes model + size + style version + normalized subject, retries generation, and stores only approved assets.

- [ ] **Step 4: Run focused tests**

Run: `./mvnw -Dtest=GeminiImageQualityValidatorTest,GeneratedImageAssetServiceTest test`

Expected: all tests pass.

### Task 4: JSON Enrichment And Activity Generation Integration

**Files:**
- Create: `src/main/java/br/com/edudocsai/config/ImageGenerationConfig.java`
- Create: `src/main/java/br/com/edudocsai/service/ActivityImageEnricher.java`
- Create: `src/test/java/br/com/edudocsai/service/ActivityImageEnricherTest.java`
- Modify: `src/main/java/br/com/edudocsai/service/ActivityMaterialService.java`
- Modify: `src/test/java/br/com/edudocsai/service/ActivityMaterialServiceTest.java`

- [ ] **Step 1: Write failing enrichment tests**

Use JSON containing repeated `figura` values and a `descricao_desenho`. Assert that each unique descriptor resolves once, every matching node receives `/images/generated/{id}`, existing image URLs are preserved, and more than eight unique descriptors are capped.

- [ ] **Step 2: Run focused tests and confirm failure**

Run: `./mvnw -Dtest=ActivityImageEnricherTest,ActivityMaterialServiceTest test`

Expected: compilation or assertion failure before integration.

- [ ] **Step 3: Implement recursive enrichment with bounded concurrency**

Use a two-thread `ThreadPoolTaskExecutor`. Collect descriptor nodes first, resolve unique assets concurrently, then mutate the Jackson tree on the request thread. Return the original JSON on configuration or provider failure.

- [ ] **Step 4: Integrate after early-literacy normalization and before persistence**

```java
jsonResult = activityImageEnricher.enrich(jsonResult, request.grade(), request.topic());
```

- [ ] **Step 5: Run focused tests**

Run: `./mvnw -Dtest=ActivityImageEnricherTest,ActivityMaterialServiceTest test`

Expected: all tests pass.

### Task 5: Generated Image HTTP Endpoint

**Files:**
- Create: `src/main/java/br/com/edudocsai/controller/GeneratedImageController.java`
- Create: `src/test/java/br/com/edudocsai/controller/GeneratedImageControllerTest.java`

- [ ] **Step 1: Write a failing controller test**

Assert status 200, persisted MIME type, bytes, and long-lived immutable cache headers. Assert 404 for an unknown ID.

- [ ] **Step 2: Run and confirm failure**

Run: `./mvnw -Dtest=GeneratedImageControllerTest test`

- [ ] **Step 3: Implement `GET /images/generated/{id}`**

Return `Cache-Control: public, max-age=31536000, immutable`. Keep the route under the already-public `/images/**` security rule.

- [ ] **Step 4: Run focused tests**

Run: `./mvnw -Dtest=GeneratedImageControllerTest test`

Expected: all tests pass.

### Task 6: Frontend Rendering And Fallbacks

**Files:**
- Create: `src/lib/activity-images.ts`
- Create: `scripts/activity-images.test.mjs`
- Modify: `src/lib/early-literacy.ts`
- Modify: `src/app/dashboard/library/[id]/page.tsx`
- Modify: `src/app/dashboard/library/page.tsx`
- Modify: `package.json`

- [ ] **Step 1: Write failing helper tests**

Test field priority (`imagemUrl`, then `imageUrl`), conversion of backend-relative paths to absolute API URLs, and preservation of external URLs.

- [ ] **Step 2: Run and confirm failure**

Run: `npm run test:activity-images`

Expected: failure because the helper does not exist.

- [ ] **Step 3: Implement helpers and generated-image rendering**

Pass generated URLs into every `LiteracyFigureTile`. For coloring books, preload `page.imagemUrl`, skip external search, and do not apply the photo-outline filter to generated line art. Continue using Lucide/SVG/search only when no generated URL exists.

- [ ] **Step 4: Update generation feedback**

While `isGenerating` is true, describe that the system is creating the structure and illustrations; keep the submit button disabled.

- [ ] **Step 5: Run frontend tests and build**

Run: `npm run test:activity-images && npm run test:early-literacy && npm run build`

Expected: all tests pass and the production build succeeds.

### Task 7: Full Verification And Real Generation

**Files:**
- No new source files expected.

- [ ] **Step 1: Run backend verification**

Run: `./mvnw test`

Expected: zero failures.

- [ ] **Step 2: Run frontend verification**

Run: `npm run test:activity-images && npm run test:early-literacy && npm run build`

Expected: zero failures and successful build.

- [ ] **Step 3: Run one real API generation**

With `GEMINI_API_KEY` configured, generate one 512px farm-animal line drawing. Confirm PNG decoding, semantic validation, database persistence, and cache hit on the second request.

- [ ] **Step 4: Generate a real first-grade activity and inspect its PDF**

Use the **Gerar Atividade com IA** flow with the farm-animal theme. Render the resulting PDF to PNG and confirm recognizable drawings, white backgrounds, readable commands, stable spacing, and no clipping or overlap.
