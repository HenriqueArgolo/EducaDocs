package br.com.edudocsai.service.lessonkit;

import br.com.edudocsai.dto.lessonkit.RegenerateLessonKitMaterialRequest;
import br.com.edudocsai.entity.Document;
import br.com.edudocsai.entity.LessonKitMaterialType;
import br.com.edudocsai.exception.BadRequestException;
import br.com.edudocsai.service.PromptBuilderHelper;
import br.com.edudocsai.service.PromptBuilderHelper.GradeLevel;
import br.com.edudocsai.service.PromptModuleCatalog;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class LessonKitPromptBuilder {
    private final PromptModuleCatalog modules;
    private final PromptBuilderHelper promptBuilderHelper;

    public String completeKit(Document plan) {
        String grade = plan.getGenerationRequest() != null ? plan.getGenerationRequest().getGrade() : null;
        GradeLevel level = promptBuilderHelper.classifyGrade(grade);
        String basePrompt = modules.basePrompt();
        String persona = modules.personaPrompt(level, grade);
        String task = modules.lessonKitTaskPrompt();

        return basePrompt + "\n\n" + persona + "\n\n" + task + "\n\nPLANO DE AULA DE REFERÊNCIA:\n" + plan.getContent();
    }

    public String singleMaterial(Document plan, LessonKitMaterialType type,
                                 RegenerateLessonKitMaterialRequest request) {
        if (type == LessonKitMaterialType.LESSON_PLAN) {
            throw new BadRequestException("Tipo de material inválido para kit secundário");
        }
        String grade = plan.getGenerationRequest() != null ? plan.getGenerationRequest().getGrade() : null;
        GradeLevel level = promptBuilderHelper.classifyGrade(grade);
        String basePrompt = modules.basePrompt();
        String persona = modules.personaPrompt(level, grade);
        String task = singleMaterialTaskPrompt(type, request);

        return basePrompt + "\n\n" + persona + "\n\n" + task + "\n\nPLANO DE AULA DE REFERÊNCIA:\n" + plan.getContent();
    }

    private String singleMaterialTaskPrompt(LessonKitMaterialType type, RegenerateLessonKitMaterialRequest request) {
        StringBuilder sb = new StringBuilder();
        sb.append("Você deve retornar OBRIGATORIAMENTE um objeto JSON estruturado no formato definido abaixo, contendo apenas a chave do material solicitado dentro do objeto 'kitAulaCompleta'. Não use markdown ou textos explicativos.\n\n");

        switch (type) {
            case STUDENT_ACTIVITY -> {
                sb.append("### DIRETRIZES DE QUALIDADE PEDAGÓGICA PARA A ATIVIDADE DO ALUNO:\n")
                  .append("- Crie um título engajador, lúdico e adequado à faixa etária dos alunos.\n")
                  .append("- Escreva um breve parágrafo de introdução lúdica ao tema da aula, conectando com a realidade do aluno.\n")
                  .append("- Forneça instruções passo a passo em tom amigável. Se for alfabetização inicial, use CAIXA ALTA.\n")
                  .append("- Crie de 3 a 5 desafios formatados como lista de strings em ordem crescente de complexidade (scaffolding).\n")
                  .append("- Descreva o produto esperado que o aluno entregará ao final.\n\n");

                if (request != null) {
                    sb.append("CONFIGURAÇÃO OBRIGATÓRIA DA ATIVIDADE:\n")
                      .append("- Quantidade de folhas independentes: ").append(request.activityCount()).append("\n")
                      .append("- Exercícios em cada folha: ").append(request.exercisesPerActivity()).append("\n")
                      .append("- Formato: ").append(request.format()).append("\n")
                      .append("- Finalidade: ").append(request.purpose()).append("\n")
                      .append("- Dificuldade: ").append(request.difficulty()).append("\n")
                      .append("- Modalidade: ").append(request.modality()).append("\n\n");
                }

                sb.append("SCHEMA JSON DE RESPOSTA OBRIGATÓRIO:\n")
                  .append("{\n")
                  .append("  \"kitAulaCompleta\": {\n")
                  .append("    \"atividadeAluno\": {\n")
                  .append("      \"titulo\": \"Título da Atividade\",\n")
                  .append("      \"contexto\": \"Texto de contextualização lúdica...\",\n")
                  .append("      \"orientacoes\": [\"Orientação 1...\", \"Orientação 2...\"],\n")
                  .append("      \"questoes\": [\"1. Questão 1...\", \"2. Questão 2...\"],\n")
                  .append("      \"produtoEsperado\": \"Descrição do produto final esperado...\"\n")
                  .append("    }\n")
                  .append("  }\n")
                  .append("}\n");
            }
            case TEACHER_ANSWER_KEY -> {
                sb.append("### DIRETRIZES DE QUALIDADE PEDAGÓGICA PARA O GABARITO DO PROFESSOR:\n")
                  .append("- Forneça respostas completas e explicativas para cada uma das questões criadas na atividade, detalhando a lógica correta.\n")
                  .append("- Mapeie pelo menos 2 equívocos comuns de raciocínio (misconceptions) dos alunos para essa idade, e como intervir corretivamente.\n")
                  .append("- Sugira perguntas de sondagem rápida.\n\n")
                  .append("SCHEMA JSON DE RESPOSTA OBRIGATÓRIO:\n")
                  .append("{\n")
                  .append("  \"kitAulaCompleta\": {\n")
                  .append("    \"gabaritoProfessor\": {\n")
                  .append("      \"respostasEsperadas\": [\"Resposta 1...\", \"Resposta 2...\"],\n")
                  .append("      \"orientacoesProfessor\": [\"Alerta de erro 1...\", \"Como intervir...\", \"Sugestão de pergunta oral...\"]\n")
                  .append("    }\n")
                  .append("  }\n")
                  .append("}\n");
            }
            case ASSESSMENT -> {
                sb.append("### DIRETRIZES DE QUALIDADE PEDAGÓGICA PARA O INSTRUMENTO AVALIATIVO:\n")
                  .append("- Crie critérios observáveis de avaliação com níveis claros de proficiência baseados na BNCC.\n")
                  .append("- Sugira dinâmicas ativas de acompanhamento durante a realização da atividade.\n\n")
                  .append("SCHEMA JSON DE RESPOSTA OBRIGATÓRIO:\n")
                  .append("{\n")
                  .append("  \"kitAulaCompleta\": {\n")
                  .append("    \"instrumentoAvaliativo\": {\n")
                  .append("      \"criterios\": [\"Critério observável 1...\", \"Critério observável 2...\"],\n")
                  .append("      \"coletaEvidencias\": [\"Método de coleta 1...\", \"Método de coleta 2...\"]\n")
                  .append("    }\n")
                  .append("  }\n")
                  .append("}\n");
            }
            case PEDAGOGICAL_EVIDENCE -> {
                sb.append("### DIRETRIZES DE QUALIDADE PEDAGÓGICA PARA AS EVIDÊNCIAS PEDAGÓGICAS:\n")
                  .append("- Descreva produções, gestos ou falas observáveis dos alunos que comprovam que a habilidade BNCC foi desenvolvida.\n")
                  .append("- Sugira registros práticos para portfólio ou relatórios oficiais da coordenação pedagógica.\n\n")
                  .append("SCHEMA JSON DE RESPOSTA OBRIGATÓRIO:\n")
                  .append("{\n")
                  .append("  \"kitAulaCompleta\": {\n")
                  .append("    \"evidenciasPedagogicas\": {\n")
                  .append("      \"evidenciasObservaveis\": [\"Evidência observável 1...\", \"Evidência observável 2...\"],\n")
                  .append("      \"registrosParaCoordenacao\": [\"Registro para coordenação 1...\", \"Registro para coordenação 2...\"]\n")
                  .append("    }\n")
                  .append("  }\n")
                  .append("}\n");
            }
            case INCLUSIVE_ADAPTATIONS -> {
                sb.append("### DIRETRIZES DE QUALIDADE PEDAGÓGICA PARA AS ADAPTAÇÕES INCLUSIVAS:\n")
                  .append("- Forneça adaptações textuais para alunos com TDAH ou Dislexia (negrito nos termos-chave, instruções curtas e diretas).\n")
                  .append("- Indique orientações de mediação para alunos autistas ou com deficiência de atenção (hiperfocos e pareamento).\n")
                  .append("- Forneça versões alternativas simplificadas (ex: múltipla escolha ou desenhos).\n\n")
                  .append("SCHEMA JSON DE RESPOSTA OBRIGATÓRIO:\n")
                  .append("{\n")
                  .append("  \"kitAulaCompleta\": {\n")
                  .append("    \"adaptacoesInclusivas\": {\n")
                  .append("      \"apoioLeitura\": [\"Instrução adaptada 1...\"],\n")
                  .append("      \"apoioParticipacao\": [\"Orientação de pareamento 1...\"],\n")
                  .append("      \"alternativasSimplificadas\": [\"Exercício simplificado 1...\"]\n")
                  .append("    }\n")
                  .append("  }\n")
                  .append("}\n");
            }
            default -> throw new BadRequestException("Tipo de material inválido");
        }
        return sb.toString();
    }
}
