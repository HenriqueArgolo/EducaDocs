# Kit Material Full Editor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Abrir todo material pronto do kit no editor completo de documentos, com salvamento no material correto, Word e PDF reais.

**Architecture:** Um adaptador transforma o material do kit em documento virtual sem duplicá-lo no banco. A tela de documento detecta `kit` e `material` na query e troca carregamento, salvamento, exportação e impressão para as APIs do kit, mantendo a mesma interface visual.

**Tech Stack:** Next.js 16, React 19, TypeScript, API REST Spring Boot, testes de contrato Node.

---

### Task 1: Contrato de URL e conteúdo virtual

**Files:**
- Create: `frontend/src/lib/kit-material-editor.ts`
- Modify: `frontend/scripts/lesson-kit-ui.test.mjs`

- [ ] **Step 1: Escrever testes falhando**

Exigir que os links usem `/dashboard/document/{id}?kit={kitId}&material={type}`, que o hub não mantenha modal de material e que o adaptador preserve o JSON ao empacotar/desempacotar.

- [ ] **Step 2: Executar o teste e confirmar RED**

Run: `node --experimental-strip-types scripts/lesson-kit-ui.test.mjs`

Expected: FAIL porque o adaptador e os novos links ainda não existem.

- [ ] **Step 3: Implementar o adaptador mínimo**

Criar `lessonKitMaterialEditorHref`, `wrapLessonKitMaterialContent`, `unwrapLessonKitMaterialContent` e `toKitMaterialEditorDocument`, com metadados explícitos para os cinco tipos derivados.

- [ ] **Step 4: Executar o teste e confirmar GREEN do adaptador**

Run: `node --experimental-strip-types scripts/lesson-kit-ui.test.mjs`

Expected: avançar até a próxima expectativa de navegação.

### Task 2: Todos os pontos de abertura levam ao editor

**Files:**
- Modify: `frontend/src/components/lesson-kit/LessonKitHub.tsx`
- Modify: `frontend/src/components/classroom/ClassroomKitDropdown.tsx`
- Modify: `frontend/src/app/dashboard/kit/[id]/page.tsx`

- [ ] **Step 1: Substituir o modal do hub por links**

Todo botão `Abrir` usa `lessonKitMaterialEditorHref`. Configuração, regeneração e download permanecem no hub.

- [ ] **Step 2: Atualizar o dropdown da turma**

Plano e derivados usam o mesmo helper, impedindo a parada intermediária no hub.

- [ ] **Step 3: Redirecionar links antigos**

Uma URL antiga `/dashboard/kit/{kitId}?material={type}` redireciona ao editor completo.

- [ ] **Step 4: Executar contrato**

Run: `node --experimental-strip-types scripts/lesson-kit-ui.test.mjs`

Expected: PASS para navegação e ausência do modal.

### Task 3: Renderizar e editar um material isolado

**Files:**
- Modify: `frontend/src/lib/document-rendering.ts`
- Modify: `frontend/src/app/dashboard/document/[id]/page.tsx`

- [ ] **Step 1: Fazer o renderizador aceitar o tipo do material**

`buildPrintableDocument(document, materialType)` retorna somente as seções do material e reconhece o invólucro `kitAulaCompleta` usado pelo editor.

- [ ] **Step 2: Carregar modo material na tela de documento**

Ler `kit` e `material`, buscar documento de origem e kit, validar status `READY` e montar documento virtual.

- [ ] **Step 3: Direcionar salvamento corretamente**

No modo material, desempacotar o JSON e chamar `updateLessonKitMaterial(kitId, type, content, version)`. O documento de origem nunca é sobrescrito.

- [ ] **Step 4: Direcionar ações de arquivo**

Word usa `downloadLessonKitMaterial`; impressão usa `fetchLessonKitMaterialPdfUrl`. O plano original mantém o fluxo existente.

- [ ] **Step 5: Preservar recursos da tela**

Manter cabeçalho, vínculo com turma e inclusão; ocultar apenas o painel “Criar kit completo” quando estiver em material derivado.

### Task 4: Verificação

**Files:**
- Modify: `frontend/scripts/lesson-kit-ui.test.mjs`

- [ ] **Step 1: Rodar contrato e lint focado**

Run: `node --experimental-strip-types scripts/lesson-kit-ui.test.mjs`

Run: `npx eslint src/lib/kit-material-editor.ts src/lib/document-rendering.ts src/components/lesson-kit/LessonKitHub.tsx src/components/classroom/ClassroomKitDropdown.tsx 'src/app/dashboard/document/[id]/page.tsx' 'src/app/dashboard/kit/[id]/page.tsx'`

- [ ] **Step 2: Rodar build de produção**

Run: `npm run build`

Expected: exit code 0.

- [ ] **Step 3: Rodar suíte backend**

Run: `.\\mvnw.cmd test`

Expected: zero failures e zero errors.

- [ ] **Step 4: Conferir diff**

Run: `git diff --check`

Expected: nenhuma falha de whitespace.

