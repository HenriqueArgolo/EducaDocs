# EduDocs AI API

API Spring Boot para gerar documentos pedagogicos com IA usando apenas habilidades BNCC validadas no banco.

## Requisitos

- Docker Desktop para PostgreSQL local.
- JDK 21 para executar a aplicacao e testes.
- Maven global nao e obrigatorio; use `.\mvnw.cmd` no Windows.

## Segredos

Valores sensiveis ficam em `.env`. Use `.env.example` como base para novos ambientes.

## Subir banco

```powershell
docker compose up -d
```

## Rodar API

```powershell
.\mvnw.cmd spring-boot:run
```

Swagger:

- http://localhost:8080/swagger-ui.html

## Exemplos

Registrar professor:

```http
POST /auth/register
Content-Type: application/json

{
  "name": "Maria Silva",
  "email": "maria@escola.com",
  "password": "SenhaForte123!"
}
```

Login:

```http
POST /auth/login
Content-Type: application/json

{
  "email": "maria@escola.com",
  "password": "SenhaForte123!"
}
```

Consultar BNCC:

```http
GET /bncc?grade=5%C2%BA%20ano&subject=Matem%C3%A1tica
Authorization: Bearer <token>
```

Gerar documento:

```http
POST /documents/generate
Authorization: Bearer <token>
Content-Type: application/json

{
  "documentType": "LESSON_PLAN",
  "bnccSkillIds": [1],
  "topic": "Frações equivalentes",
  "duration": "50 minutos",
  "additionalInstructions": "Inclua atividade em duplas e avaliação formativa."
}
```

Exportar DOCX:

```http
GET /documents/1/export.docx
Authorization: Bearer <token>
```
