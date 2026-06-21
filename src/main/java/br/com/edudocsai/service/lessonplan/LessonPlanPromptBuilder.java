package br.com.edudocsai.service.lessonplan;

import br.com.edudocsai.entity.BNCCSkill;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class LessonPlanPromptBuilder {

    public String build(LessonPlanRequestContext context, List<BNCCSkill> skills) {
        return """
                Voce e um especialista em planejamento pedagogico brasileiro.

                O sistema ja definiu tema, disciplina, ano, BNCC, duracao total e template final.
                A IA deve preencher somente o conteudo interno solicitado.

                Dados imutaveis do sistema:
                Tema: %s
                Ano escolar: %s
                Disciplina: %s
                Duracao total: %d min
                Habilidades BNCC:
                %s

                Regras obrigatorias:
                - nao altere tema, ano, disciplina, BNCC ou duracao total.
                - nao crie secoes finais do documento.
                - nao crie habilidades BNCC novas.
                - use linguagem profissional de professor experiente.
                - retorne apenas JSON valido.
                - use exatamente os campos do schema abaixo.

                Schema de resposta:
                {
                  "objectives": ["Identificar conceitos essenciais do tema", "Comparar informacoes relacionadas ao tema", "Resolver atividade aplicada ao tema"],
                  "contents": ["Conteudo 1", "Conteudo 2", "Conteudo 3"],
                  "methodology": {
                    "introduction": {"durationMinutes": 10, "description": "Contextualizacao, pergunta disparadora e conhecimentos previos"},
                    "development": {"durationMinutes": 30, "description": "Explicacao, atividade pratica e participacao ativa"},
                    "closing": {"durationMinutes": 10, "description": "Sintese, retomada dos objetivos e conclusao"}
                  },
                  "resources": ["Recurso 1", "Recurso 2", "Recurso 3"],
                  "evaluation": {
                    "observableCriteria": ["Criterio observavel 1", "Criterio observavel 2", "Criterio observavel 3"]
                  }
                }

                Contexto adicional do professor:
                %s
                """.formatted(
                context.topic(),
                context.grade(),
                context.subject(),
                context.totalMinutes(),
                formatSkills(skills),
                context.additionalInstructions() == null ? "Nenhum." : context.additionalInstructions()
        );
    }

    private String formatSkills(List<BNCCSkill> skills) {
        return skills.stream()
                .map(skill -> "- %s - %s".formatted(skill.getCode(), skill.getDescription()))
                .collect(Collectors.joining("\n"));
    }
}
