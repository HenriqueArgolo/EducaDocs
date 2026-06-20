package br.com.edudocsai.service;

import br.com.edudocsai.entity.BNCCSkill;
import br.com.edudocsai.entity.DocumentType;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class PromptTemplateService {

    private final ObjectMapper objectMapper;

    public String buildPrompt(
            DocumentType documentType,
            List<BNCCSkill> bnccSkills,
            String topic,
            String additionalInstructions
    ) {
        return """
                Voce e um especialista brasileiro em documentos pedagogicos.

                REGRAS OBRIGATORIAS:
                - Use somente as habilidades BNCC fornecidas pelo backend no bloco BNCC_VALIDADA.
                - Nao invente codigos, descricoes, anos, componentes curriculares ou competencias da BNCC.
                - Se precisar citar BNCC, cite exatamente os codigos e descricoes recebidos.
                - Use linguagem pedagogica brasileira formal, clara e adequada a professores.
                - Responda apenas com JSON valido, sem markdown, sem comentarios e sem texto fora do JSON.

                TIPO_DOCUMENTO: %s
                TEMA: %s
                INSTRUCOES_ADICIONAIS: %s

                BNCC_VALIDADA:
                %s

                ESTRUTURA_JSON_OBRIGATORIA:
                %s
                """.formatted(
                documentType.name(),
                topic,
                blankToDefault(additionalInstructions, "Nenhuma."),
                serializeBncc(bnccSkills),
                jsonStructureFor(documentType)
        );
    }

    private String serializeBncc(List<BNCCSkill> skills) {
        List<Map<String, Object>> safeSkills = skills.stream()
                .map(skill -> Map.<String, Object>of(
                        "id", skill.getId(),
                        "code", skill.getCode(),
                        "description", skill.getDescription(),
                        "subject", skill.getSubject(),
                        "grade", skill.getGrade()
                ))
                .toList();
        try {
            return objectMapper.writerWithDefaultPrettyPrinter().writeValueAsString(safeSkills);
        } catch (JsonProcessingException exception) {
            throw new IllegalStateException("Falha ao serializar BNCC validada", exception);
        }
    }

    private String jsonStructureFor(DocumentType documentType) {
        return switch (documentType) {
            case LESSON_PLAN -> """
                    {
                      "titulo": "Plano de aula: <tema>",
                      "tipo": "LESSON_PLAN",
                      "habilidadesBncc": [{"id": 0, "code": "", "description": "", "subject": "", "grade": ""}],
                      "conteudo": {
                        "objetivos": [],
                        "conteudos": [],
                        "metodologia": [],
                        "recursos": [],
                        "desenvolvimento": [{"etapa": "", "tempoMinutos": 0, "descricao": ""}],
                        "avaliacao": [],
                        "adaptacoes": []
                      }
                    }
                    """;
            case EXAM -> """
                    {
                      "titulo": "Prova: <tema>",
                      "tipo": "EXAM",
                      "habilidadesBncc": [{"id": 0, "code": "", "description": "", "subject": "", "grade": ""}],
                      "conteudo": {
                        "orientacoes": "",
                        "questoes": [{"numero": 1, "enunciado": "", "tipo": "objetiva|discursiva", "alternativas": [], "gabarito": "", "criterioCorrecao": ""}]
                      }
                    }
                    """;
            case RUBRIC -> """
                    {
                      "titulo": "Rubrica: <tema>",
                      "tipo": "RUBRIC",
                      "habilidadesBncc": [{"id": 0, "code": "", "description": "", "subject": "", "grade": ""}],
                      "conteudo": {
                        "criterios": [{"criterio": "", "iniciante": "", "emDesenvolvimento": "", "proficiente": "", "avancado": ""}],
                        "orientacoesUso": ""
                      }
                    }
                    """;
            case REPORT -> """
                    {
                      "titulo": "Relatorio pedagogico: <tema>",
                      "tipo": "REPORT",
                      "habilidadesBncc": [{"id": 0, "code": "", "description": "", "subject": "", "grade": ""}],
                      "conteudo": {
                        "contexto": "",
                        "observacoes": [],
                        "analisePedagogica": "",
                        "recomendacoes": [],
                        "proximosPassos": []
                      }
                    }
                    """;
        };
    }

    private String blankToDefault(String value, String defaultValue) {
        return value == null || value.isBlank() ? defaultValue : value.trim();
    }
}
